import { test, expect } from "@playwright/test";

const mockSummary = {
  terminal_id: "term_cct_01",
  total_capacity_teu: 6500,
  total_occupied_teu: 4722,
  overall_occupancy_pct: 72.6,
  blocks_normal_count: 9,
  blocks_watch_count: 2,
  blocks_high_risk_count: 1,
  data_status: "SIMULATED",
  timestamp: "2026-11-02T12:00:00Z",
  model_metadata: {
    model_name: "YardOccupancyGradientBoostingForecaster",
    model_version: "1.0.0",
    framework: "scikit-learn 1.5+ (GradientBoostingRegressor)",
    baseline_model: "Persistence + Linear Trend Extrapolation",
    baseline_mae_pct: 6.46,
    forecaster_mae_pct: 2.59,
    error_reduction_pct: 59.9,
    uncertainty_margin_pct: 3.5,
    training_samples: 1200,
    data_status: "SIMULATED",
    limitations:
      "Deterministic simulation based on Chittagong CCT/NCT tidal vessel discharge cycles. Assumes standard equipment availability and road gate operating hours.",
  },
  blocks: [
    {
      id: "yb_01",
      terminal_id: "term_cct_nct_01",
      code: "YB-01",
      name: "Container Yard Block 01",
      zone: "IMPORT",
      teu_capacity: 600,
      warning_threshold_pct: 85.0,
      critical_threshold_pct: 95.0,
      current_occupied_teu: 318,
      current_occupancy_pct: 53.0,
      current_risk_tier: "NORMAL",
      reefer_occupied_count: 0,
      data_status: "SIMULATED",
      source_name: "PORTOS Yard Telemetry Simulator",
      last_observation_time: "2026-11-02T12:00:00Z",
      forecast_6h: {
        horizon_hrs: 6,
        predicted_occupied_teu: 341,
        predicted_occupancy_pct: 56.9,
        risk_tier: "NORMAL",
        confidence_lower_pct: 53.4,
        confidence_upper_pct: 60.4,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [
          {
            factor: "Scheduled Vessel Discharge Staging",
            impact_teu: 28.3,
            direction: "+",
            description: "Inbound feeder discharge allocated to YB-01 over next 6h.",
          },
        ],
      },
      forecast_12h: {
        horizon_hrs: 12,
        predicted_occupied_teu: 345,
        predicted_occupancy_pct: 57.5,
        risk_tier: "NORMAL",
        confidence_lower_pct: 54.0,
        confidence_upper_pct: 61.0,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [],
      },
      forecast_24h: {
        horizon_hrs: 24,
        predicted_occupied_teu: 354,
        predicted_occupancy_pct: 59.0,
        risk_tier: "NORMAL",
        confidence_lower_pct: 55.5,
        confidence_upper_pct: 62.5,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [],
      },
    },
    {
      id: "yb_04",
      terminal_id: "term_cct_nct_01",
      code: "YB-04",
      name: "Container Yard Block 04",
      zone: "IMPORT",
      teu_capacity: 600,
      warning_threshold_pct: 85.0,
      critical_threshold_pct: 95.0,
      current_occupied_teu: 552,
      current_occupancy_pct: 92.0,
      current_risk_tier: "HIGH_RISK",
      reefer_occupied_count: 0,
      data_status: "SIMULATED",
      source_name: "PORTOS Yard Telemetry Simulator",
      last_observation_time: "2026-11-02T12:00:00Z",
      forecast_6h: {
        horizon_hrs: 6,
        predicted_occupied_teu: 542,
        predicted_occupancy_pct: 90.4,
        risk_tier: "WATCH",
        confidence_lower_pct: 86.9,
        confidence_upper_pct: 93.9,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [
          {
            factor: "Scheduled Vessel Discharge Staging",
            impact_teu: 15.0,
            direction: "+",
            description: "Inbound feeder discharge allocated to YB-04.",
          },
          {
            factor: "Truck Gate Clearance & Delivery",
            impact_teu: -25.0,
            direction: "-",
            description: "Consignee delivery haulage exiting via terminal out-gates.",
          },
        ],
      },
      forecast_12h: {
        horizon_hrs: 12,
        predicted_occupied_teu: 547,
        predicted_occupancy_pct: 91.1,
        risk_tier: "WATCH",
        confidence_lower_pct: 87.6,
        confidence_upper_pct: 94.6,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [],
      },
      forecast_24h: {
        horizon_hrs: 24,
        predicted_occupied_teu: 578,
        predicted_occupancy_pct: 96.3,
        risk_tier: "HIGH_RISK",
        confidence_lower_pct: 92.8,
        confidence_upper_pct: 99.8,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [],
      },
    },
    {
      id: "yb_05",
      terminal_id: "term_cct_nct_01",
      code: "YB-05",
      name: "Reefer Yard Block 05",
      zone: "REEFER",
      teu_capacity: 250,
      warning_threshold_pct: 85.0,
      critical_threshold_pct: 95.0,
      current_occupied_teu: 152,
      current_occupancy_pct: 60.8,
      current_risk_tier: "NORMAL",
      reefer_occupied_count: 60,
      data_status: "SIMULATED",
      source_name: "PORTOS Yard Telemetry Simulator",
      last_observation_time: "2026-11-02T12:00:00Z",
      forecast_6h: {
        horizon_hrs: 6,
        predicted_occupied_teu: 155,
        predicted_occupancy_pct: 62.0,
        risk_tier: "NORMAL",
        confidence_lower_pct: 58.5,
        confidence_upper_pct: 65.5,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [],
      },
      forecast_12h: {
        horizon_hrs: 12,
        predicted_occupied_teu: 150,
        predicted_occupancy_pct: 60.0,
        risk_tier: "NORMAL",
        confidence_lower_pct: 56.5,
        confidence_upper_pct: 63.5,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [],
      },
      forecast_24h: {
        horizon_hrs: 24,
        predicted_occupied_teu: 148,
        predicted_occupancy_pct: 59.2,
        risk_tier: "NORMAL",
        confidence_lower_pct: 55.7,
        confidence_upper_pct: 62.7,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [],
      },
    },
    {
      id: "yb_07",
      terminal_id: "term_cct_nct_01",
      code: "YB-07",
      name: "Container Yard Block 07",
      zone: "IMPORT",
      teu_capacity: 600,
      warning_threshold_pct: 85.0,
      critical_threshold_pct: 95.0,
      current_occupied_teu: 528,
      current_occupancy_pct: 88.0,
      current_risk_tier: "WATCH",
      reefer_occupied_count: 0,
      data_status: "SIMULATED",
      source_name: "PORTOS Yard Telemetry Simulator",
      last_observation_time: "2026-11-02T12:00:00Z",
      forecast_6h: {
        horizon_hrs: 6,
        predicted_occupied_teu: 535,
        predicted_occupancy_pct: 89.2,
        risk_tier: "WATCH",
        confidence_lower_pct: 85.7,
        confidence_upper_pct: 92.7,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [],
      },
      forecast_12h: {
        horizon_hrs: 12,
        predicted_occupied_teu: 543,
        predicted_occupancy_pct: 90.5,
        risk_tier: "WATCH",
        confidence_lower_pct: 87.0,
        confidence_upper_pct: 94.0,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [],
      },
      forecast_24h: {
        horizon_hrs: 24,
        predicted_occupied_teu: 562,
        predicted_occupancy_pct: 93.7,
        risk_tier: "WATCH",
        confidence_lower_pct: 90.2,
        confidence_upper_pct: 97.2,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [],
      },
    },
    {
      id: "yb_12",
      terminal_id: "term_cct_nct_01",
      code: "YB-12",
      name: "Container Yard Block 12",
      zone: "EXPORT",
      teu_capacity: 600,
      warning_threshold_pct: 85.0,
      critical_threshold_pct: 95.0,
      current_occupied_teu: 498,
      current_occupancy_pct: 83.0,
      current_risk_tier: "WATCH",
      reefer_occupied_count: 0,
      data_status: "SIMULATED",
      source_name: "PORTOS Yard Telemetry Simulator",
      last_observation_time: "2026-11-02T12:00:00Z",
      forecast_6h: {
        horizon_hrs: 6,
        predicted_occupied_teu: 507,
        predicted_occupancy_pct: 84.4,
        risk_tier: "NORMAL",
        confidence_lower_pct: 80.9,
        confidence_upper_pct: 87.9,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [],
      },
      forecast_12h: {
        horizon_hrs: 12,
        predicted_occupied_teu: 511,
        predicted_occupancy_pct: 85.1,
        risk_tier: "WATCH",
        confidence_lower_pct: 81.6,
        confidence_upper_pct: 88.6,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [],
      },
      forecast_24h: {
        horizon_hrs: 24,
        predicted_occupied_teu: 542,
        predicted_occupancy_pct: 90.3,
        risk_tier: "WATCH",
        confidence_lower_pct: 86.8,
        confidence_upper_pct: 93.8,
        overflow_risk: false,
        capped_at_capacity: false,
        explanatory_factors: [],
      },
    },
  ],
};

const mockAlerts = [
  {
    block_id: "yb_04",
    block_code: "YB-04",
    zone: "IMPORT",
    current_pct: 92.0,
    peak_forecast_pct: 96.3,
    peak_horizon_hrs: 24,
    risk_tier: "HIGH_RISK",
    title: "Critical Congestion Risk: Sector YB-04 (96.3%)",
    message: "Block YB-04 (IMPORT) is projected to reach 96.3% capacity within +24h.",
    recommended_action: "Halt direct discharge to YB-04. Re-route inbound containers to low-utilization adjacent sector.",
    data_status: "SIMULATED",
  },
];

const mockDetailYB04 = {
  block: {
    id: "yb_04",
    terminal_id: "term_cct_nct_01",
    code: "YB-04",
    name: "Container Yard Block 04",
    zone: "IMPORT",
    teu_capacity: 600,
    warning_threshold_pct: 85.0,
    critical_threshold_pct: 95.0,
    data_status: "SIMULATED",
    source_name: "PORTOS Seed Engine",
  },
  current_status: mockSummary.blocks[1],
  history_observations: [
    {
      id: "obs_yb_04_t24h",
      yard_block_id: "yb_04",
      timestamp: "2026-11-01T12:00:00Z",
      occupied_teu: 504,
      occupancy_pct: 84.0,
      reefer_occupied_count: 0,
      risk_tier: "WATCH",
      data_status: "SIMULATED",
    },
    {
      id: "obs_yb_04_t0h",
      yard_block_id: "yb_04",
      timestamp: "2026-11-02T12:00:00Z",
      occupied_teu: 552,
      occupancy_pct: 92.0,
      reefer_occupied_count: 0,
      risk_tier: "HIGH_RISK",
      data_status: "SIMULATED",
    },
  ],
  recent_movements: [
    {
      id: "mov_yb_04_1",
      yard_block_id: "yb_04",
      timestamp: "2026-11-02T10:00:00Z",
      movement_type: "DISCHARGE_TO_YARD",
      teu_count: 37,
      vessel_call_id: "call_05",
      equipment_id: "eq_rtg_01",
      data_status: "SIMULATED",
      source_name: "PORTOS TOS Emulator",
    },
  ],
  model_metadata: mockSummary.model_metadata,
  data_status: "SIMULATED",
};

test.describe("Milestone 11 — Yard Intelligence and Congestion Heatmap", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept backend API calls with deterministic mock data
    await page.route("**/api/v1/yard/status*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockSummary),
      });
    });

    await page.route("**/api/v1/yard/congestion-alerts*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockAlerts),
      });
    });

    await page.route("**/api/v1/yard/blocks/yb_04/detail*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockDetailYB04),
      });
    });

    await page.goto("/yard");
  });

  test("renders Yard Intelligence page header, demo indicator, and KPI metrics", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Yard Intelligence & Congestion Heatmap" })
    ).toBeVisible();

    // Verify Demo Environment banner and SIMULATED badge
    await expect(page.locator("text=DEMO ENVIRONMENT").first()).toBeVisible();
    await expect(page.locator("text=SIMULATED").first()).toBeVisible();

    // Verify KPI summary metrics
    await expect(page.locator("text=Overall Density")).toBeVisible();
    await expect(page.locator("text=72.6%").first()).toBeVisible();
    await expect(page.locator("text=ML Forecaster")).toBeVisible();
    await expect(page.locator("text=+59.9% vs Base")).toBeVisible();
  });

  test("renders top-down yard grid with sector codes and capacity gauges", async ({ page }) => {
    // Check key sectors are visible in the grid using exact text match to avoid <option> elements
    await expect(page.getByText("YB-01", { exact: true })).toBeVisible();
    await expect(page.getByText("YB-04", { exact: true }).last()).toBeVisible();
    await expect(page.getByText("YB-05", { exact: true })).toBeVisible();
    await expect(page.getByText("YB-12", { exact: true })).toBeVisible();

    // Check Reefer indicator
    await expect(page.getByText("Reefer", { exact: true }).first()).toBeVisible();
  });

  test("switches forecast horizons and updates active state", async ({ page }) => {
    // Default is Current (0h)
    await expect(page.locator("text=Viewing: Current State")).toBeVisible();

    // Click +6h Forecast
    await page.getByRole("button", { name: "+6h Forecast" }).click();
    await expect(page.locator("text=Viewing: +6h Forecast")).toBeVisible();

    // Click +24h Forecast
    await page.getByRole("button", { name: "+24h Forecast" }).click();
    await expect(page.locator("text=Viewing: +24h Forecast")).toBeVisible();
  });

  test("filters sectors by zone and risk status", async ({ page }) => {
    // Filter by Reefer Zone
    const zoneSelect = page.locator("select").first();
    await zoneSelect.selectOption("REEFER");

    // Only YB-05 should be visible from our mock data
    await expect(page.getByText("YB-05", { exact: true })).toBeVisible();
    await expect(page.getByText("YB-01", { exact: true })).not.toBeVisible();

    // Reset to All Zones
    await zoneSelect.selectOption("ALL");
    await expect(page.getByText("YB-01", { exact: true })).toBeVisible();
  });

  test("adjusts threshold configuration via controls bar", async ({ page }) => {
    // Open threshold configuration
    await page.getByRole("button", { name: /Thresholds/ }).click();
    await expect(page.locator("text=Warning Threshold (Watch):")).toBeVisible();
    await expect(page.locator("text=Critical Threshold (High Risk):")).toBeVisible();

    // Reset button is visible
    await expect(page.getByRole("button", { name: /Reset/ })).toBeVisible();
  });

  test("clicking a block opens the detail inspection drawer with forecasts and provenance", async ({
    page,
  }) => {
    // Click on Inspect Sector button in alert strip or click block card
    await page.getByRole("button", { name: "Inspect Sector" }).first().click();

    // Drawer header should appear
    await expect(page.getByRole("heading", { name: "YB-04" })).toBeVisible();
    await expect(page.locator("text=Container Yard Block 04 • Zone: IMPORT")).toBeVisible();

    // Verify 3D twin inspection button
    const twinLink = page.getByRole("link", { name: "Inspect in 3D" });
    await expect(twinLink).toBeVisible();
    await expect(twinLink).toHaveAttribute("href", "/digital-twin?block=YB-04");

    // Multi-horizon matrix
    await expect(page.locator("text=+6h").first()).toBeVisible();
    await expect(page.locator("text=+12h").first()).toBeVisible();
    await expect(page.locator("text=+24h").first()).toBeVisible();

    // Explanatory factors
    await expect(page.locator("text=Scheduled Vessel Discharge Staging").first()).toBeVisible();
    await expect(page.locator("text=Truck Gate Clearance & Delivery").first()).toBeVisible();

    // Audit trail & limitations
    await expect(page.locator("text=Operational Data Provenance & Audit Trail")).toBeVisible();
    await expect(page.locator("text=PORTOS Seed Engine")).toBeVisible();

    // Close drawer
    await page.getByTitle("Close drawer").click();
    await expect(page.getByRole("heading", { name: "YB-04" })).not.toBeVisible();
  });
});
