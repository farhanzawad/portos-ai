import { test, expect } from "@playwright/test";

const mockBerths = [
  {
    id: "b-01",
    terminal_id: "demo-term-1",
    code: "CCT-1",
    name: "Berth 1",
    berth_number: 1,
    length_m: 200,
    depth_draft_m: 9.5,
    max_vessel_loa_m: 190,
    is_active: true,
    status: "OCCUPIED",
    data_status: "SIMULATED",
    source_name: "SIMULATED_SEED",
  },
  {
    id: "b-02",
    terminal_id: "demo-term-1",
    code: "CCT-2",
    name: "Berth 2",
    berth_number: 2,
    length_m: 185,
    depth_draft_m: 9.2,
    max_vessel_loa_m: 180,
    is_active: true,
    status: "AVAILABLE",
    data_status: "SIMULATED",
    source_name: "SIMULATED_SEED",
  },
];

const mockVesselCalls = {
  items: [
    {
      id: "vc-01",
      vessel_id: "v-01",
      terminal_id: "demo-term-1",
      call_number: "CALL-2026-001",
      reported_eta: "2026-11-03T04:00:00Z",
      predicted_eta: "2026-11-03T07:30:00Z",
      predicted_delay_hours: 3.5,
      delay_risk_status: "WATCH",
      status: "BERTHED",
      data_status: "SIMULATED",
      source_name: "SIMULATED_SEED",
      vessel: {
        id: "v-01",
        name: "MV Karnaphuli Express",
        imo_number: "IMO-9123456",
        call_sign: "S2ABC",
        flag_country: "Bangladesh",
        vessel_type: "CONTAINER_FEEDER",
        length_overall_m: 172.0,
        beam_m: 27.4,
        max_draft_m: 8.5,
        is_active: true,
        data_status: "SIMULATED",
        source_name: "SIMULATED_SEED",
      },
    },
    {
      id: "vc-02",
      vessel_id: "v-02",
      terminal_id: "demo-term-1",
      call_number: "CALL-2026-002",
      reported_eta: "2026-11-03T06:00:00Z",
      predicted_eta: "2026-11-03T09:00:00Z",
      predicted_delay_hours: 3.0,
      delay_risk_status: "HIGH_RISK",
      status: "OUTER_ANCHORAGE",
      data_status: "SIMULATED",
      source_name: "SIMULATED_SEED",
      vessel: {
        id: "v-02",
        name: "MV Meghna Pioneer",
        imo_number: "IMO-9654321",
        call_sign: "S2XYZ",
        flag_country: "Bangladesh",
        vessel_type: "CONTAINER_FEEDER",
        length_overall_m: 168.0,
        beam_m: 26.8,
        max_draft_m: 8.2,
        is_active: true,
        data_status: "SIMULATED",
        source_name: "SIMULATED_SEED",
      },
    },
  ],
  total_count: 2,
  page: 1,
  page_size: 20,
  total_pages: 1,
};

const mockEquipment = [
  {
    id: "eq-01",
    terminal_id: "demo-term-1",
    code: "STS-01",
    equipment_type: "STS_CRANE",
    status: "OPERATIONAL",
    rated_capacity_tonnes: 65,
    rated_moves_per_hour: 28,
    assigned_berth_id: "b-01",
    data_status: "SIMULATED",
    source_name: "SIMULATED_SEED",
  },
];

const mockYardBlocks = [
  {
    id: "yb-01",
    terminal_id: "demo-term-1",
    code: "YB-01",
    name: "Yard Block 1",
    zone: "IMPORT",
    teu_capacity: 480,
    warning_threshold_pct: 80,
    critical_threshold_pct: 90,
    data_status: "SIMULATED",
    source_name: "SIMULATED_SEED",
  },
  {
    id: "yb-04",
    terminal_id: "demo-term-1",
    code: "YB-04",
    name: "Yard Block 4",
    zone: "IMPORT",
    teu_capacity: 480,
    warning_threshold_pct: 80,
    critical_threshold_pct: 90,
    data_status: "SIMULATED",
    source_name: "SIMULATED_SEED",
  },
];

test.describe("Interactive Terminal Digital Twin", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept backend API routes with mock data
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
        body: JSON.stringify(mockVesselCalls),
      });
    });

    await page.route("**/api/v1/equipment*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockEquipment),
      });
    });

    await page.route("**/api/v1/yard/blocks*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockYardBlocks),
      });
    });
  });

  test("should render the digital twin page header, datum, and demo badge", async ({
    page,
  }) => {
    await page.goto("/digital-twin");

    await expect(
      page.getByRole("heading", { name: "Interactive Terminal Digital Twin" })
    ).toBeVisible();

    await expect(page.getByText("Datum: CD +0.0m")).toBeVisible();
    await expect(
      page.getByText("DEMO ENVIRONMENT", { exact: false }).first()
    ).toBeVisible();
  });

  test("should render the 2D schematic plan view and switch modes", async ({
    page,
  }) => {
    await page.goto("/digital-twin");

    // Click 2D Schematic button
    const schematicBtn = page.getByRole("button", { name: /2D Schematic/i });
    await expect(schematicBtn).toBeVisible();
    await schematicBtn.click();

    // Verify 2D Schematic sections
    await expect(
      page.getByText("Karnaphuli River Fairway & Terminal Spatial Schematic Plan", {
        exact: false,
      })
    ).toBeVisible();

    await expect(
      page.getByText("Karnaphuli Channel & Outer Anchorage Vessel Queue", {
        exact: false,
      })
    ).toBeVisible();

    await expect(
      page.getByText("Quayside Berths & Ship-to-Shore (STS) Gantry Rail", {
        exact: false,
      })
    ).toBeVisible();

    await expect(
      page.getByText("Container Yard Blocks & Stack Occupancy", {
        exact: false,
      })
    ).toBeVisible();
  });

  test("should open Entity Inspector Drawer when an asset is clicked in the schematic", async ({
    page,
  }) => {
    await page.goto("/digital-twin");

    // Switch to 2D Schematic
    await page.getByRole("button", { name: /2D Schematic/i }).click();

    // Click Berth CCT-1
    await page.getByText("CCT-1").first().click();

    // Inspector drawer should open
    await expect(page.getByText("BERTH INSPECTOR")).toBeVisible();
    await expect(page.getByText("CCT-1 - Berth 1")).toBeVisible();
    await expect(page.getByText("Quay Length", { exact: true })).toBeVisible();
    await expect(page.getByText("200 m")).toBeVisible();

    // Close button should close drawer
    const closeBtn = page.getByTitle("Close Inspector");
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(page.getByText("BERTH INSPECTOR")).not.toBeVisible();
  });

  test("should toggle simulation state and playback speed", async ({
    page,
  }) => {
    await page.goto("/digital-twin");

    const simBtn = page.getByTitle(/start simulation/i);
    await expect(simBtn).toBeVisible();
    await simBtn.click();

    // Button should now be pause
    await expect(page.getByTitle(/pause simulation/i)).toBeVisible();

    // Toggle speed
    const speed5x = page.getByRole("button", { name: "5x" });
    await expect(speed5x).toBeVisible();
    await speed5x.click();
  });

  test("should display bottom spatial telemetry quick summary bar", async ({
    page,
  }) => {
    await page.goto("/digital-twin");

    await expect(page.getByText("Quayside Berths")).toBeVisible();
    await expect(page.getByText("Berthed Vessels")).toBeVisible();
    await expect(page.getByText("Anchorage Queue")).toBeVisible();
    await expect(page.getByText("STS Cranes")).toBeVisible();
    await expect(page.getByText("Yard Capacity")).toBeVisible();
  });
});

