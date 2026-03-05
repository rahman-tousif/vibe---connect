import { useEffect, useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Video, Send, Play, Pause } from "lucide-react";

export default function WatchPartyPage() {
  const { id } = useParams();
  const groupId = Number(id);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const profileId = Number(sessionStorage.getItem("profileId"));

  const { data: group } = useQuery<any>({
    queryKey: [buildUrl(api.groups.get.path, { id: groupId })],
  });

  const { data: initialMessages } = useQuery<any[]>({
    queryKey: [buildUrl(api.groups.messages.list.path, { id: groupId })],
  });

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    ws.current = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({
        type: "joinGroup",
        payload: { groupId, profileId }
      }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "newMessage") {
        setMessages(prev => [...prev, data.payload.message]);
      } else if (data.type === "videoUpdated") {
        setVideoUrl(data.payload.videoUrl);
        if (videoRef.current) {
          videoRef.current.currentTime = data.payload.playbackTime;
          if (data.payload.isPlaying) videoRef.current.play();
          else videoRef.current.pause();
        }
      }
    };

    return () => ws.current?.close();
  }, [groupId, profileId]);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    ws.current?.send(JSON.stringify({
      type: "sendMessage",
      payload: { groupId, profileId, content: inputMessage }
    }));
    setInputMessage("");
  };

  const updateVideo = (isPlaying: boolean) => {
    ws.current?.send(JSON.stringify({
      type: "updateVideo",
      payload: { 
        groupId, 
        videoUrl, 
        isPlaying, 
        playbackTime: videoRef.current?.currentTime || 0 
      }
    }));
  };

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col p-4 gap-4">
        <Card className="flex-1 bg-black relative overflow-hidden flex items-center justify-center">
          {videoUrl ? (
            <video 
              ref={videoRef}
              src={videoUrl} 
              className="w-full h-full"
              onPlay={() => updateVideo(true)}
              onPause={() => updateVideo(false)}
            />
          ) : (
            <div className="text-center space-y-4">
              <Video className="w-16 h-16 mx-auto text-muted-foreground" />
              <div className="flex gap-2">
                <Input 
                  placeholder="Paste video URL..." 
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-64"
                />
                <Button onClick={() => updateVideo(true)}>Load Video</Button>
              </div>
            </div>
          )}
        </Card>
        
        <div className="h-48 flex gap-4">
          <Card className="w-64 p-4 flex items-center justify-center bg-muted">
            <span className="text-muted-foreground">Self Video</span>
          </Card>
          <Card className="flex-1 p-4 flex items-center justify-center bg-muted">
             <span className="text-muted-foreground">Partner Videos</span>
          </Card>
        </div>
      </div>

      <Card className="w-80 m-4 flex flex-col">
        <div className="p-4 border-b font-bold">{group?.name} Chat</div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.isAd ? 'bg-primary/10 p-2 rounded' : ''}`}>
                <span className="text-xs font-bold text-muted-foreground">
                  {msg.isAd ? 'Sponsored' : `User ${msg.profileId}`}
                </span>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t flex gap-2">
          <Input 
            placeholder="Type a message..." 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button size="icon" onClick={sendMessage}><Send className="h-4 w-4" /></Button>
        </div>
      </Card>
    </div>
  );
}
