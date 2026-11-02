import { test, expect } from "@playwright/test";

test.describe("Milestone 16 — Responsible-AI, Security, Accessibility & QA Audit", () => {
  test("displays persistent DEMO ENVIRONMENT banner across core routes", async ({ page }) => {
    const routes = ["/", "/vessels", "/berth-planner", "/scenario-lab", "/yard", "/events", "/data-centre", "/copilot"];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");

      // Verify DEMO ENVIRONMENT badge
      const demoBadge = page.getByText("DEMO ENVIRONMENT").first();
      await expect(demoBadge).toBeVisible();

      // Verify illustrative simulation notice
      await expect(
        page.getByText(/Illustrative Chattogram Terminal Simulation/i).first()
      ).toBeVisible();

      // Verify Data: SIMULATED badge in header
      await expect(page.locator("header").getByText("SIMULATED").first()).toBeVisible();
    }
  });

  test("displays operational truthfulness & AI disclosure in global footer", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    // Verify Blue AI Challenge 2026-27 attribution
    await expect(footer.getByText(/Blue AI Challenge 2026–27/i)).toBeVisible();

    // Verify Advisory Only disclaimer
    await expect(
      footer.getByText(/purely advisory proposals/i)
    ).toBeVisible();

    // Verify disclaimer about CPA TOS integration
    await expect(
      footer.getByText(/Not connected to CPA TOS, customs, or physical port machinery/i)
    ).toBeVisible();

    // Verify quick links in footer
    await expect(footer.getByRole("link", { name: /Data Lineage/i })).toHaveAttribute("href", "/data-centre");
    await expect(footer.getByRole("link", { name: /Tool Allowlist/i })).toHaveAttribute("href", "/copilot");
    await expect(footer.getByRole("link", { name: /Event Stream/i })).toHaveAttribute("href", "/events");
    await expect(footer.getByRole("link", { name: /Decision Lab/i })).toHaveAttribute("href", "/scenario-lab");

    // Verify Bangladesh standard time indicator
    await expect(footer.getByText(/Asia\/Dhaka \(BST, UTC\+6\)/i)).toBeVisible();
  });

  test("toggles reduced motion mode and applies motion-reduce class", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const appShell = page.locator("div.min-h-screen").first();
    const motionToggleBtn = page.getByRole("button", { name: /Motion:/i }).first();
    await expect(motionToggleBtn).toBeVisible();

    // Initial state: standard motion
    await expect(motionToggleBtn).toContainText(/Motion: Standard/i);
    await expect(appShell).not.toHaveClass(/motion-reduce/);

    // Click toggle to enable reduced motion
    await motionToggleBtn.click();
    await expect(motionToggleBtn).toContainText(/Motion: Reduced/i);
    await expect(appShell).toHaveClass(/motion-reduce/);

    // Click again to revert to standard motion
    await motionToggleBtn.click();
    await expect(motionToggleBtn).toContainText(/Motion: Standard/i);
    await expect(appShell).not.toHaveClass(/motion-reduce/);
  });

  test("verifies tabular figures styling on operational KPIs and clocks", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // The header clock has .tabular-nums
    const clock = page.locator("header .tabular-nums").first();
    await expect(clock).toBeVisible();
    await expect(clock).toContainText(/BST/);
  });

  test("audits navigation across all operational modules with zero uncaught console errors", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      // Exclude minified react hydration notices if triggered during fast programmatic page navigation
      if (!err.message.includes("react.dev/errors")) {
        pageErrors.push(err.message);
      }
    });

    const routes = [
      "/",
      "/vessels",
      "/berth-planner",
      "/scenario-lab",
      "/digital-twin",
      "/yard",
      "/green-port",
      "/events",
      "/data-centre",
      "/copilot",
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      // Basic sanity check that heading exists
      await expect(page.locator("h1").first()).toBeVisible();
    }

    // Assert zero uncaught runtime exceptions across the entire user journey
    expect(pageErrors).toEqual([]);
  });
});
