import { test, expect } from "@playwright/test";

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
      inbound_teu: 850,
      outbound_teu: 720,
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
      status: "BERTHED",
      data_status: "SIMULATED",
      source_name: "SIMULATED_SEED",
      inbound_teu: 920,
      outbound_teu: 810,
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
  page_size: 50,
  total_pages: 1,
};

const mockTrack = {
  call_id: "vc-01",
  vessel_name: "MV Karnaphuli Express",
  call_number: "CALL-2026-001",
  status: "OUTER_ANCHORAGE",
  reported_eta: "2026-11-03T04:00:00Z",
  predicted_eta: "2026-11-03T07:30:00Z",
  predicted_delay_hours: 3.5,
  positions: [
    {
      id: "pos-1",
      vessel_call_id: "vc-01",
      timestamp: "2026-11-03T01:30:00Z",
      latitude: 22.12,
      longitude: 91.7,
      speed_knots: 13.5,
      heading_degrees: 345,
      navigational_status: "Under way using engine",
      distance_to_pilot_nm: 14.5,
      data_status: "SIMULATED",
    },
    {
      id: "pos-2",
      vessel_call_id: "vc-01",
      timestamp: "2026-11-03T02:45:00Z",
      latitude: 22.165,
      longitude: 91.735,
      speed_knots: 10.2,
      heading_degrees: 350,
      navigational_status: "At anchor",
      distance_to_pilot_nm: 10.2,
      data_status: "SIMULATED",
    },
  ],
};

test.describe("Vessel Intelligence & Geographic Fairway Track", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/vessels/calls*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockVesselCalls),
      });
    });

    await page.route("**/api/v1/vessels/calls/vc-01/track*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockTrack),
      });
    });
  });

  test("should render page header, datum, and demo environment badge", async ({
    page,
  }) => {
    await page.goto("/vessels");

    await expect(
      page.getByRole("heading", {
        name: "Vessel Intelligence & Fairway Track",
      })
    ).toBeVisible();

    await expect(
      page.getByText("DEMO ENVIRONMENT", { exact: false }).first()
    ).toBeVisible();

    await expect(page.getByText("Datum: CD +0.0m")).toBeVisible();
  });

  test("should prominently display missing live AIS connection notice", async ({
    page,
  }) => {
    await page.goto("/vessels");

    await expect(
      page.getByText("No live AIS connection — demo track only", {
        exact: false,
      })
    ).toBeVisible();
  });

  test("should display corridor summary metrics", async ({ page }) => {
    await page.goto("/vessels");

    await expect(page.getByText("Vessels in Corridor")).toBeVisible();
    await expect(page.getByText("Outer Anchorage")).toBeVisible();
    await expect(page.getByText("Berthed at Quayside")).toBeVisible();
    await expect(page.getByText("Mean Predicted Delay")).toBeVisible();
  });

  test("should filter vessel list by search query", async ({ page }) => {
    await page.goto("/vessels");

    // Search for Meghna
    const searchInput = page.getByPlaceholder(/search vessel name/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Meghna");

    // In the filtered list panel, Meghna should be visible and Karnaphuli should not be in the list
    const vesselList = page.locator(".divide-y");
    await expect(vesselList.getByText("MV Meghna Pioneer")).toBeVisible();
    await expect(vesselList.getByText("MV Karnaphuli Express")).not.toBeVisible();
  });

  test("should display vessel detail drawer with ETA comparison and track timeline", async ({
    page,
  }) => {
    await page.goto("/vessels");

    // Click on Karnaphuli Express
    await page.getByText("MV Karnaphuli Express").first().click();

    // Verify detail drawer
    await expect(
      page.getByText("VESSEL DETAIL & TRACK TIMELINE")
    ).toBeVisible();
    await expect(page.getByText("Reported ETA")).toBeVisible();
    await expect(page.getByText("ML Predicted ETA")).toBeVisible();
    await expect(page.getByText("Simulated Route Waypoint Timeline")).toBeVisible();

    // Verify waypoints
    await expect(
      page.getByText("Under way using engine", { exact: false })
    ).toBeVisible();
  });

  test("should display MapLibre GL maritime map with mandatory attribution", async ({
    page,
  }) => {
    await page.goto("/vessels");

    // Check map attribution is visible
    await expect(
      page.getByText(
        "MapLibre GL | PORTOS Maritime Spatial Model · Karnaphuli Fairway (CD +0.0m) · SIMULATED",
        { exact: false }
      )
    ).toBeVisible();

    // Check map controls
    await expect(
      page.getByRole("button", { name: /Fit to Route/i })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Reset/i })).toBeVisible();
  });
});

