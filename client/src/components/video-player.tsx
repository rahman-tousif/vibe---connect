import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isMuted?: boolean;
  className?: string;
  mirrored?: boolean;
  fallbackText?: string;
}

export function VideoPlayer({ stream, isMuted = false, className, mirrored = false, fallbackText = "No video signal" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm border border-white/5", className)}>
        <User className="w-16 h-16 text-white/20 mb-4" />
        <p className="text-white/40 font-medium font-sans">{fallbackText}</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isMuted}
      className={cn(
        "object-cover bg-black",
        mirrored ? "scale-x-[-1]" : "",
        className
      )}
    />
  );
}
