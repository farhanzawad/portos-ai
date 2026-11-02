import { test, expect } from "@playwright/test";

const mockKPIs = {
  terminal_id: "demo-term-1",
  terminal_code: "CCT-NCT",
  timestamp: "2026-11-03T00:00:00Z",
  vessels_in_system: 12,
  vessels_at_berth: 4,
  vessels_in_queue: 8,
  berth_occupancy_pct: 66.7,
  total_berths: 6,
  occupied_berths: 4,
  active_alerts_count: 3,
  yard_blocks_above_warning: 2,
  mean_anchorage_delay_hours: 3.5,
  data_status: "SIMULATED",
};

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
      status: "OUTER_ANCHORAGE",
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
  ],
  total_count: 1,
  page: 1,
  page_size: 15,
  total_pages: 1,
};

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
];

test.describe("Port Operations Overview Dashboard", () => {
  test("should render the dashboard layout, demo environment banner, and header", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Check title & demo environment indicator
    await expect(page).toHaveTitle(/PORTOS AI/i);
    await expect(
      page.getByText("DEMO ENVIRONMENT", { exact: false }).first()
    ).toBeVisible();

    // 2. Check main heading
    await expect(
      page.getByRole("heading", { name: "Port Operations Overview" })
    ).toBeVisible();

    // 3. Check selected terminal context badge
    await expect(
      page.getByText("CCT / NCT Container Facility", { exact: false })
    ).toBeVisible();
  });

  test("should render KPI strip with operational metric cards when API returns data", async ({
    page,
  }) => {
    // Intercept KPI request with mock data
    await page.route("**/api/v1/kpis/overview*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockKPIs),
      });
    });

    await page.goto("/");

    // Check KPI cards
    await expect(page.getByText("Vessels in System")).toBeVisible();
    await expect(page.getByText("Outer Anchorage Queue")).toBeVisible();
    await expect(page.getByText("Berth Occupancy")).toBeVisible();
    await expect(page.getByText("Operational Alerts", { exact: true })).toBeVisible();
    await expect(page.getByText("Yard Density Watch")).toBeVisible();

    // Check numerical values from mock
    await expect(page.getByText("12", { exact: true })).toBeVisible();
  });

  test("should render vessel queue table and support status filtering", async ({
    page,
  }) => {
    await page.route("**/api/v1/vessels/calls*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockVesselCalls),
      });
    });

    await page.goto("/");

    // Check table title
    await expect(
      page.getByRole("heading", {
        name: "Incoming Vessel Queue & Outer Anchorage Arrivals",
      })
    ).toBeVisible();

    // Check vessel row rendered from mock
    await expect(page.getByText("MV Karnaphuli Express")).toBeVisible();
    await expect(page.getByText("IMO: IMO-9123456")).toBeVisible();

    // Check filter buttons
    const allTab = page.getByRole("button", { name: /^all vessels/i });
    const berthedTab = page.getByRole("button", { name: /^berthed/i });
    await expect(allTab).toBeVisible();
    await expect(berthedTab).toBeVisible();

    // Switch tab
    await berthedTab.click();
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("should provide terminal overview preview linking to digital twin", async ({
    page,
  }) => {
    await page.route("**/api/v1/berths*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockBerths),
      });
    });

    await page.goto("/");

    const twinLink = page.getByRole("link", {
      name: /Launch 3D Digital Twin/i,
    });
    await expect(twinLink).toBeVisible();
    await expect(twinLink).toHaveAttribute("href", "/digital-twin");
  });

  test("should render contextual advisory insight panel without claiming unconfigured AI", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Operational Decision Insights" })
    ).toBeVisible();
    await expect(
      page.getByText("Deterministic Rule Engine · Pre-Gemini Mode", {
        exact: false,
      })
    ).toBeVisible();
    await expect(
      page.getByText("Operational Truthfulness Rule:", { exact: false })
    ).toBeVisible();
  });

  test("should handle backend failure gracefully with error recovery state", async ({
    page,
  }) => {
    // Intercept overview KPI request and return 500 error
    await page.route("**/api/v1/kpis/overview*", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Simulated backend failure" }),
      });
    });

    await page.goto("/");

    // Should display graceful error state with retry action
    await expect(
      page.getByText("Could not load operational KPIs", { exact: false })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /retry/i }).first()
    ).toBeVisible();
  });
});
