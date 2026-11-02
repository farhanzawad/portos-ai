"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getOverviewKPIs } from "@/lib/api-client";
import { KPICard } from "@/components/ui/KPICard";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Ship, Anchor, Clock, AlertTriangle, Grid3X3 } from "lucide-react";

interface OverviewKPIStripProps {
  terminalId?: string;
}

export function OverviewKPIStrip({ terminalId }: OverviewKPIStripProps) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["overview-kpis", terminalId],
    queryFn: () => getOverviewKPIs(terminalId),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Could not load operational KPIs"
        message={error instanceof Error ? error.message : "Failed to fetch overview metrics."}
        onRetry={() => refetch()}
      />
    );
  }

  const availableBerths = Math.max(0, data.total_berths - data.occupied_berths);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      <KPICard
        label="Vessels in System"
        value={data.vessels_in_system}
        unit="vessels"
        subtitle={`${data.vessels_at_berth} berthed · ${data.vessels_in_queue} in queue`}
        dataStatus={data.data_status}
        icon={Ship}
        trend={{ value: `${data.vessels_at_berth} active cargo gang`, positive: true }}
      />

      <KPICard
        label="Outer Anchorage Queue"
        value={data.vessels_in_queue}
        unit="awaiting berth"
        subtitle={`Mean delay: ${data.mean_anchorage_delay_hours} hrs`}
        dataStatus={data.data_status}
        icon={Clock}
        trend={{
          value: data.mean_anchorage_delay_hours > 2.0 ? "Elevated waiting" : "Normal queue",
          positive: data.mean_anchorage_delay_hours <= 2.0,
        }}
      />

      <KPICard
        label="Berth Occupancy"
        value={data.berth_occupancy_pct}
        unit="%"
        subtitle={`${data.occupied_berths} occupied · ${availableBerths} available`}
        dataStatus={data.data_status}
        icon={Anchor}
        trend={{
          value: `${data.total_berths} total berths`,
          positive: data.berth_occupancy_pct < 85,
        }}
      />

      <KPICard
        label="Operational Alerts"
        value={data.active_alerts_count}
        unit="active events"
        subtitle={data.active_alerts_count > 0 ? "Requires review" : "No active disruptions"}
        dataStatus={data.data_status}
        icon={AlertTriangle}
        trend={{
          value: data.active_alerts_count > 0 ? "Attention needed" : "All clear",
          positive: data.active_alerts_count === 0,
        }}
      />

      <KPICard
        label="Yard Density Watch"
        value={data.yard_blocks_above_warning}
        unit="blocks > 80%"
        subtitle="Capacity risk threshold"
        dataStatus={data.data_status}
        icon={Grid3X3}
        trend={{
          value: data.yard_blocks_above_warning > 0 ? "Congestion watch" : "Yard flow optimal",
          positive: data.yard_blocks_above_warning === 0,
        }}
      />
    </div>
  );
}

