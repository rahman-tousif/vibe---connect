import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Mic, MicOff, Video as VideoIcon, VideoOff, SkipForward, X, Radar, ShieldAlert } from "lucide-react";
import { useWebRTC } from "@/hooks/use-webrtc";
import { VideoPlayer } from "@/components/video-player";

export default function ChatPage() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [location, setGeoLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    const storedProfile = sessionStorage.getItem("current_profile");
    if (!storedProfile) {
      setLocation("/");
      return;
    }
    setProfile(JSON.parse(storedProfile));

    const storedLoc = sessionStorage.getItem("user_location");
    if (storedLoc) {
      setGeoLocation(JSON.parse(storedLoc));
    }
  }, [setLocation]);

  const {
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
  } = useWebRTC({
    profileId: profile?.id,
    latitude: location?.lat,
    longitude: location?.lng
  });

  // Start camera automatically on mount
  useEffect(() => {
    if (profile) {
      startCamera();
    }
  }, [profile, startCamera]);

  if (!profile) return null;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black flex flex-col">
      {/* HEADER */}
      <header className="absolute top-0 left-0 w-full p-4 md:p-6 z-50 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40 backdrop-blur-md">
            <span className="font-display font-bold text-primary">V</span>
          </div>
          <span className="font-display font-semibold text-white/90 tracking-wide">VibeChat</span>
        </div>
        
        <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 pointer-events-auto shadow-none">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-white/80">{profile.nickname}</span>
        </div>
      </header>

      {/* MAIN VIDEO AREA */}
      <div className="flex-1 relative w-full h-full">
        {/* Remote Video (Full Screen if Matched) */}
        {state === 'matched' ? (
          <VideoPlayer 
            stream={remoteStream} 
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500" 
            fallbackText="Waiting for partner's video..."
          />
        ) : (
          /* Empty state / blurred local video when not matched */
          <div className="absolute inset-0 w-full h-full bg-zinc-950">
             <VideoPlayer 
              stream={localStream} 
              mirrored={true}
              isMuted={true}
              className="absolute inset-0 w-full h-full object-cover opacity-30 blur-2xl transition-all duration-700" 
            />
          </div>
        )}

        {/* Searching Overlay */}
        {state === 'finding' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-40 h-40 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute w-64 h-64 border border-primary/10 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '300ms' }} />
              <div className="z-10 bg-background p-6 rounded-full border border-primary/40 text-primary shadow-[0_0_30px_rgba(217,70,239,0.3)]">
                <Radar className="w-10 h-10 animate-pulse" />
              </div>
            </div>
            <h2 className="mt-12 text-2xl font-display font-semibold tracking-wider text-white text-glow animate-pulse">
              Finding someone nearby...
            </h2>
            <button 
              onClick={endSession}
              className="mt-8 px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors text-sm font-medium border border-white/10"
            >
              Cancel Search
            </button>
          </div>
        )}

        {/* Idle Overlay */}
        {state === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 animate-in fade-in zoom-in-95 duration-500">
            <div className="max-w-md text-center glass-panel-glow p-8 rounded-3xl mx-4">
              <ShieldAlert className="w-12 h-12 text-accent mx-auto mb-4 opacity-80" />
              <h2 className="text-3xl font-display font-bold text-white mb-2">Ready to explore?</h2>
              <p className="text-white/60 mb-8 font-sans">
                You're about to connect with a random stranger. Please be respectful and follow the community guidelines.
              </p>
              <button 
                onClick={findPartner}
                className="w-full py-4 rounded-xl font-display font-bold text-lg bg-gradient-to-r from-primary to-accent text-white shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] hover:-translate-y-1 transition-all duration-300"
              >
                Find Partner
              </button>
            </div>
          </div>
        )}

        {/* Partner Info overlay (when matched) */}
        {state === 'matched' && partner && (
          <div className="absolute top-24 left-6 z-30 animate-in slide-in-from-left-4 fade-in duration-500">
            <div className="glass-panel px-5 py-3 rounded-2xl">
              <p className="text-sm text-white/50 mb-0.5">Chatting with</p>
              <h3 className="text-xl font-display font-bold text-white">{partner.nickname}</h3>
              {partner.bio && (
                <p className="text-sm text-white/80 mt-1 max-w-[250px] truncate">{partner.bio}</p>
              )}
            </div>
          </div>
        )}

        {/* Local Video PIP */}
        <div className={`absolute transition-all duration-700 ease-in-out z-40 overflow-hidden shadow-2xl rounded-2xl border-2 border-white/10
            ${state === 'idle' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 rounded-3xl z-10 border-primary/30 shadow-[0_0_40px_rgba(217,70,239,0.15)]' 
            : 'top-6 right-6 w-32 h-48 sm:w-48 sm:h-64'}
          `}>
          <VideoPlayer 
            stream={localStream} 
            mirrored={true} 
            isMuted={true}
            className="w-full h-full object-cover" 
          />
          {state === 'idle' && (
            <div className="absolute inset-0 border-4 border-transparent rounded-3xl pointer-events-none" />
          )}
        </div>
      </div>

      {/* CONTROLS AREA */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
        <div className="glass-panel rounded-[2rem] p-3 sm:p-4 flex items-center justify-between sm:justify-center sm:gap-6 w-full">
          
          <button 
            onClick={toggleMic}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${isMicMuted ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isMicMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <button 
            onClick={toggleVideo}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${isVideoMuted ? 'bg-destructive/20 text-destructive hover:bg-destructive/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          <div className="w-px h-10 bg-white/10 mx-2 hidden sm:block" />

          {state === 'matched' ? (
            <>
              <button 
                onClick={endSession}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-destructive text-white flex items-center justify-center shadow-lg shadow-destructive/30 hover:scale-105 hover:bg-destructive/90 transition-all"
                title="Stop"
              >
                <X className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>

              <button 
                onClick={skipPartner}
                className="flex-1 sm:flex-none sm:px-8 h-12 sm:h-14 rounded-full bg-white text-black font-display font-bold flex items-center justify-center gap-2 hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all"
              >
                <span className="hidden sm:inline text-lg">Next</span>
                <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          ) : (
             <button 
              onClick={() => {
                endSession();
                setLocation("/");
              }}
              className="flex-1 sm:flex-none sm:px-8 h-12 sm:h-14 rounded-full bg-white/10 border border-white/20 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
            >
              Exit
            </button>
          )}

        </div>
      </div>

    </div>
  );
}
