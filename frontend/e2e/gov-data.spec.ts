import { test, expect } from "@playwright/test";

test.describe("Public Bangladesh Government & Port Authority Data Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data-centre");
    await page.waitForLoadState("networkidle");

    // Click the Official Govt Data (CPA/BMD) tab
    const govTab = page.getByRole("button", { name: /Official Govt Data \(CPA\/BMD\)/i });
    await expect(govTab).toBeVisible();
    await govTab.click();
  });

  test("renders official Bangladesh Government provenance banner and external portal links", async ({ page }) => {
    // Official authority banner
    await expect(
      page.getByText(/Bangladesh Government & Chattogram Port Authority Official Reference Data/i)
    ).toBeVisible();
    await expect(page.getByText("Govt Verified Repository")).toBeVisible();
    await expect(page.getByText("OBSERVED").first()).toBeVisible();

    // Portal links
    await expect(page.getByRole("link", { name: /CPA Tide Portal/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /BMD Storm Portal/i })).toBeVisible();

    // Registered source cards
    await expect(page.getByText("SRC-CPA-TIDES-2026")).toBeVisible();
    await expect(page.getByText("SRC-BMD-PATENGA-2026")).toBeVisible();
  });

  test("runs fairway draft compliance checker against CPA tidal tables", async ({ page }) => {
    // Check header
    await expect(
      page.getByText(/CPA Fairway Permissible Draft & Daylight Compliance Checker/i)
    ).toBeVisible();

    // Click "Check Circular Rules" button
    const checkBtn = page.getByRole("button", { name: /Check Circular Rules/i });
    await expect(checkBtn).toBeVisible();
    await checkBtn.click();

    // Default test values (8.9m draft, 182m LOA) should yield compliant with daylight directive
    await expect(page.getByText("COMPLIANT WITH CPA NAVIGATION CIRCULAR")).toBeVisible();
    await expect(page.getByText(/DAYLIGHT HIGH-WATER SLACK navigation only/i)).toBeVisible();

    // Enter draft violation: 10.2m
    const draftInput = page.locator('input[type="number"]').first();
    await draftInput.fill("10.2");
    await checkBtn.click();

    // Should indicate violation
    await expect(page.getByText("CIRCULAR VIOLATION: FAIRWAY TRANSIT RESTRICTED")).toBeVisible();
    await expect(page.getByText(/exceeds the absolute maximum permissible depth/i)).toBeVisible();
  });

  test("switches between berth circulars, BMD marine weather, and throughput statistics", async ({ page }) => {
    // 1. Switch to CPA Berth Specifications
    const berthTab = page.getByRole("button", { name: /CPA Berth Specifications/i });
    await expect(berthTab).toBeVisible();
    await berthTab.click();

    await expect(page.getByText("Chattogram Port Authority Technical Berth Specification Circular")).toBeVisible();
    await expect(page.getByText("CCT-1")).toBeVisible();
    await expect(page.getByText("NCT-1")).toBeVisible();
    await expect(page.getByText("STS Gantry").first()).toBeVisible();

    // Filter to NCT
    const nctBtn = page.getByRole("button", { name: "NCT", exact: true });
    await expect(nctBtn).toBeVisible();
    await nctBtn.click();
    await expect(page.getByText("CCT-1")).not.toBeVisible();
    await expect(page.getByText("NCT-1")).toBeVisible();

    // 2. Switch to BMD Marine Weather & Cyclone Warnings
    const metTab = page.getByRole("button", { name: /BMD Marine Weather & Cyclone Signals/i });
    await expect(metTab).toBeVisible();
    await metTab.click();

    await expect(page.getByText(/Bangladesh Meteorological Department \(BMD\) Patenga Coastal Maritime Bulletins/i)).toBeVisible();
    await expect(page.getByText(/Local Cautionary Signal No. 3/i).first()).toBeVisible();
    await expect(page.getByText("SUSPEND_LIGHTERAGE").first()).toBeVisible();

    // 3. Switch to CPA Annual Throughput Statistics
    const statsTab = page.getByRole("button", { name: /CPA Annual Throughput Statistics/i });
    await expect(statsTab).toBeVisible();
    await statsTab.click();

    await expect(page.getByText(/Chattogram Port Authority \(CPA\) 5-Year Historical Performance Benchmarks/i)).toBeVisible();
    await expect(page.getByText("2024-2025")).toBeVisible();
    await expect(page.getByText(/3,250,410 TEU/i)).toBeVisible();
  });
});

