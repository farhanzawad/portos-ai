import { test, expect } from "@playwright/test";

test.describe("Unified Event Stream & Cross-Module Workflow Sync (Milestone 15)", () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh by triggering reset if any prior incident was active
    await page.goto("/events");
    await page.waitForLoadState("networkidle");
  });

  test("renders event stream page header, SSE pill, presets, and 8-stage lifecycle", async ({ page }) => {
    // Header & Subtitle
    await expect(page.getByRole("heading", { level: 1, name: "Event Stream & Workflow Sync" })).toBeVisible();
    await expect(
      page.getByText("Real-time SSE event bus, deterministic incident injection, and cross-module operational state synchronization")
    ).toBeVisible();

    // DEMO ENVIRONMENT layout banner
    await expect(page.getByText("DEMO ENVIRONMENT")).toBeVisible();

    // SSE Stream Live pill
    await expect(page.getByText(/SSE Stream Live|Connecting|Reconnecting/i).first()).toBeVisible();

    // Incident control banner & Presets
    await expect(page.getByText("Deterministic Incident Injection & Cross-Module Sync")).toBeVisible();
    await expect(page.getByText("Monsoon Fairway Surge").first()).toBeVisible();
    await expect(page.getByText("Quayside STS Crane #02 Cable Fault").first()).toBeVisible();
    await expect(page.getByText("Import Yard Block B Congestion Surge").first()).toBeVisible();

    // 8-Stage Lifecycle Visualization
    await expect(page.getByText("End-to-End Operational Incident Lifecycle")).toBeVisible();
    await expect(page.getByRole("link", { name: /Incident Injected/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Prediction Updated/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Overview Alert/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Berth Planner Proposal/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Decision Lab Trade-Offs/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Digital Twin Spatial Sync/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Copilot Explanation/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Human Approval/i })).toBeVisible();

    // Event Log Table
    await expect(page.getByText("Live Operational Event Bus Log")).toBeVisible();
  });

  test("injects deterministic monsoon surge incident and verifies live event sequence", async ({ page }) => {
    // Select Monsoon Fairway Surge preset (default)
    const injectBtn = page.getByRole("button", { name: /Inject Incident/i });
    await expect(injectBtn).toBeVisible();
    await injectBtn.click();

    // Feedback confirmation
    await expect(page.getByText(/Incident injected: Injected Monsoon Surge delay/i)).toBeVisible({ timeout: 10000 });

    // Active Incident badge
    await expect(page.getByText(/Incident Active: monsoon_surge_delay/i)).toBeVisible();

    // Verify Sequenced Events in Live Event Log
    await expect(page.locator("table").getByText("incident.injected").first()).toBeVisible();
    await expect(page.locator("table").getByText("vessel.delay.risk.changed").first()).toBeVisible();
    await expect(page.locator("table").getByText("operational.alert.created").first()).toBeVisible();

    // Inspect an event payload
    const inspectBtn = page.locator("table").getByRole("button", { name: /Inspect/i }).first();
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    await expect(page.getByText("Payload Version: 1.0.0").first()).toBeVisible();
    await expect(page.getByText("Data Status: SIMULATED").first()).toBeVisible();
  });

  test("verifies injected incident propagates to Overview alert and Vessel risk", async ({ page }) => {
    // 1. Inject incident
    const injectBtn = page.getByRole("button", { name: /Inject Incident/i });
    await injectBtn.click();
    await expect(page.getByText(/Incident injected/i)).toBeVisible({ timeout: 10000 });

    // 2. Navigate to Overview Dashboard
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Operational alert card should reflect the injected Monsoon Surge
    await expect(
      page.getByText(/Monsoon Surge/i).first()
    ).toBeVisible({ timeout: 10000 });

    // 3. Navigate to Vessel Intelligence
    await page.goto("/vessels");
    await page.waitForLoadState("networkidle");

    // Should display HIGH_RISK badge for the delayed vessel
    await expect(page.getByText("HIGH_RISK").first()).toBeVisible({ timeout: 10000 });
  });

  test("resets incident to clean baseline deterministically", async ({ page }) => {
    // Inject incident first
    const injectBtn = page.getByRole("button", { name: /Inject Incident/i });
    await injectBtn.click();
    await expect(page.getByText(/Incident injected/i)).toBeVisible({ timeout: 10000 });

    // Click Reset to Baseline
    const resetBtn = page.getByRole("button", { name: /Reset to Baseline/i });
    await expect(resetBtn).toBeEnabled();
    await resetBtn.click();

    // Feedback confirmation
    await expect(
      page.getByText(/Baseline restored. Injected delays and disruptions cleared/i)
    ).toBeVisible({ timeout: 10000 });

    // Baseline badge restored
    await expect(page.getByText("Clean Baseline State")).toBeVisible();

    // incident.reset event emitted
    await expect(page.locator("table").getByText("incident.reset").first()).toBeVisible();
  });
});
