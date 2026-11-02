import { test, expect } from "@playwright/test";

test.describe("Green Port Analytics & Factor Transparency (Milestone 12)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/green-port");
    await page.waitForLoadState("networkidle");
  });

  test("renders green port page header, demo indicator, and simulated data status", async ({ page }) => {
    // Header & Title
    await expect(page.getByRole("heading", { name: "Green Port Analytics" })).toBeVisible();
    await expect(page.getByText("Auditable operational carbon and air quality estimates")).toBeVisible();

    // DEMO ENVIRONMENT banner from layout
    await expect(page.getByText("DEMO ENVIRONMENT")).toBeVisible();

    // Data status badge
    await expect(page.locator("text=SIMULATED").first()).toBeVisible();
  });

  test("verifies auditable scope boundary banner and exclusions", async ({ page }) => {
    // Boundary banner title
    await expect(page.getByText("Auditable Prototype Boundary & Accounting Scope")).toBeVisible();
    await expect(page.getByText("IMO 4th GHG Study / EPA Port Emissions Inventory Guidance")).toBeVisible();

    // Non-regulatory disclaimer
    await expect(page.getByText("Non-Regulatory Notice:")).toBeVisible();

    // Expand boundary details
    const inspectBtn = page.getByRole("button", { name: /Inspect Boundary Details/i });
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    // Inclusions
    await expect(page.getByText("Scope 1 (Direct Fuel)")).toBeVisible();
    await expect(page.getByText("Scope 2 (Indirect Grid)")).toBeVisible();
    await expect(page.getByText("Scope 3 (Waterborne Modeled)")).toBeVisible();

    // Explicit exclusions
    await expect(page.getByText("Explicitly Excluded")).toBeVisible();
    await expect(page.getByText("Hinterland road container transport")).toBeVisible();
    await expect(page.getByText("Bangladesh Railway freight locomotives")).toBeVisible();
  });

  test("displays operational emissions KPI summary bar", async ({ page }) => {
    // Total Modeled CO2e
    await expect(page.getByText("Total Modeled CO2e", { exact: true })).toBeVisible();
    await expect(page.getByText("MT CO2e").first()).toBeVisible();

    // Berth Hoteling
    await expect(page.getByText("Berth Hoteling", { exact: true })).toBeVisible();

    // Anchorage Queue
    await expect(page.getByText("Anchorage Queue", { exact: true })).toBeVisible();

    // Electric Cranes
    await expect(page.getByText("Electric Cranes", { exact: true })).toBeVisible();

    // Yard Diesel
    await expect(page.getByText("Yard Diesel", { exact: true })).toBeVisible();
  });

  test("inspects transparent formula equations and handles unconfigured factors without guessing", async ({
    page,
  }) => {
    // Check CO2e activities
    await expect(page.getByText("Activity Emissions by Pollutant / Gas")).toBeVisible();
    await expect(page.getByText("Active Pollutant Scope")).toBeVisible();

    // Verified vs Illustrative badges
    await expect(page.getByText("Verified Source").first()).toBeVisible();
    await expect(page.getByText("Illustrative Assumption").first()).toBeVisible();

    // Check mathematical equation box
    await expect(page.getByText("Equation & Applied Factor").first()).toBeVisible();

    // Switch to PM2.5 tab to test unconfigured factor handling
    await page.getByRole("button", { name: "PM25", exact: true }).click();
    await expect(page.getByText("Particulate Matter (PM2.5)")).toBeVisible();

    // Unconfigured activity check (Electric STS cranes have no PM2.5 factor)
    await expect(page.getByText("Not configured").first()).toBeVisible();
    await expect(
      page.getByText("No verified or defensible factor configured for this combination").first()
    ).toBeVisible();
    await expect(page.getByText("Value not fabricated or hallucinated").first()).toBeVisible();
  });

  test("verifies baseline vs. disruption scenario comparison with integrity assurance", async ({
    page,
  }) => {
    // Comparison panel header
    await expect(
      page.getByText("Baseline vs. Disruption Scenario Emissions Variance")
    ).toBeVisible();

    // Scope equality integrity pill
    await expect(page.getByText("Scope Equality Verified")).toBeVisible();
    await expect(page.getByText("identical emission factors applied")).toBeVisible();

    // Baseline vs. Scenario totals
    await expect(page.getByText("Baseline Normal")).toBeVisible();
    await expect(page.getByText("Estimated Delta")).toBeVisible();

    // Activity breakdown table
    await expect(page.getByRole("columnheader", { name: "Activity Category" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Baseline Qty" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Scenario Qty" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Delta CO2e" })).toBeVisible();

    // Non-regulatory disclaimer
    await expect(page.getByText("Scenario comparisons evaluate operational sensitivity")).toBeVisible();

    // Switch scenario
    const scenarioSelect = page.locator("#scenario-select");
    await scenarioSelect.selectOption("berth_cct2_closure");
    await expect(scenarioSelect).toHaveValue("berth_cct2_closure");
    await expect(page.locator("span").filter({ hasText: "Berth CCT-2 Quay Maintenance Outage" })).toBeVisible();
  });

  test("verifies environmental context telemetry and strict navigation prohibition warning", async ({
    page,
  }) => {
    // Station Header
    await expect(page.getByText("Karnaphuli River Estuary Station")).toBeVisible();

    // CRITICAL NAVIGATION SAFETY DISCLAIMER
    await expect(page.getByText("CRITICAL SAFETY NOTICE:")).toBeVisible();
    await expect(
      page.getByText("NEVER be used for navigational vessel maneuvering, pilotage, or safety clearance decisions")
    ).toBeVisible();

    // Telemetry fields
    await expect(page.getByText("Temperature", { exact: true })).toBeVisible();
    await expect(page.getByText("Wind Speed", { exact: true })).toBeVisible();
    await expect(page.getByText("Tidal Height", { exact: true })).toBeVisible();
    await expect(page.getByText("Air Quality", { exact: true })).toBeVisible();
  });

  test("opens and filters the Emission Factor Dictionary drawer", async ({ page }) => {
    // Open drawer
    const factorBtn = page.getByRole("button", { name: /Emission Factors/i });
    await factorBtn.click();

    // Drawer container
    const drawer = page.locator(".fixed.inset-0");
    await expect(drawer.getByRole("heading", { name: "Emission Factor Dictionary" })).toBeVisible();
    await expect(drawer.getByText("Audit lineage, publication metadata")).toBeVisible();

    // Factors displayed
    await expect(drawer.getByText("VESSEL_HOTELING_AUX_ENGINE").first()).toBeVisible();
    await expect(drawer.getByText("STS_CRANE_ELECTRIC").first()).toBeVisible();

    // Filter by Verified Source inside drawer
    await drawer.getByRole("button", { name: "Verified", exact: true }).click();
    await expect(drawer.getByText("Verified Source").first()).toBeVisible();

    // Filter by Pollutant inside drawer
    await drawer.getByRole("button", { name: "NOX", exact: true }).click();
    await expect(drawer.getByText("VESSEL_HOTELING_AUX_ENGINE")).toBeVisible();

    // Close drawer
    await drawer.getByRole("button", { name: "Close Dictionary" }).click();
    await expect(drawer).not.toBeVisible();
  });
});
