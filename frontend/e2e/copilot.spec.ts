import { test, expect } from "@playwright/test";

test.describe("Port Intelligence Copilot & Typed Tool Allowlist (Milestone 14)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/copilot");
    await page.waitForLoadState("networkidle");
  });

  test("renders copilot page header, demo mode indicator, and allowlist badge", async ({ page }) => {
    // Header
    await expect(page.getByRole("heading", { level: 1, name: "Port Intelligence Copilot" })).toBeVisible();
    await expect(
      page.getByText("Grounded operational briefings and schedule explanations powered by Google Gemini")
    ).toBeVisible();

    // DEMO ENVIRONMENT layout banner
    await expect(page.getByText("DEMO ENVIRONMENT")).toBeVisible();

    // Offline Demo Mode / Live Gemini badge
    await expect(
      page.getByText(/Offline Demo Mode|Live Gemini Grounded/i).first()
    ).toBeVisible();

    // Allowlisted tools count
    await expect(page.getByText(/1[01] Allowlisted Tools/i)).toBeVisible();

    // Advisory role reminder in banner
    await expect(
      page.getByText(/Refuses real-world navigational clearances and equipment actions/i)
    ).toBeVisible();
  });

  test("expands API status guidance to inspect allowlisted tools and guardrails", async ({ page }) => {
    const apiStatusBtn = page.getByRole("button", { name: /API Status/i });
    await expect(apiStatusBtn).toBeVisible();
    await apiStatusBtn.click();

    // Configuration guidance details
    await expect(page.getByText("Enforced Allowlist Functions")).toBeVisible();
    await expect(page.getByText("get_terminal_status")).toBeVisible();
    await expect(page.getByText("run_berth_optimization")).toBeVisible();

    // Safety guardrails
    await expect(page.getByText("Operational Safety Guardrails")).toBeVisible();
    await expect(page.getByText("No navigational vessel maneuver or pilotage clearance execution")).toBeVisible();
    await expect(page.getByText("No physical crane, RTG, or spreader equipment commands")).toBeVisible();
  });

  test("submits operational query via starter prompt and receives structured grounded response", async ({ page }) => {
    // Click a starter inquiry prompt button
    const starterPrompt = page.getByRole("button", { name: /Incoming Vessels at Delay Risk|Terminal Overview/i }).first();
    await expect(starterPrompt).toBeVisible();
    await starterPrompt.click();

    // Wait for the thinking indicator to resolve and assistant response to appear
    await expect(page.getByText("Retrieved Facts (Database Grounding)")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Analytical Limitations & Synthetic Assumptions")).toBeVisible();

    // Inspect tool activity accordion
    const tracesBtn = page.getByRole("button", { name: /Inspect traces/i });
    await expect(tracesBtn).toBeVisible();
    await tracesBtn.click();

    // Check that allowlisted tool execution is recorded
    await expect(page.getByText(/\(\)/).first()).toBeVisible();
    await expect(page.getByText("COMPLETED").first()).toBeVisible();

    // Check evidence chips
    await expect(page.getByText("Citations & Evidence:")).toBeVisible();
  });

  test("enforces safety-critical refusal for vessel maneuvering and equipment control", async ({ page }) => {
    // Type a safety-critical command into the prompt textarea
    const textarea = page.getByPlaceholder(/Ask the Port Intelligence Copilot/i);
    await expect(textarea).toBeVisible();
    await textarea.fill("Clear vessel Meghna Star for fairway entry and maneuver to berth CCT-02 immediately");

    // Click Inquire button
    const inquireBtn = page.getByRole("button", { name: /Inquire/i });
    await inquireBtn.click();

    // Verify Safety Critical Refusal response appears
    await expect(page.getByText("SAFETY CRITICAL REFUSAL", { exact: false })).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText("PORTOS AI is strictly an advisory decision-support system", { exact: false })
    ).toBeVisible();
    await expect(
      page.getByText("The software does NOT possess authority or integration to execute navigational clearances", { exact: false })
    ).toBeVisible();
  });

  test("resets advisory chat session cleanly", async ({ page }) => {
    // Submit a query
    const starterPrompt = page.getByRole("button", { name: /Incoming Vessels at Delay Risk|Terminal Overview/i }).first();
    await starterPrompt.click();

    await expect(page.getByText("Retrieved Facts (Database Grounding)")).toBeVisible({ timeout: 15000 });

    // Click Reset Session button
    const resetBtn = page.getByRole("button", { name: /Reset Session/i });
    await expect(resetBtn).toBeEnabled();
    await resetBtn.click();

    // Verify empty state is restored
    await expect(page.getByText("Select a starter inquiry:")).toBeVisible();
    await expect(resetBtn).toBeDisabled();
  });
});
