# PORTOS AI — Design System Specification

**Design Direction:** Minimal Industrial Futurism  
**Document ID:** `DESIGN-SPEC-001`  
**Version:** 1.0  
**Effective Date:** November 2026

---

## 1. Visual Concept & Principles

PORTOS AI is an operational maritime decision-support workspace. Its visual language is **Minimal Industrial Futurism**:
- **Calm, High-Density Maritime Environment:** Prioritizes clarity, tabular numerals, information hierarchy, and operational states over decorative flourishes.
- **Strictly No Decorative Sci-Fi Effects:** No neon gradients, no glowing laser lines, no heavy glassmorphism, no spinning holographic particles.
- **Dark Spatial vs. Light Operational Canvas:**
  - Main operational workspace (tables, forms, KPI strips, review drawers): Light background (`#F4F6F8`) with crisp surface cards (`#FFFFFF`) and thin borders (`#DCE3EA`).
  - Spatial Twin Workspace: Charcoal-navy canvas (`#132B3F`) reserved for 3D/2D terminal rendering.

---

## 2. Color Palette & Semantic Tokens

| Role | Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| **Primary Navy** | `portos-navy` | `#102A43` | Top navigation, brand anchors, primary headers, high-emphasis text. |
| **Secondary Navy** | `portos-navy-secondary` | `#1E4967` | Section headers, icons, secondary button backgrounds. |
| **Muted Teal** | `portos-teal` | `#16A394` | Normal status, active selection, success badges, primary operational highlights. |
| **Warm Amber** | `portos-amber` | `#E5A23B` | Warning state, watch thresholds, demo environment banner, attention alerts. |
| **Restrained Red** | `portos-red` | `#D95454` | Critical alerts, delays exceeding threshold, conflict indicators. |
| **Main Background**| `portos-bg` | `#F4F6F8` | Primary page background; subtle low-contrast canvas. |
| **Surface White** | `portos-surface` | `#FFFFFF` | Cards, table rows, modal dialogs, drawers. |
| **Muted Text** | `portos-muted` | `#667085` | Field labels, secondary captions, metadata chips, breadcrumbs. |
| **Subtle Border** | `portos-border` | `#DCE3EA` | Standard card dividers, table borders, input outlines. |
| **Twin Canvas** | `portos-canvas` | `#132B3F` | Dedicated 3D Three.js viewport background. |

---

## 3. Typography & 8-Point Spacing Grid

### Font Family
- **Primary:** `Inter`, `Geist`, or system sans-serif fallback.
- **Monospace:** `GeistMono`, `ui-monospace`, for vessel IDs, container codes, timestamps, and coordinates.

### Spacing Scale
All margins, padding, and layout dimensions adhere strictly to an 8-point grid:
- `8px` (`0.5rem`) — standard gap between badge icons and text.
- `16px` (`1.0rem`) — standard card inner padding.
- `24px` (`1.5rem`) — section spacing and grid gaps.
- `32px` (`2.0rem`) — major layout margins and page header padding.

### Tabular Figures
All numeric values (ETAs, delays, TEU capacities, coordinates, percentages) use tabular numbers (`tabular-nums` / `font-variant-numeric: tabular-nums`) to avoid horizontal jitter during real-time data updates.

---

## 4. Application Shell Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Bar: Terminal Context | DEMO ENVIRONMENT | Asia/Dhaka | Role Menu  │
├──────────────┬─────────────────────────────────────────────────────────┤
│ Sidebar      │ Main Content Container                                  │
│ - Overview   │ ┌─────────────────────────────────────────────────────┐ │
│ - Twin       │ │ Page Header: Title, Subtitle, Data-Status Badge     │ │
│ - Vessels    │ ├─────────────────────────────────────────────────────┤ │
│ - Berths     │ │ Metric Strip / KPI Cards                            │ │
│ - Scenarios  │ ├─────────────────────────────────────────────────────┤ │
│ - Yard       │ │ Primary Viewport / Interactive Canvas / Tables      │ │
│ - Green Port │ ├─────────────────────────────────────────────────────┤ │
│ - Copilot    │ │ Advisory Proposal Action Drawer / Context Panel     │ │
│ - Data Centre│ └─────────────────────────────────────────────────────┘ │
└──────────────┴─────────────────────────────────────────────────────────┘
```

---

## 5. Standard Component Specifications

1. **KPI Card:**
   - Label (11px, uppercase muted text)
   - Value (24px, bold tabular numbers)
   - Subtitle / Trend context (11px text)
   - Data status badge (`SIMULATED`, `OBSERVED`, `FORECAST`, `DERIVED`)

2. **Data-Status Badge:**
   - Standard 5-tier pill: `SIMULATED`, `OBSERVED`, `FORECAST`, `DERIVED`, `UNAVAILABLE`.
   - Accessible contrast ratio (`> 4.5:1`).

3. **Alert Row:**
   - Severity indicator (Normal, Watch, Warning, Critical).
   - Timestamp in UTC+6, source tag, concise description, and action button.

4. **Lifecycle States:**
   - **Loading Skeleton:** Subtle pulse animation, matching exact card geometry to prevent layout shift.
   - **Empty State:** Centered illustration/icon, clear text explaining why data is absent, actionable next step.
   - **Error State:** Border highlight, failure reason, and retry button.

5. **Motion Guidelines:**
   - Duration: 160–240 ms.
   - Easing: standard ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`).
   - Global toggle for `prefers-reduced-motion` and user setting to disable animations completely.

