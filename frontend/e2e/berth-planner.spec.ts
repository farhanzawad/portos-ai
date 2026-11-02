import { test, expect } from "@playwright/test";

const mockBerths = [
  {
    id: "berth_01",
    terminal_id: "term_cpa_01",
    code: "CCT-1",
    name: "Chittagong Container Terminal Berth 1",
    length_m: 185.0,
    depth_draft_m: 9.5,
    max_vessel_loa_m: 185.0,
    is_active: true,
    status: "AVAILABLE",
    data_status: "SIMULATED",
    source_name: "PORTOS Seed Engine",
  },
  {
    id: "berth_02",
    terminal_id: "term_cpa_01",
    code: "CCT-2",
    name: "Chittagong Container Terminal Berth 2",
    length_m: 185.0,
    depth_draft_m: 9.5,
    max_vessel_loa_m: 185.0,
    is_active: true,
    status: "AVAILABLE",
    data_status: "SIMULATED",
    source_name: "PORTOS Seed Engine",
  },
  {
    id: "berth_03",
    terminal_id: "term_cpa_01",
    code: "CCT-3",
    name: "Chittagong Container Terminal Berth 3",
    length_m: 185.0,
    depth_draft_m: 9.5,
    max_vessel_loa_m: 185.0,
    is_active: true,
    status: "AVAILABLE",
    data_status: "SIMULATED",
    source_name: "PORTOS Seed Engine",
  },
  {
    id: "berth_04",
    terminal_id: "term_cpa_01",
    code: "NCT-1",
    name: "New Mooring Container Terminal Berth 1",
    length_m: 200.0,
    depth_draft_m: 10.0,
    max_vessel_loa_m: 190.0,
    is_active: true,
    status: "AVAILABLE",
    data_status: "SIMULATED",
    source_name: "PORTOS Seed Engine",
  },
  {
    id: "berth_05",
    terminal_id: "term_cpa_01",
    code: "NCT-2",
    name: "New Mooring Container Terminal Berth 2",
    length_m: 200.0,
    depth_draft_m: 10.0,
    max_vessel_loa_m: 190.0,
    is_active: true,
    status: "AVAILABLE",
    data_status: "SIMULATED",
    source_name: "PORTOS Seed Engine",
  },
  {
    id: "berth_06",
    terminal_id: "term_cpa_01",
    code: "GCB-1",
    name: "General Cargo Berth 1",
    length_m: 160.0,
    depth_draft_m: 8.5,
    max_vessel_loa_m: 155.0,
    is_active: true,
    status: "MAINTENANCE",
    data_status: "SIMULATED",
    source_name: "PORTOS Seed Engine",
  },
];

const mockCalls = [
  {
    id: "call_vsl_01",
    vessel_id: "vsl_01",
    terminal_id: "term_cpa_01",
    call_number: "CALL-2026-01",
    voyage_number: "VY-01A",
    reported_eta: "2026-11-03T02:00:00Z",
    predicted_eta: "2026-11-03T02:30:00Z",
    status: "OUTER_ANCHORAGE",
    delay_risk_status: "HIGH_RISK",
    delay_risk_score: 0.85,
    predicted_delay_hours: 4.2,
    inbound_teu: 900,
    outbound_teu: 850,
    data_status: "SIMULATED",
    source_name: "PORTOS Seed Engine",
    vessel: {
      id: "vsl_01",
      imo_number: "9412001",
      name: "MV Karnaphuli Pioneer",
      call_sign: "S2AP1",
      flag_country: "Bangladesh",
      vessel_type: "CONTAINER_FEEDER",
      length_overall_m: 172.0,
      beam_m: 27.4,
      max_draft_m: 9.2,
      teu_capacity: 1450,
      dwt_tonnes: 18200.0,
      data_status: "SIMULATED",
      source_name: "PORTOS Seed Engine",
    },
  },
  {
    id: "call_vsl_02",
    vessel_id: "vsl_02",
    terminal_id: "term_cpa_01",
    call_number: "CALL-2026-02",
    voyage_number: "VY-02A",
    reported_eta: "2026-11-03T04:00:00Z",
    predicted_eta: "2026-11-03T04:00:00Z",
    status: "OUTER_ANCHORAGE",
    delay_risk_status: "NORMAL",
    delay_risk_score: 0.12,
    predicted_delay_hours: 0.0,
    inbound_teu: 750,
    outbound_teu: 700,
    data_status: "SIMULATED",
    source_name: "PORTOS Seed Engine",
    vessel: {
      id: "vsl_02",
      imo_number: "9412002",
      name: "MV Bay Feeder Express",
      call_sign: "S2AP2",
      flag_country: "Bangladesh",
      vessel_type: "CONTAINER_FEEDER",
      length_overall_m: 168.0,
      beam_m: 26.8,
      max_draft_m: 8.9,
      teu_capacity: 1200,
      dwt_tonnes: 15400.0,
      data_status: "SIMULATED",
      source_name: "PORTOS Seed Engine",
    },
  },
];

const mockOptimizerResponse = {
  solver_status: "OPTIMAL",
  solve_time_ms: 18.5,
  objective_value: 320.0,
  planning_start: "2026-11-03T00:00:00Z",
  planning_end: "2026-11-06T00:00:00Z",
  baseline_schedule: [
    {
      vessel_call_id: "call_vsl_01",
      vessel_name: "MV Karnaphuli Pioneer",
      call_number: "CALL-2026-01",
      berth_id: "berth_01",
      berth_code: "CCT-1",
      berth_name: "Chittagong Container Terminal Berth 1",
      scheduled_start: "2026-11-03T06:00:00Z",
      scheduled_end: "2026-11-04T00:00:00Z",
      service_duration_hours: 18.0,
      waiting_time_hours: 4.0,
      assigned_quay_start_m: 10.0,
      assigned_quay_end_m: 182.0,
      is_feasible: true,
      assignment_explanation: "Naive FIFO baseline assignment to CCT-1.",
      data_status: "SIMULATED",
    },
  ],
  optimized_schedule: [
    {
      vessel_call_id: "call_vsl_01",
      vessel_name: "MV Karnaphuli Pioneer",
      call_number: "CALL-2026-01",
      berth_id: "berth_01",
      berth_code: "CCT-1",
      berth_name: "Chittagong Container Terminal Berth 1",
      scheduled_start: "2026-11-03T02:30:00Z",
      scheduled_end: "2026-11-03T20:30:00Z",
      service_duration_hours: 18.0,
      waiting_time_hours: 0.5,
      assigned_quay_start_m: 10.0,
      assigned_quay_end_m: 182.0,
      is_feasible: true,
      assignment_explanation:
        "Assigned to CCT-1 (Chittagong Container Terminal Berth 1): Physical fit LOA 172.0m/185.0m (+13.0m margin), draft 9.2m/9.5m (+0.3m margin). Waiting time: 0.5h after ETA. Priority weight: 3.",
      data_status: "SIMULATED",
    },
    {
      vessel_call_id: "call_vsl_02",
      vessel_name: "MV Bay Feeder Express",
      call_number: "CALL-2026-02",
      berth_id: "berth_02",
      berth_code: "CCT-2",
      berth_name: "Chittagong Container Terminal Berth 2",
      scheduled_start: "2026-11-03T04:00:00Z",
      scheduled_end: "2026-11-03T22:00:00Z",
      service_duration_hours: 18.0,
      waiting_time_hours: 0.0,
      assigned_quay_start_m: 10.0,
      assigned_quay_end_m: 178.0,
      is_feasible: true,
      assignment_explanation:
        "Assigned to CCT-2 (Chittagong Container Terminal Berth 2): Physical fit LOA 168.0m/185.0m (+17.0m margin), draft 8.9m/9.5m (+0.6m margin). Waiting time: 0.0h after ETA. Priority weight: 1.",
      data_status: "SIMULATED",
    },
  ],
  unassigned_vessels: [],
  feasibility_validation: {
    is_feasible: true,
    total_assignments_checked: 2,
    violations_count: 0,
    violations: [],
    summary: "Verification PASSED: 2 assignments satisfied all hard operational constraints.",
    validator_name: "PORTOS Independent Feasibility Validator v1",
  },
  comparison_metrics: {
    baseline_total_waiting_hours: 9.5,
    optimized_total_waiting_hours: 0.5,
    waiting_hours_saved: 9.0,
    waiting_time_reduction_pct: 94.7,
    berth_utilization_pct: 38.2,
    vessels_scheduled_count: 2,
    vessels_unassigned_count: 0,
  },
  infeasibility_diagnostics: [],
  operational_notice:
    "Synthetic-data demonstration. Advisory decision support only — not validated for live Chattogram Port operations.",
  data_status: "SIMULATED",
};

const mockProposeResponse = {
  proposal_id: "proposal_abc123456",
  status: "PROPOSED",
  created_at: "2026-11-03T01:00:00Z",
  records_created: 2,
  message:
    "Advisory proposal recorded successfully (2 assignments). Requires explicit Harbour Master review and operational approval before confirmation.",
  data_status: "SIMULATED",
};

test.describe("Constraint-Based Berth Planner & OR-Tools Optimization", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/berths*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockBerths),
      });
    });

    await page.route("**/api/v1/vessels/calls*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockCalls),
      });
    });

    await page.route("**/api/v1/berth-planner/optimize*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockOptimizerResponse),
      });
    });

    await page.route("**/api/v1/berth-planner/propose*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockProposeResponse),
      });
    });
  });

  test("should render Berth Planner page header, datum, and simulated badge", async ({
    page,
  }) => {
    await page.goto("/berth-planner");

    await expect(
      page.getByRole("heading", {
        name: "Constraint-Based Berth Planner",
      })
    ).toBeVisible();

    await expect(page.getByText("SIMULATED").first()).toBeVisible();
    await expect(
      page.getByText(
        "Mathematical berth allocation and scheduling using Google OR-Tools CP-SAT."
      )
    ).toBeVisible();
  });

  test("should prominently display advisory decision support notice banner", async ({
    page,
  }) => {
    await page.goto("/berth-planner");

    await expect(
      page.getByText(/ADVISORY DECISION SUPPORT:/i)
    ).toBeVisible();
    await expect(
      page.getByText(/No live CPA berth telemetry, navigational clearance/i)
    ).toBeVisible();
  });

  test("should display CP-SAT solver telemetry card with status and metrics", async ({
    page,
  }) => {
    await page.goto("/berth-planner");

    await expect(page.getByText("CP-SAT Solver")).toBeVisible();
    await expect(page.getByText("OPTIMAL")).toBeVisible();
    await expect(page.getByText("(18.5 ms)")).toBeVisible();
    await expect(page.getByText("-94.7%")).toBeVisible();
    await expect(page.getByText("-9.0h saved")).toBeVisible();
    await expect(page.getByText("VERIFIED")).toBeVisible();
    await expect(page.getByText("Zero Hard Violations")).toBeVisible();
  });

  test("should render Gantt matrix timeline with berths and scheduled vessel blocks", async ({
    page,
  }) => {
    await page.goto("/berth-planner");

    await expect(
      page.getByText("Berth Allocation Timeline (Gantt View)")
    ).toBeVisible();

    // Check illustrative berths are listed
    await expect(page.getByText("CCT-1").first()).toBeVisible();
    await expect(page.getByText("CCT-2").first()).toBeVisible();
    await expect(page.getByText("NCT-1").first()).toBeVisible();
    await expect(page.getByText("GCB-1").first()).toBeVisible();

    // Check vessel assignment block
    await expect(page.getByText("MV Karnaphuli Pioneer").first()).toBeVisible();
    await expect(page.getByText("MV Bay Feeder Express").first()).toBeVisible();
  });

  test("should allow switching view modes between Optimized, Baseline, and Comparison", async ({
    page,
  }) => {
    await page.goto("/berth-planner");

    const baselineBtn = page.getByRole("button", { name: "Baseline (FIFO)" });
    await expect(baselineBtn).toBeVisible();
    await baselineBtn.click();

    const comparisonBtn = page.getByRole("button", { name: "Comparison Delta" });
    await expect(comparisonBtn).toBeVisible();
    await comparisonBtn.click();
  });

  test("should display vessel queue panel with compatibility chips", async ({
    page,
  }) => {
    await page.goto("/berth-planner");

    await expect(
      page.getByText("Vessel Queue & Berth Compatibility")
    ).toBeVisible();
    await expect(page.getByText("CALL-2026-01").first()).toBeVisible();
    await expect(page.getByText("Feasible Berths:").first()).toBeVisible();
  });

  test("should open Assignment Review Drawer when clicking a vessel block", async ({
    page,
  }) => {
    await page.goto("/berth-planner");

    const vesselBlock = page.getByText("MV Karnaphuli Pioneer").first();
    await vesselBlock.click();

    // Drawer should open with details
    await expect(page.getByText("Call ID: CALL-2026-01")).toBeVisible();
    await expect(page.getByText("Physical Vessel-Berth Clearance")).toBeVisible();
    await expect(page.getByText("Independent Constraint Audit")).toBeVisible();
    await expect(page.getByText("Zero Berth Temporal Overlap:")).toBeVisible();
    await expect(page.getByText("Mathematical Optimization Rationale (OR-Tools)")).toBeVisible();

    // Close drawer
    await page.getByRole("button", { name: "Close Inspection" }).click();
    await expect(page.getByText("Call ID: CALL-2026-01")).not.toBeVisible();
  });

  test("should open Propose Review modal and submit advisory proposal", async ({
    page,
  }) => {
    await page.goto("/berth-planner");

    const proposeBtn = page.getByRole("button", { name: "Propose for Review" });
    await expect(proposeBtn).toBeVisible();
    await proposeBtn.click();

    // Modal should be open
    await expect(
      page.getByRole("heading", {
        name: "Propose Optimized Schedule for Human Review",
      })
    ).toBeVisible();
    await expect(
      page.getByText(/In accordance with PORTOS AI core safety directives/i)
    ).toBeVisible();

    // Submit
    const submitBtn = page.getByRole("button", { name: "Submit Proposal" });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Expect success banner
    await expect(page.getByText(/Advisory Proposal Logged/i)).toBeVisible();
    await expect(page.getByText(/proposal_abc123456/i)).toBeVisible();
  });
});

