import { test, expect } from "@playwright/test";

const mockMetadata = {
  model_name: "portos-vessel-delay-ensemble",
  model_version: "1.0.0",
  trained_at: "2026-11-03T00:00:00Z",
  random_seed: 42,
  n_train_samples: 2400,
  n_test_samples: 600,
  feature_columns: [
    "vessel_type_code",
    "distance_to_pilot_nm",
    "speed_knots",
    "scheduled_hour_of_day",
    "anchorage_queue_count",
    "berth_occupancy_ratio",
    "wind_speed_knots",
    "visibility_nm",
    "is_monsoon_season",
    "tidal_window_favorable",
    "carrier_historical_delay_mean",
  ],
  operational_notice:
    "Synthetic-data demonstration. Not validated for real Chattogram Port operations.",
  data_status: "SIMULATED",
};

const mockEvaluation = {
  regression_metrics: {
    model_type: "GradientBoostingRegressor",
    mae_hours: 0.846,
    rmse_hours: 1.09,
    r2_score: 0.887,
    baseline_median_mae_hours: 2.737,
    mae_improvement_pct: 69.08,
    beats_baseline: true,
  },
  classification_metrics: {
    model_type: "GradientBoostingClassifier",
    accuracy: 0.922,
    precision: 0.941,
    recall: 0.965,
    f1_score: 0.953,
    baseline_accuracy: 0.82,
    confusion_matrix: {
      tn: 78,
      fp: 30,
      fn: 17,
      tp: 475,
    },
    beats_baseline: true,
  },
  feature_importances: {
    tidal_window_favorable: 0.5497,
    vessel_type_code: 0.1457,
    anchorage_queue_count: 0.1005,
    carrier_historical_delay_mean: 0.0786,
    speed_knots: 0.0668,
  },
  target_definitions: {
    regression_target: "arrival_delay_hours",
    classification_target: "is_delayed_high_risk",
    high_risk_threshold_hours: 3.0,
  },
};

const mockPrediction = {
  predicted_delay_hours: 4.25,
  is_delayed_high_risk: true,
  delay_risk_probability: 0.882,
  delay_risk_tier: "HIGH_RISK",
  high_risk_threshold_hours: 3.0,
  model_name: "portos-vessel-delay-ensemble",
  model_version: "1.0.0",
  created_at: "2026-11-03T00:00:00Z",
  data_status: "SIMULATED",
  operational_notice:
    "Synthetic-data demonstration. Not validated for real Chattogram Port operations.",
};

test.describe("Model Centre & Predictive Pipelines", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/models/metadata*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockMetadata),
      });
    });

    await page.route("**/api/v1/models/evaluation*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockEvaluation),
      });
    });

    await page.route("**/api/v1/models/predict*", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockPrediction),
      });
    });
  });

  test("should render the Model Centre tab with metadata and notice banner", async ({
    page,
  }) => {
    await page.goto("/data-centre");

    await expect(
      page.getByRole("heading", {
        name: "Model Centre & Data Management",
      })
    ).toBeVisible();

    await expect(
      page.getByText(
        "Synthetic-data demonstration. Not validated for real Chattogram Port operations."
      ).first()
    ).toBeVisible();

    await expect(page.getByText("portos-vessel-delay-ensemble")).toBeVisible();
    await expect(page.getByText("2400 voyages")).toBeVisible();
  });

  test("should display transparent regression and classification metrics with baseline comparison", async ({
    page,
  }) => {
    await page.goto("/data-centre");

    // Regression Task Metrics
    await expect(page.getByText("Task 1: ETA Delay Regression")).toBeVisible();
    await expect(page.getByText("0.846h")).toBeVisible();
    await expect(page.getByText("2.737h")).toBeVisible();
    await expect(page.getByText("+69.08%")).toBeVisible();
    await expect(page.getByText("CONFIRMED")).toBeVisible();

    // Classification Task Metrics
    await expect(
      page.getByText("Task 2: High Delay Risk Classification")
    ).toBeVisible();
    await expect(page.getByText("92.2%")).toBeVisible();
    await expect(page.getByText("0.953")).toBeVisible();

    // Confusion Matrix Elements
    await expect(page.getByText("True Positives")).toBeVisible();
    await expect(page.getByText("475")).toBeVisible();
  });

  test("should display feature importance rankings", async ({ page }) => {
    await page.goto("/data-centre");

    await expect(page.getByText("Feature Importance Rankings")).toBeVisible();
    await expect(page.getByText("tidal_window_favorable")).toBeVisible();
    await expect(page.getByText("55.0%")).toBeVisible();
  });

  test("should execute live inference in the sandbox and display predictions", async ({
    page,
  }) => {
    await page.goto("/data-centre");

    const submitBtn = page.getByRole("button", {
      name: /Run Real-Time Delay Prediction/i,
    });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Expect output card
    await expect(page.getByText("Inference Prediction Result")).toBeVisible();
    await expect(page.getByText("+4.25 hrs")).toBeVisible();
    await expect(page.getByText("88.2%")).toBeVisible();
    await expect(page.getByText("HIGH_RISK").first()).toBeVisible();
  });

  test("should switch to Data Ingestion (M13) tab", async ({ page }) => {
    await page.goto("/data-centre");

    const ingestionTab = page.getByRole("button", {
      name: /Data Ingestion \(M13\)/i,
    });
    await expect(ingestionTab).toBeVisible();
    await ingestionTab.click();

    await expect(
      page.getByText(/Port Data Bridge/i).first()
    ).toBeVisible();
  });
});

