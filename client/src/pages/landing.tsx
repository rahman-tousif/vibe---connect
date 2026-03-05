import React, { useState } from "react";
import { useLocation } from "wouter";
import { Camera, MapPin, Sparkles, AlertTriangle } from "lucide-react";
import { useCreateProfile } from "@/hooks/use-profile";
import { useToast } from "@/hooks/use-toast";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createProfile = useCreateProfile();
  
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [is18Plus, setIs18Plus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      toast({ title: "Nickname required", variant: "destructive" });
      return;
    }
    if (!is18Plus) {
      toast({ title: "Age confirmation required", description: "You must be 18+ to enter.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create profile
      const profile = await createProfile.mutateAsync({ nickname, bio });
      
      // Store in session to use in Chat page
      sessionStorage.setItem("current_profile", JSON.stringify(profile));
      
      // Try to get location to enhance matchmaking
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            sessionStorage.setItem("user_location", JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            }));
            setLocation("/chat");
          },
          (err) => {
            console.log("Location skipped or denied", err);
            // Proceed anyway
            setLocation("/chat");
          },
          { timeout: 5000 }
        );
      } else {
        setLocation("/chat");
      }
    } catch (err: any) {
      toast({ title: "Failed to enter", description: err.message, variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

      <main className="w-full max-w-md z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 shadow-lg shadow-primary/25 relative group cursor-pointer">
            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Camera className="w-8 h-8 text-white" />
            <Sparkles className="w-4 h-4 text-white absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h1 className="text-5xl font-display font-bold text-white mb-3 text-glow">VibeChat</h1>
          <p className="text-lg text-muted-foreground font-sans">Connect. Explore. Unfiltered.</p>
        </div>

        <div className="glass-panel-glow rounded-3xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 pl-1 block">Choose your Nickname</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. NightOwl99"
                className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-sans text-lg shadow-inner"
                maxLength={20}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 pl-1 block">Bio (Optional)</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full px-5 py-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-sans resize-none h-24 shadow-inner"
                maxLength={100}
              />
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 mt-2">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={is18Plus}
                    onChange={(e) => setIs18Plus(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-white/20 bg-black/50 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors select-none leading-tight">
                    I confirm that I am 18 years of age or older, and I consent to viewing potentially adult content.
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl font-display font-bold text-lg bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mt-4 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center justify-center gap-2">
                {isSubmitting ? "Entering..." : "Enter Chat"}
                {!isSubmitting && <Sparkles className="w-5 h-5" />}
              </span>
            </button>
            
            <p className="text-xs text-center text-white/30 flex items-center justify-center gap-1.5 mt-4">
              <MapPin className="w-3 h-3" />
              Location may be requested to match you locally.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
