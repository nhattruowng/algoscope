import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export function useScenarioPresets() {
  return useQuery({
    queryKey: ["scenario-presets"],
    queryFn: api.getScenarioPresets,
    staleTime: 5 * 60 * 1000,
  });
}
