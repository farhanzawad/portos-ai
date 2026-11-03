import { test, expect } from "@playwright/test";

test.describe("Optional Segments: B (AIS Adapter), C (Equipment Maintenance Anomaly), D (Research Evaluation)", () => {
  test("Optional B: AIS Provider Diagnostics Modal operates with strict truthfulness", async ({
    page,
  }) => {
    await page.goto("/vessels");
    await page.waitForLoadState("networkidle");

    // Check header AIS button
    const aisBtn = page.getByRole("button", {
      name: /AIS Provider Diagnostics/i,
    });
    await expect(aisBtn).toBeVisible();
    await aisBtn.click();

    // Verify modal appears
    await expect(
      page.getByText("Commercial AIS Provider Diagnostics", { exact: false }).first()
    ).toBeVisible();

    // Verify Prime Directive 3 Truthfulness banner
    await expect(
      page.getByText("Operational Truthfulness Audit (Directive 3)", { exact: false })
    ).toBeVisible();

    // Verify active provider status
    await expect(page.getByText("Feed Mode:", { exact: false })).toBeVisible();
    await expect(page.getByText("Active AIS Targets", { exact: false })).toBeVisible();

    // Trigger Test Connection button
    const testConnBtn = page.getByRole("button", {
      name: "Test Connection",
      exact: true,
    });
    await expect(testConnBtn).toBeVisible();
    await testConnBtn.click();

    // Expect diagnostic result
    await expect(
      page.getByText("Diagnostics Response Received:", { exact: false })
    ).toBeVisible({ timeout: 10000 });

    // Close modal
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(
      page.getByText("Commercial AIS Provider Diagnostics", { exact: false })
    ).not.toBeVisible();
  });

  test("Optional C: Equipment Health & Isolation Forest Anomaly Detection Modal", async ({
    page,
  }) => {
    await page.goto("/digital-twin");
    await page.waitForLoadState("networkidle");

    // Check header Equipment Health button
    const eqBtn = page.getByRole("button", {
      name: /Equipment Health & Anomaly Detector/i,
    });
    await expect(eqBtn).toBeVisible();
    await eqBtn.click();

    // Verify modal appears
    await expect(
      page.getByText(/Quayside Equipment Health & Telemetry Anomaly Detection/i)
    ).toBeVisible();

    // Verify Prime Directive 3 disclaimer
    await expect(
      page.getByText(/Prime Directive 3 Notice: Equipment sensor telemetry/i)
    ).toBeVisible();

    // Verify scikit-learn Isolation Forest tag
    await expect(
      page.getByText(/scikit-learn Isolation Forest/i)
    ).toBeVisible();

    // Verify units list and KPIs
    await expect(page.getByText("Total Cranes")).toBeVisible();
    await expect(page.getByText("Nominal / Healthy")).toBeVisible();

    // Check interactive anomaly injection
    const injectBtn = page.getByRole("button", {
      name: /Inject Anomaly into/i,
    });
    await expect(injectBtn).toBeVisible();
    await injectBtn.click();

    // Verify success feedback
    await expect(
      page.getByText(/Anomaly injected into equipment/i)
    ).toBeVisible({ timeout: 10000 });

    // Click Reset
    const resetBtn = page.getByRole("button", {
      name: /Reset All to Baseline/i,
    });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    await expect(
      page.getByText(/Telemetry successfully reset/i)
    ).toBeVisible({ timeout: 10000 });

    // Close modal
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(
      page.getByText(/Quayside Equipment Health & Telemetry Anomaly Detection/i)
    ).not.toBeVisible();
  });

  test("Optional D: Research-Grade Model Evaluation Card in Model Centre", async ({
    page,
  }) => {
    await page.goto("/data-centre");
    await page.waitForLoadState("networkidle");

    // Ensure Model Centre tab is active (default)
    await expect(
      page.getByText(/Research-Grade Evaluation: Expanding-Window Cross-Validation/i)
    ).toBeVisible({ timeout: 15000 });

    // Verify temporal cross validation features
    await expect(
      page.getByText("5-Fold Temporal Expanding Window", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Probability Calibration & Reliability Curve", { exact: true })
    ).toBeVisible();

    // Verify metrics exist
    await expect(page.getByText("Mean Temporal MAE", { exact: true })).toBeVisible();
    await expect(page.getByText("Brier Score", { exact: true })).toBeVisible();
    await expect(page.getByText("ECE (Calibration Error)", { exact: true })).toBeVisible();

    // Check fold rows
    await expect(page.getByText("Fold #1", { exact: true })).toBeVisible();
    await expect(page.getByText("Fold #5", { exact: true })).toBeVisible();

    // Check calibration bin rows
    await expect(page.getByText("Bin #1", { exact: true })).toBeVisible();
  });
});
