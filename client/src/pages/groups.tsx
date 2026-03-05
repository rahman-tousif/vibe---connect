import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation, Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Plus, Users } from "lucide-react";

export default function GroupsPage() {
  const [, setLocation] = useLocation();
  const [newGroupName, setNewGroupName] = useState("");
  
  const { data: groups, isLoading } = useQuery<any[]>({
    queryKey: [api.groups.list.path],
  });

  const createGroupMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(api.groups.create.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: "New Watch Party" }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.groups.list.path] });
      setLocation(`/watch/${data.id}`);
    }
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Watch Parties</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Create Group</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Watch Party</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input 
                placeholder="Group Name" 
                value={newGroupName} 
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <Button 
                className="w-full" 
                onClick={() => createGroupMutation.mutate(newGroupName)}
                disabled={createGroupMutation.isPending}
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>Loading groups...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups?.map((group) => (
            <Link key={group.id} href={`/watch/${group.id}`}>
              <Card className="hover:border-primary cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {group.name}
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {groups?.length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              No active watch parties. Create one to get started!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
