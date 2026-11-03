import { test, expect } from "@playwright/test";

test.describe("Geospatial Port Mapping & Synchronized 3D Digital Twin", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept backend geospatial endpoints if needed, or allow real backend
    await page.goto("/digital-twin");
  });

  test("renders digital twin workspace with RSGT PCT masterplan attribution", async ({ page }) => {
    // Page Title
    await expect(page.locator("h1")).toContainText("Interactive Terminal Digital Twin");
    // Conceptual Masterplan Badge
    await expect(page.getByText("RSGT PCT MASTERPLAN CONCEPTUAL")).toBeVisible();
    // Operational Datum
    await expect(page.getByText("Datum: CD +0.0m")).toBeVisible();
    // Workspace Controls Bar
    await expect(page.getByText("Digital Twin Workspace")).toBeVisible();
  });

  test("supports switching between 3D Twin, 2D GIS Map, and Synchronized Split View", async ({ page }) => {
    // Verify view mode switcher buttons
    const btn3D = page.getByRole("button", { name: /3D Twin/i });
    const btn2D = page.getByRole("button", { name: /2D GIS Map/i });
    const btnSplit = page.getByRole("button", { name: /Split View/i });

    await expect(btn3D).toBeVisible();
    await expect(btn2D).toBeVisible();
    await expect(btnSplit).toBeVisible();

    // 1. Switch to 2D GIS Map
    await btn2D.click();
    await expect(page.getByText("CHATTOGRAM MARITIME GIS FAIRWAY")).toBeVisible();
    await expect(page.getByText("Maritime Overlays")).toBeVisible();

    // Verify GIS tools in 2D mode
    await expect(page.getByRole("button", { name: /Measure/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Inspect/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Base:/i })).toBeVisible();
    await expect(page.getByText("Scale:")).toBeVisible();

    // 2. Switch to Synchronized Split View
    await btnSplit.click();
    // In split view, both 2D fairway bar and 3D camera controls are visible
    await expect(page.getByText("CHATTOGRAM MARITIME GIS FAIRWAY")).toBeVisible();
    await expect(page.getByRole("button", { name: /Isometric/i })).toBeVisible();

    // 3. Switch back to 3D Twin
    await btn3D.click();
    await expect(page.getByRole("button", { name: "Isometric", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Plan (Top)", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Operational", exact: true })).toBeVisible();
  });

  test("supports 3D camera presets (Isometric, Top-down Plan, Operational Low-Angle)", async ({ page }) => {
    const btnPlan = page.getByRole("button", { name: "Plan (Top)", exact: true });
    const btnOperational = page.getByRole("button", { name: "Operational", exact: true });
    const btnIsometric = page.getByRole("button", { name: "Isometric", exact: true });

    await expect(btnPlan).toBeVisible();
    await btnPlan.click();
    await expect(btnPlan).toHaveClass(/bg-portos-teal/);

    await btnOperational.click();
    await expect(btnOperational).toHaveClass(/bg-portos-teal/);

    await btnIsometric.click();
    await expect(btnIsometric).toHaveClass(/bg-portos-teal/);
  });

  test("runs synchronized terminal simulation with speed controls", async ({ page }) => {
    test.setTimeout(45000);
    const simButton = page.getByRole("button", { name: /Simulate/i });
    await expect(simButton).toBeVisible();

    // Start simulation
    await simButton.click();
    const pauseBtn = page.getByRole("button", { name: /Pause/i });
    await expect(pauseBtn).toBeVisible();

    // Toggle speed to 2x then 5x
    const speed2x = page.getByRole("button", { name: "2x" });
    await speed2x.click();
    await expect(speed2x).toHaveClass(/text-white/);

    const speed5x = page.getByRole("button", { name: "5x" });
    await speed5x.click();
    await expect(speed5x).toHaveClass(/text-white/);

    // Pause simulation
    await pauseBtn.click();
    await expect(page.getByRole("button", { name: /Simulate/i })).toBeVisible();
  });

  test("interacts with 2D maritime GIS layers and measurement tool", async ({ page }) => {
    // Switch to 2D GIS Map
    await page.getByRole("button", { name: /2D GIS Map/i }).click();

    // Toggle Measure mode
    const measureBtn = page.getByRole("button", { name: /Measure/i });
    await measureBtn.click();
    await expect(page.getByText("Hydrographic Fairway Measure")).toBeVisible();
    await expect(page.getByText("Distance (Meters):")).toBeVisible();
    await expect(page.getByText("Distance (Nautical):")).toBeVisible();

    // Clear measurement
    await page.getByText("Clear").click();
    await expect(page.getByText("Hydrographic Fairway Measure")).not.toBeVisible();

    // Open Base Map Selector modal
    const baseBtn = page.getByRole("button", { name: /Base:/i });
    await baseBtn.click();
    await expect(page.getByText("Cartographic Base Map")).toBeVisible();
    await expect(page.getByText("Nautical Dark", { exact: true })).toBeVisible();
    await expect(page.getByText("Offline Vector (Zero Network)", { exact: true })).toBeVisible();
  });

  test("displays and toggles interactive Maritime Cartographic Map Legend", async ({ page }) => {
    // Switch to 2D GIS Map
    await page.getByRole("button", { name: /2D GIS Map/i }).click();

    // Verify Legend is present and visible
    await expect(page.getByText("MARITIME CARTOGRAPHIC LEGEND")).toBeVisible();
    await expect(page.getByText("Vessels (AIS Telemetry & Status)")).toBeVisible();
    await expect(page.getByText("Fairway Channels & Vessel Tracks")).toBeVisible();
    await expect(page.getByText("Bathymetric Depth Contours (CD)")).toBeVisible();
    await expect(page.getByText("Cartographic Provenance")).toBeVisible();

    // Switch tabs within the legend
    await page.getByRole("button", { name: "Vessels", exact: true }).click();
    await expect(page.getByText("Berthed Alongside Quay")).toBeVisible();
    await expect(page.getByText("Inbound / Fairway Transit")).toBeVisible();

    await page.getByRole("button", { name: "Fairway", exact: true }).click();
    await expect(page.getByText("Main Navigation Fairway")).toBeVisible();
    await expect(page.getByText("Dredged Channel Corridor")).toBeVisible();

    // Collapse legend
    const collapseBtn = page.getByRole("button", { name: "Toggle legend collapse" });
    await collapseBtn.click();
    await expect(page.getByText("Main Navigation Fairway")).not.toBeVisible();

    // Expand legend
    await collapseBtn.click();
    await expect(page.getByText("Main Navigation Fairway")).toBeVisible();

    // Toggle legend off via top toolbar button
    const legendToolbarBtn = page.getByRole("button", { name: "Toggle map legend" });
    await legendToolbarBtn.click();
    await expect(page.getByText("MARITIME CARTOGRAPHIC LEGEND")).not.toBeVisible();

    // Toggle legend back on
    await legendToolbarBtn.click();
    await expect(page.getByText("MARITIME CARTOGRAPHIC LEGEND")).toBeVisible();
  });
});
