import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}
