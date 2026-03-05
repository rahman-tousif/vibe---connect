import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { REGIONS, type Region, type Group } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation, Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import {
  Plus,
  Users,
  Radio,
  Globe,
  Search,
  Sparkles,
  ChevronRight,
  Eye,
} from "lucide-react";

function GroupCard({ group }: { group: Group }) {
  const tags = group.tags?.split(",").filter(Boolean) ?? [];

  return (
    <Link href={`/watch/${group.id}`}>
      <div className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(217,70,239,0.2)] glass-panel">
        <div className="relative aspect-[4/3] overflow-hidden">
          {group.thumbnailUrl ? (
            <img
              src={group.thumbnailUrl}
              alt={group.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
              <Users className="w-12 h-12 text-white/30" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {group.isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 backdrop-blur-sm">
              <Radio className="w-3 h-3 text-white animate-pulse" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Live
              </span>
            </div>
          )}

          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
            <Eye className="w-3 h-3 text-white/80" />
            <span className="text-xs font-medium text-white/90">
              {group.memberCount}
            </span>
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            {group.hostName && (
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
                <span className="text-xs text-white/80 font-medium truncate">
                  {group.hostName}
                </span>
              </div>
            )}
            <h3 className="text-base font-display font-bold text-white truncate">
              {group.name}
            </h3>
          </div>
        </div>

        <div className="p-3 space-y-2">
          {group.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {group.description}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary/90 border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function RegionSection({
  region,
  groups,
}: {
  region: string;
  groups: Group[];
}) {
  if (groups.length === 0) return null;
  const liveCount = groups.filter((g) => g.isLive).length;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display font-bold text-white">
            {region}
          </h2>
          <Badge
            variant="secondary"
            className="text-xs bg-primary/15 text-primary border-primary/20 hover:bg-primary/20"
          >
            {liveCount} live
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-default">
          {groups.length} rooms <ChevronRight className="w-3 h-3" />
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {groups.map((group) => (
          <GroupCard key={group.id} group={group} />
        ))}
      </div>
    </section>
  );
}

export default function GroupsPage() {
  const [, setLocation] = useLocation();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupRegion, setNewGroupRegion] = useState<string>("North America");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: groups = [], isLoading } = useQuery<Group[]>({
    queryKey: [api.groups.list.path],
    queryFn: async () => {
      const res = await fetch(api.groups.list.path);
      return res.json();
    },
  });

  useEffect(() => {
    fetch(api.groups.seed.path, { method: "POST" }).then(() => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
    });
  }, []);

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.groups.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription || "New Watch Party",
          region: newGroupRegion,
          isLive: true,
          memberCount: 1,
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
      setDialogOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setLocation(`/watch/${data.id}`);
    },
  });

  const filtered = groups.filter((g) => {
    const matchesRegion = !activeRegion || g.region === activeRegion;
    const matchesSearch =
      !searchQuery ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.tags?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.hostName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  const groupedByRegion = REGIONS.reduce(
    (acc, region) => {
      const regionGroups = filtered.filter((g) => g.region === region);
      if (regionGroups.length > 0) {
        acc[region] = regionGroups;
      }
      return acc;
    },
    {} as Record<string, Group[]>,
  );

  const totalLive = groups.filter((g) => g.isLive).length;
  const totalMembers = groups.reduce((s, g) => s + (g.memberCount ?? 0), 0);

  return (
    <div className="min-h-screen relative">
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <span className="text-xl font-display font-bold text-white cursor-pointer text-glow">
              VibeConnect
            </span>
          </Link>

          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search rooms, tags, hosts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/join">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                Random Chat
              </Button>
            </Link>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 transition-shadow"
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Create Room
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel-glow border-white/10">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    Create a Watch Party
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <label className="text-sm text-white/60">Room Name</label>
                    <Input
                      placeholder="e.g. Chill Vibes Lounge"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="bg-white/5 border-white/10 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-white/60">
                      Description
                    </label>
                    <Input
                      placeholder="What's this room about?"
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      className="bg-white/5 border-white/10 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-white/60">Region</label>
                    <Select
                      value={newGroupRegion}
                      onValueChange={setNewGroupRegion}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25"
                    onClick={() => createGroupMutation.mutate()}
                    disabled={
                      !newGroupName.trim() || createGroupMutation.isPending
                    }
                  >
                    {createGroupMutation.isPending
                      ? "Creating..."
                      : "Create Room"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10 space-y-10">
        {/* Hero stats bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white text-glow">
              Watch Parties
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>
                {totalLive} rooms live
              </span>
              <span className="text-white/20">·</span>
              <span>{totalMembers} people watching</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm text-primary font-medium">
              Updated live
            </span>
          </div>
        </div>

        {/* Region filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveRegion(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              !activeRegion
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            All Regions
          </button>
          {REGIONS.map((region) => {
            const count = groups.filter((g) => g.region === region).length;
            if (count === 0) return null;
            return (
              <button
                key={region}
                onClick={() =>
                  setActiveRegion(activeRegion === region ? null : region)
                }
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeRegion === region
                    ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {region}
                <span className="ml-1.5 text-xs opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden glass-panel animate-pulse"
              >
                <div className="aspect-[4/3] bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Users className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-lg font-display font-semibold text-white/80">
              No rooms found
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? `No rooms matching "${searchQuery}". Try a different search or create your own!`
                : "No active rooms in this region yet. Be the first to create one!"}
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="mt-2 bg-gradient-to-r from-primary to-accent"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create a Room
            </Button>
          </div>
        ) : activeRegion ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedByRegion).map(
              ([region, regionGroups]) => (
                <RegionSection
                  key={region}
                  region={region}
                  groups={regionGroups}
                />
              ),
            )}
          </div>
        )}
      </main>
    </div>
  );
}
