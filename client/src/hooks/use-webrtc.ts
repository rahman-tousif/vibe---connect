import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export type ChatState = 'idle' | 'finding' | 'matched';

interface UseWebRTCProps {
  profileId: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

export function useWebRTC({ profileId, latitude, longitude }: UseWebRTCProps) {
  const [state, setState] = useState<ChatState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [partner, setPartner] = useState<any>(null);
  
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const pc = useRef<RTCPeerConnection | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  const sendWs = useCallback((type: string, payload: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const cleanupPeerConnection = useCallback(() => {
    if (pc.current) {
      pc.current.onicecandidate = null;
      pc.current.ontrack = null;
      pc.current.close();
      pc.current = null;
    }
    setRemoteStream(null);
    setPartner(null);
  }, []);

  const stopEverything = useCallback(() => {
    cleanupPeerConnection();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setState('idle');
  }, [localStream, cleanupPeerConnection]);

  // Initialize camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Camera access denied:", err);
      toast({ 
        title: "Camera Required", 
        description: "Please allow camera and microphone access to chat.",
        variant: "destructive" 
      });
      return null;
    }
  }, [toast]);

  // Establish WebSocket and listen for signaling
  useEffect(() => {
    if (!profileId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("[WebRTC] Connected to signaling server");
    };

    ws.current.onmessage = async (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);

        switch (type) {
          case 'matched':
            console.log("[WebRTC] Matched with:", payload.partnerId);
            setState('matched');
            setPartner(payload.partnerProfile);

            cleanupPeerConnection();
            pc.current = new RTCPeerConnection({
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
              ]
            });

            // Add local tracks to peer connection
            if (localStream) {
              localStream.getTracks().forEach(track => {
                if (pc.current && localStream) {
                  pc.current.addTrack(track, localStream);
                }
              });
            }

            pc.current.ontrack = (e) => {
              if (e.streams && e.streams[0]) {
                setRemoteStream(e.streams[0]);
              }
            };

            pc.current.onicecandidate = (e) => {
              if (e.candidate) {
                sendWs('iceCandidate', { targetId: payload.partnerId, candidate: e.candidate });
              }
            };

            // If we are the initiator, create and send the offer
            if (payload.initiator) {
              const offer = await pc.current.createOffer();
              await pc.current.setLocalDescription(offer);
              sendWs('offer', { targetId: payload.partnerId, sdp: offer });
            }
            break;

          case 'offer':
            if (!pc.current) return;
            await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);
            sendWs('answer', { targetId: payload.senderId, sdp: answer });
            break;

          case 'answer':
            if (!pc.current) return;
            await pc.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            break;

          case 'iceCandidate':
            if (!pc.current) return;
            // Wait until remote description is set before adding ICE candidates
            if (pc.current.remoteDescription) {
              await pc.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            }
            break;

          case 'chatEnded':
            toast({ title: "Partner disconnected", description: "Finding someone new..." });
            cleanupPeerConnection();
            setState('finding');
            // Auto-rejoin queue
            sendWs('joinQueue', { profileId, latitude, longitude });
            break;

          case 'error':
            toast({ title: "Error", description: payload.message, variant: "destructive" });
            setState('idle');
            break;
        }
      } catch (err) {
        console.error("[WebRTC] Error handling message:", err);
      }
    };

    ws.current.onerror = () => {
      toast({ title: "Connection Lost", description: "Lost connection to the matchmaking server.", variant: "destructive" });
    };

    return () => {
      stopEverything();
    };
  }, [profileId, localStream, latitude, longitude, cleanupPeerConnection, stopEverything, sendWs, toast]);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const findPartner = async () => {
    let stream = localStream;
    if (!stream) {
      stream = await startCamera();
      if (!stream) return;
    }
    setState('finding');
    sendWs('joinQueue', { profileId, latitude, longitude });
  };

  const skipPartner = () => {
    cleanupPeerConnection();
    sendWs('endChat', { targetId: partner?.id });
    setState('finding');
    sendWs('joinQueue', { profileId, latitude, longitude });
  };

  const endSession = () => {
    cleanupPeerConnection();
    sendWs('leaveQueue', {});
    setState('idle');
  };

  return {
    state,
    localStream,
    remoteStream,
    partner,
    isMicMuted,
    isVideoMuted,
    toggleMic,
    toggleVideo,
    startCamera,
    findPartner,
    skipPartner,
    endSession
  };
}
