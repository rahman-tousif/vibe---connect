import React from "react";
import { useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertProfile, Profile } from "@shared/schema";

export function useCreateProfile() {
  return useMutation({
    mutationFn: async (data: InsertProfile): Promise<Profile> => {
      const res = await fetch(api.profiles.create.path, {
        method: api.profiles.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create profile");
      }
      
      return res.json();
    },
  });
}

export function useUpdateLocation() {
  return useMutation({
    mutationFn: async ({ id, latitude, longitude }: { id: number, latitude: number, longitude: number }) => {
      const url = buildUrl(api.profiles.updateLocation.path, { id });
      const res = await fetch(url, {
        method: api.profiles.updateLocation.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });
      
      if (!res.ok) throw new Error("Failed to update location");
      return res.json();
    }
  });
}
