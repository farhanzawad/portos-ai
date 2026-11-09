"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getOverviewKPIs } from "@/lib/api-client";
import { KPICard } from "@/components/ui/KPICard";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Ship, Anchor, Clock, AlertTriangle, Grid3X3, CheckCircle2 } from "lucide-react";

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-sans">
      {/* 1. Vessels in System */}
      <KPICard
        accent="sky"
        label="Vessels in System"
        value={data.vessels_in_system}
        unit="vessels"
        subtitle={`${data.vessels_at_berth} berthed · ${data.vessels_in_queue} in queue`}
        dataStatus={data.data_status}
        icon={Ship}
        sparkBars={[40, 55, 50, 70, 65, 85, 95]}
        trend={{ value: `${data.vessels_at_berth} in service`, positive: true }}
      />

      {/* 2. Outer Anchorage Queue */}
      <KPICard
        accent="amber"
        label="Outer Anchorage Queue"
        value={data.vessels_in_queue}
        unit="awaiting berth"
        subtitle={`Roadstead delay: ${data.mean_anchorage_delay_hours} hrs avg`}
        dataStatus={data.data_status}
        icon={Clock}
        sparkBars={[65, 50, 60, 45, 40, 35, 30]}
        trend={{
          value: `${data.mean_anchorage_delay_hours}h delay`,
          positive: data.mean_anchorage_delay_hours <= 2.0,
        }}
      />

      {/* 3. Berth Occupancy */}
      <KPICard
        accent="emerald"
        label="Berth Occupancy"
        value={data.berth_occupancy_pct}
        unit="%"
        subtitle={`${data.occupied_berths} occupied · ${availableBerths} available`}
        dataStatus={data.data_status}
        icon={Anchor}
        sparkBars={[50, 60, 72, 70, 80, 85, 83]}
        trend={{
          value: `${data.total_berths} total berths`,
          positive: data.berth_occupancy_pct < 85,
        }}
      />

      {/* 4. Operational Alerts */}
      <KPICard
        accent={data.active_alerts_count > 0 ? "rose" : "emerald"}
        label="Operational Alerts"
        value={data.active_alerts_count}
        unit="active events"
        subtitle={data.active_alerts_count > 0 ? "Requires review" : "No active disruptions"}
        dataStatus={data.data_status}
        icon={data.active_alerts_count > 0 ? AlertTriangle : CheckCircle2}
        sparkBars={[20, 10, 10, 35, 20, 15, 10]}
        trend={{
          value: data.active_alerts_count > 0 ? "Action needed" : "All clear",
          positive: data.active_alerts_count === 0,
        }}
      />

      {/* 5. Yard Capacity */}
      <KPICard
        accent="indigo"
        label="Yard Occupancy"
        value="68%"
        unit="capacity"
        subtitle="3,412 / 5,000 TEU slots active"
        dataStatus="DERIVED"
        icon={Grid3X3}
        sparkBars={[45, 50, 58, 62, 65, 68, 68]}
        trend={{
          value: "Optimal buffer",
          positive: true,
        }}
      />
    </div>
  );
}
