import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Video, Users, MessageSquare, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">StreamBuddy</h1>
        <div className="space-x-4">
          <Link href="/join">
            <Button variant="ghost">Random Chat</Button>
          </Link>
          <Link href="/groups">
            <Button>Watch Parties</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="container mx-auto py-20 text-center">
          <h2 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Connect, Watch, and Chat Together
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            The ultimate platform for private video chats and synchronized watch parties.
            Meet new people or hang out with your group while watching your favorite content.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/join">
              <Button size="lg" className="h-12 px-8">Start Random Chat</Button>
            </Link>
            <Link href="/groups">
              <Button size="lg" variant="outline" className="h-12 px-8">Join a Watch Party</Button>
            </Link>
          </div>
        </section>

        <section className="container mx-auto py-20 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Video className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Random Video Chat</CardTitle>
            </CardHeader>
            <CardContent>
              Connect with individuals nearby or across the globe for 1-on-1 adult conversations.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Users className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Watch Parties</CardTitle>
            </CardHeader>
            <CardContent>
              Synchronize video playback with your friends or public groups. Never watch alone again.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <MessageSquare className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Rich Messaging</CardTitle>
            </CardHeader>
            <CardContent>
              Discord-like chat experience with text, voice, and video integrated into every group.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Shield className="w-10 h-10 text-primary mb-2" />
              <CardTitle>Safe & Private</CardTitle>
            </CardHeader>
            <CardContent>
              End-to-end encryption for video calls and granular privacy controls for groups.
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="container mx-auto py-10 border-t text-center text-muted-foreground">
        <p>&copy; 2026 StreamBuddy. All rights reserved.</p>
      </footer>
    </div>
  );
}
