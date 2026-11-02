import { test, expect } from "@playwright/test";

const mockPresets = [
  {
    scenario_code: "baseline_normal",
    scenario_name: "Standard Baseline Terminal Operations",
    description: "Nominal operational state with all 6 berths and 5 cranes active.",
    is_baseline: true,
    random_seed: 42,
    duration_hours: 72.0,
    vessel_arrival_multiplier: 1.0,
    berth_outage_count: 0,
    crane_outage_count: 0,
    crane_service_rate_multiplier: 1.0,
    weather_disruption_factor: 1.0,
    yard_congestion_threshold_pct: 85.0,
  },
  {
    scenario_code: "monsoon_weather_squall",
    scenario_name: "Monsoon Weather Squall & Rough Sea",
    description: "High swells and squalls: 35% service slowdown and 15% degraded handling rate.",
    is_baseline: false,
    random_seed: 42,
    duration_hours: 72.0,
    vessel_arrival_multiplier: 1.0,
    berth_outage_count: 0,
    crane_outage_count: 0,
    crane_service_rate_multiplier: 0.85,
    weather_disruption_factor: 1.35,
    yard_congestion_threshold_pct: 85.0,
  },
  {
    scenario_code: "berth_cct2_closure",
    scenario_name: "Berth CCT-2 Quay Maintenance Outage",
    description: "Berth CCT-2 closed for urgent quay slab repairs: terminal reduced to 5 operational berths.",
    is_baseline: false,
    random_seed: 42,
    duration_hours: 72.0,
    vessel_arrival_multiplier: 1.0,
    berth_outage_count: 1,
    crane_outage_count: 0,
    crane_service_rate_multiplier: 1.0,
    weather_disruption_factor: 1.0,
    yard_congestion_threshold_pct: 85.0,
  },
];

const mockComparisonResponse = {
  baseline_run: {
    run_id: "sim_baseline_42",
    scenario_code: "baseline_normal",
    scenario_name: "Standard Baseline Terminal Operations",
    is_baseline: true,
    random_seed: 42,
    duration_hours: 72.0,
    parameters: mockPresets[0],
    metrics: {
      mean_waiting_time_hours: 1.8,
      median_waiting_time_hours: 1.5,
      p90_waiting_time_hours: 3.8,
      total_waiting_hours: 28.5,
      berth_utilization_pct: 65.2,
      crane_utilization_pct: 58.0,
      vessels_served_count: 16,
      vessels_remaining_queue: 1,
      estimated_secondary_co2_tonnes: 5.13,
    },
    queue_length_series: [
      { hour: 0, timestamp_iso: "2026-11-03T00:00:00Z", value: 1 },
      { hour: 12, timestamp_iso: "2026-11-03T12:00:00Z", value: 2 },
      { hour: 24, timestamp_iso: "2026-11-04T00:00:00Z", value: 1 },
      { hour: 48, timestamp_iso: "2026-11-05T00:00:00Z", value: 1 },
      { hour: 72, timestamp_iso: "2026-11-06T00:00:00Z", value: 0 },
    ],
    berth_occupancy_series: [
      { hour: 0, timestamp_iso: "2026-11-03T00:00:00Z", value: 3 },
      { hour: 12, timestamp_iso: "2026-11-03T12:00:00Z", value: 4 },
      { hour: 24, timestamp_iso: "2026-11-04T00:00:00Z", value: 4 },
      { hour: 48, timestamp_iso: "2026-11-05T00:00:00Z", value: 4 },
      { hour: 72, timestamp_iso: "2026-11-06T00:00:00Z", value: 3 },
    ],
    vessel_logs: [
      {
        vessel_id: "vsl_sim_001",
        vessel_name: "MV Karnaphuli Pioneer [Run #1]",
        call_number: "CALL-SIM-001",
        arrival_hour: 0.5,
        berth_hour: 1.0,
        departure_hour: 18.2,
        waiting_time_hours: 0.5,
        service_duration_hours: 16.7,
        status: "SERVED",
      },
    ],
    methodology_notes: ["Baseline run with seed=42."],
    data_status: "SIMULATED",
    operational_notice: "Synthetic-data demonstration.",
  },
  alternative_runs: [
    {
      run_id: "sim_monsoon_42",
      scenario_code: "monsoon_weather_squall",
      scenario_name: "Monsoon Weather Squall & Rough Sea",
      is_baseline: false,
      random_seed: 42,
      duration_hours: 72.0,
      parameters: mockPresets[1],
      metrics: {
        mean_waiting_time_hours: 5.2,
        median_waiting_time_hours: 4.8,
        p90_waiting_time_hours: 9.6,
        total_waiting_hours: 72.8,
        berth_utilization_pct: 82.5,
        crane_utilization_pct: 74.0,
        vessels_served_count: 14,
        vessels_remaining_queue: 3,
        estimated_secondary_co2_tonnes: 13.1,
      },
      queue_length_series: [
        { hour: 0, timestamp_iso: "2026-11-03T00:00:00Z", value: 1 },
        { hour: 12, timestamp_iso: "2026-11-03T12:00:00Z", value: 3 },
        { hour: 24, timestamp_iso: "2026-11-04T00:00:00Z", value: 4 },
        { hour: 48, timestamp_iso: "2026-11-05T00:00:00Z", value: 5 },
        { hour: 72, timestamp_iso: "2026-11-06T00:00:00Z", value: 3 },
      ],
      berth_occupancy_series: [
        { hour: 0, timestamp_iso: "2026-11-03T00:00:00Z", value: 4 },
        { hour: 12, timestamp_iso: "2026-11-03T12:00:00Z", value: 5 },
        { hour: 24, timestamp_iso: "2026-11-04T00:00:00Z", value: 6 },
        { hour: 48, timestamp_iso: "2026-11-05T00:00:00Z", value: 6 },
        { hour: 72, timestamp_iso: "2026-11-06T00:00:00Z", value: 5 },
      ],
      vessel_logs: [
        {
          vessel_id: "vsl_sim_001",
          vessel_name: "MV Karnaphuli Pioneer [Run #1]",
          call_number: "CALL-SIM-001",
          arrival_hour: 0.5,
          berth_hour: 3.5,
          departure_hour: 24.5,
          waiting_time_hours: 3.0,
          service_duration_hours: 20.5,
          status: "SERVED",
        },
      ],
      methodology_notes: ["Monsoon squall simulation."],
      data_status: "SIMULATED",
      operational_notice: "Synthetic-data demonstration.",
    },
  ],
  comparisons: {
    monsoon_weather_squall: {
      mean_waiting_time_hours: {
        baseline_value: 1.8,
        alternative_value: 5.2,
        absolute_delta: 3.4,
        percentage_delta: 188.9,
      },
      total_waiting_hours: {
        baseline_value: 28.5,
        alternative_value: 72.8,
        absolute_delta: 44.3,
        percentage_delta: 155.4,
      },
      berth_utilization_pct: {
        baseline_value: 65.2,
        alternative_value: 82.5,
        absolute_delta: 17.3,
        percentage_delta: 26.5,
      },
      vessels_served_count: {
        baseline_value: 16,
        alternative_value: 14,
        absolute_delta: -2,
        percentage_delta: -12.5,
      },
      vessels_remaining_queue: {
        baseline_value: 1,
        alternative_value: 3,
        absolute_delta: 2,
        percentage_delta: 200.0,
      },
      estimated_secondary_co2_tonnes: {
        baseline_value: 5.13,
        alternative_value: 13.1,
        absolute_delta: 7.97,
        percentage_delta: 155.4,
      },
    },
  },
  trade_off_summary: [
    "Scenario 'Monsoon Weather Squall & Rough Sea' increases average queue waiting time by 3.4h (+188.9%), serves 14 calls (-2 vs baseline), and generates an estimated 7.97t of additional anchorage auxiliary CO2 emissions.",
  ],
  operational_notice:
    "Synthetic-data demonstration. Decision Lab simulations reflect discrete-event model assumptions only.",
  data_status: "SIMULATED",
};

const mockProposeResponse = {
  proposal_id: "proposal_scen_987654321",
  status: "PROPOSED",
  created_at: "2026-11-03T01:30:00Z",
  message:
    "Advisory operational scenario proposal recorded (Monsoon Weather Squall & Rough Sea). Requires review and authorization by the Harbour Master before implementation.",
  data_status: "SIMULATED",
};

test.describe("Decision Lab & SimPy Scenario Simulation", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/scenarios/presets*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockPresets),
      });
    });

    await page.route("**/api/v1/scenarios/compare*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockComparisonResponse),
      });
    });

    await page.route("**/api/v1/scenarios/propose*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockProposeResponse),
      });
    });
  });

  test("should render Decision Lab page header, datum, and simulated badge", async ({
    page,
  }) => {
    await page.goto("/scenario-lab");

    await expect(
      page.getByRole("heading", {
        name: "Decision Lab & Scenario Simulation",
      })
    ).toBeVisible();

    await expect(page.getByText("SIMULATED").first()).toBeVisible();
    await expect(
      page.getByText(
        "Discrete-event simulation of terminal disruption scenarios using SimPy."
      )
    ).toBeVisible();
  });

  test("should prominently display decision support environment notice banner", async ({
    page,
  }) => {
    await page.goto("/scenario-lab");

    await expect(
      page.getByText(/DECISION SUPPORT ENVIRONMENT:/i)
    ).toBeVisible();
    await expect(
      page.getByText(/not be cited as observed Chattogram Port Authority KPIs/i)
    ).toBeVisible();
  });

  test("should render scenario disruption parameter sliders and presets", async ({
    page,
  }) => {
    await page.goto("/scenario-lab");

    await expect(
      page.getByText("Decision Lab: Disruption & Parameter Modeling")
    ).toBeVisible();

    // Check presets are rendered
    await expect(
      page.getByRole("button", {
        name: "Standard Baseline Terminal Operations",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Monsoon Weather Squall & Rough Sea",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Berth CCT-2 Quay Maintenance Outage",
      })
    ).toBeVisible();

    // Check sliders are visible
    await expect(page.getByText("Vessel Arrival Surge")).toBeVisible();
    await expect(page.getByText("Berths Offline (Outage)")).toBeVisible();
    await expect(page.getByText("STS Cranes Offline")).toBeVisible();
    await expect(page.getByText("Monsoon Sea-State Factor")).toBeVisible();
  });

  test("should display comparative KPI cards with deltas and baseline references", async ({
    page,
  }) => {
    await page.goto("/scenario-lab");

    await expect(page.getByText("Mean Queue Wait")).toBeVisible();
    await expect(page.getByText("5.2h")).toBeVisible();
    await expect(page.getByText("(Base: 1.8h)")).toBeVisible();
    await expect(page.getByText("+3.4h (+188.9%)")).toBeVisible();

    await expect(page.getByText("Total Waiting Hours")).toBeVisible();
    await expect(page.getByText("73h")).toBeVisible();

    await expect(page.getByText("Auxiliary CO₂")).toBeVisible();
    await expect(page.getByText("13.1t")).toBeVisible();
    await expect(page.getByText("+7.97t")).toBeVisible();
  });

  test("should display operational trade-off analysis callout box", async ({
    page,
  }) => {
    await page.goto("/scenario-lab");

    await expect(
      page.getByText("Operational Trade-Off Analysis & Bottleneck Diagnostics")
    ).toBeVisible();
    await expect(
      page.getByText(/increases average queue waiting time by 3.4h/i)
    ).toBeVisible();
  });

  test("should render queue dynamics and occupancy time-series chart", async ({
    page,
  }) => {
    await page.goto("/scenario-lab");

    await expect(
      page.getByText(
        "Outer Anchorage Queue Dynamics & Quayside Occupancy Over Time"
      )
    ).toBeVisible();
  });

  test("should display simulated vessel trajectory and event logs table", async ({
    page,
  }) => {
    await page.goto("/scenario-lab");

    await expect(
      page.getByText("Simulated Vessel Trajectory & Event Logs")
    ).toBeVisible();
    await expect(page.getByText("MV Karnaphuli Pioneer [Run #1]").first()).toBeVisible();
    await expect(page.getByText("CALL-SIM-001").first()).toBeVisible();
  });

  test("should open Propose Recovery Plan modal and submit proposal", async ({
    page,
  }) => {
    await page.goto("/scenario-lab");

    const proposeBtn = page.getByRole("button", { name: /Propose Recovery Plan/i });
    await expect(proposeBtn).toBeVisible();
    await proposeBtn.click();

    // Modal should appear
    await expect(
      page.getByRole("heading", {
        name: "Propose Scenario Recovery Plan for Harbour Master Review",
      })
    ).toBeVisible();
    await expect(
      page.getByText(/no real-world navigational clearances, tug mobilizations/i)
    ).toBeVisible();

    // Submit
    const submitBtn = page.getByRole("button", { name: "Submit Proposal" });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Expect success banner
    await expect(page.getByText(/Scenario Recovery Proposal Logged/i)).toBeVisible();
    await expect(page.getByText(/proposal_scen_987654321/i)).toBeVisible();
  });
});
