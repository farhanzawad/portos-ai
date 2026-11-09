/**
 * PORTOS AI — High-Fidelity Maritime AIS Vessel Tracker & Directional Chevron
 * Minimal Industrial Futurism / Fasto SaaS Theme
 *
 * Implements IMO/ECDIS-compliant directional ship chevrons, tactical anchorage medallions,
 * docked quay silhouettes, dynamic bow velocity vectors, and interactive hover HUD.
 */

export interface VesselTrackerProps {
  id: string;
  name: string;
  status: "EN_ROUTE" | "OUTER_ANCHORAGE" | "BERTHED" | string;
  speedKnots: number;
  headingDegrees: number;
  delayRisk?: string;
  draftM?: number | null;
  loaM?: number | null;
  callSign?: string;
  imoNumber?: string;
  berthAssigned?: string | null;
  dataStatus?: string;
}

export function createVesselTrackerElement({
  vesselProps,
  isSelected,
  onSelect,
}: {
  vesselProps: VesselTrackerProps;
  isSelected: boolean;
  onSelect: () => void;
}): HTMLElement {
  const status = (vesselProps.status || "EN_ROUTE").toUpperCase();
  const speed = Number(vesselProps.speedKnots) || (status === "BERTHED" ? 0 : 8.5);
  const heading = Number(vesselProps.headingDegrees) || 45;
  const isHighRisk = vesselProps.delayRisk === "HIGH_RISK";
  const fullName = vesselProps.name || "Vessel";
  const displayName = fullName.replace(/^DEMO\s+/, "");
  const draft = vesselProps.draftM ? `${vesselProps.draftM}m` : "9.2m";
  const loa = vesselProps.loaM ? `${vesselProps.loaM}m` : "172m";
  const callSign = vesselProps.callSign || vesselProps.id || "CALL-2026";

  const el = document.createElement("div");
  el.className = "portos-vessel-tracker relative flex flex-col items-center select-none cursor-pointer group z-10 hover:z-30";
  el.setAttribute("data-vessel-id", vesselProps.id);

  const speedText =
    status === "BERTHED"
      ? "Berthed"
      : status === "OUTER_ANCHORAGE" || status.includes("ANCHOR")
      ? "Anchor"
      : `${speed.toFixed(1)} kn`;

  // Status-dependent palette & styling
  const isUnderway = status === "EN_ROUTE" || (!status.includes("ANCHOR") && status !== "BERTHED");
  const isAnchored = status === "OUTER_ANCHORAGE" || status.includes("ANCHOR");
  const isBerthed = status === "BERTHED";

  el.innerHTML = `
    <!-- Precision Tactical Radar Reticle (Active on selected vessel only) -->
    <div class="tracker-reticle absolute -inset-2 pointer-events-none ${isSelected ? "block" : "hidden"}">
      <div class="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-sky-400"></div>
      <div class="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-sky-400"></div>
      <div class="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-sky-400"></div>
      <div class="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-sky-400"></div>
      <div class="absolute inset-0 rounded-full border border-sky-400/40 animate-pulse"></div>
    </div>

    <!-- Alert ping for High Risk delays -->
    ${isHighRisk ? '<div class="absolute -inset-1.5 rounded-full bg-rose-500/20 animate-ping pointer-events-none"></div>' : ""}

    <!-- Rotatable Vessel Symbol (Smoothly aligned with Heading / COG) -->
    <div class="tracker-symbol-rotator relative flex items-center justify-center will-change-transform transition-transform duration-75" style="transform: rotate(${heading}deg);">
      
      <!-- Dynamic Bow Velocity Vector Leader (Length proportional to Speed Over Ground) -->
      ${
        isUnderway && speed > 0.8
          ? `
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none pb-0.5" style="height: ${Math.min(
          30,
          Math.max(12, speed * 1.8)
        )}px;">
          <div class="w-[1.5px] h-full bg-sky-400"></div>
          <div class="w-1.5 h-1.5 border-t-2 border-r-2 border-sky-300 rotate-[-45deg] -mt-1"></div>
        </div>
      `
          : ""
      }

      ${
        isAnchored
          ? `
        <!-- Tactical Anchorage Medallion (Compact Amber with Anchor Glyph) -->
        <div class="w-5 h-5 rounded-full bg-amber-500 border border-white shadow-md flex items-center justify-center transition-transform group-hover:scale-110">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="5" r="3"/>
            <line x1="12" y1="22" x2="12" y2="8"/>
            <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
          </svg>
        </div>
      `
          : isBerthed
          ? `
        <!-- Docked Quay Hull (Compact Emerald with Mooring Indicator) -->
        <div class="w-4 h-6 rounded-xs bg-emerald-600 border border-white shadow-md flex flex-col items-center justify-between p-0.5 transition-transform group-hover:scale-110">
          <div class="w-2 h-0.5 bg-white/90 rounded-xs"></div>
          <div class="w-2.5 h-2 bg-emerald-800 rounded-xs border border-white/60"></div>
          <div class="w-2 h-0.5 bg-white/90"></div>
        </div>
      `
          : `
        <!-- Directional AIS Ship Hull Chevron (Pointed Bow, Keel, Superstructure) -->
        <div class="transition-transform group-hover:scale-110 drop-shadow-sm">
          <svg width="18" height="24" viewBox="0 0 24 32" fill="none">
            <!-- Hydrodynamic Ship Hull -->
            <path d="M12 2 L22 10 L20 29 L12 27 L4 29 L2 10 Z" fill="${
              isHighRisk ? "#EF4444" : "#0284C7"
            }" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
            <!-- Centerline Keel Vector -->
            <line x1="12" y1="6" x2="12" y2="23" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="2 1" opacity="0.85"/>
            <!-- Bridge Superstructure -->
            <rect x="8.5" y="16" width="7" height="6" rx="1.5" fill="${
              isHighRisk ? "#991B1B" : "#0369A1"
            }" stroke="#ffffff" stroke-width="0.9"/>
            <!-- Bow Nav Light Point -->
            <circle cx="12" cy="4" r="1.2" fill="#ffffff"/>
          </svg>
        </div>
      `
      }
    </div>

    <!-- Micro-Callout Label Pill (Compact, High-Contrast Maritime Pill) -->
    <div class="tracker-label mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold font-sans tracking-tight whitespace-nowrap shadow-sm transition-all group-hover:scale-105 flex items-center gap-1 backdrop-blur-md ${
      isSelected
        ? "bg-sky-600 text-white border border-white ring-1 ring-sky-400"
        : isHighRisk
        ? "bg-rose-950/90 text-rose-200 border border-rose-500/70"
        : "bg-slate-900/85 text-slate-100 border border-slate-700/70 group-hover:border-slate-500"
    }">
      <span class="w-1.5 h-1.5 rounded-full ${
        isBerthed
          ? "bg-emerald-400"
          : isAnchored
          ? "bg-amber-400"
          : "bg-sky-400"
      }"></span>
      <span class="truncate max-w-[90px] group-hover:max-w-none transition-all">${displayName}</span>
      <span class="text-[8px] opacity-75 tabular-nums">${speedText}</span>
    </div>

    <!-- Interactive Tactical Hover Dossier Tooltip -->
    <div class="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col w-56 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/90 rounded-xl p-2.5 shadow-xl z-50 text-xs">
      <div class="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
        <div class="font-bold text-white truncate max-w-[140px]">${fullName}</div>
        <span class="px-1.5 py-0.5 rounded text-[8px] font-bold ${
          isBerthed
            ? "bg-emerald-950 text-emerald-300 border border-emerald-600"
            : isAnchored
            ? "bg-amber-950 text-amber-300 border border-amber-600"
            : "bg-sky-950 text-sky-300 border border-sky-600"
        }">${status.replace(/_/g, " ")}</span>
      </div>
      
      <div class="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300 font-sans">
        <div>
          <span class="text-[8px] text-slate-400 block uppercase font-medium">Speed / Heading</span>
          <span class="font-bold text-white tabular-nums">${speed.toFixed(1)} kn</span> · <span class="text-sky-400 tabular-nums">${heading.toFixed(0)}°</span>
        </div>
        <div>
          <span class="text-[8px] text-slate-400 block uppercase font-medium">Draft / LOA</span>
          <span class="font-bold text-white tabular-nums">${draft}</span> · <span class="text-slate-400 tabular-nums">${loa}</span>
        </div>
        <div>
          <span class="text-[8px] text-slate-400 block uppercase font-medium">Call Sign</span>
          <span class="text-slate-300 truncate block">${callSign}</span>
        </div>
        <div>
          <span class="text-[8px] text-slate-400 block uppercase font-medium">Delay Risk</span>
          <span class="font-bold ${isHighRisk ? "text-rose-400" : "text-emerald-400"}">${vesselProps.delayRisk || "NORMAL"}</span>
        </div>
      </div>

      ${
        vesselProps.berthAssigned
          ? `
        <div class="mt-1.5 pt-1 border-t border-slate-800 flex items-center justify-between text-[9px]">
          <span class="text-slate-400 font-medium">Assigned Quay:</span>
          <span class="font-bold text-sky-400">${vesselProps.berthAssigned}</span>
        </div>
      `
          : ""
      }
    </div>
  `;

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onSelect();
  });

  return el;
}
