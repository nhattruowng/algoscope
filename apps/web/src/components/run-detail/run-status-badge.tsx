import type { SimulationStatus } from "@algoscope/shared-types";

import { Badge } from "@/components/ui/badge";

export function RunStatusBadge({ status }: { status: SimulationStatus }) {
  if (status === "success") return <Badge value={status} tone="success" />;
  return <Badge value={status} tone="danger" />;
}

