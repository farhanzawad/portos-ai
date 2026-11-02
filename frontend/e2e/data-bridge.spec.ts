import { test, expect } from "@playwright/test";

test.describe("Port Data Bridge & Document Ingestion (Milestone 13)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/data-centre");
    await page.waitForLoadState("networkidle");
    // Switch to Data Ingestion (M13) tab
    const ingestionTab = page.getByRole("button", { name: /Data Ingestion \(M13\)/i });
    await expect(ingestionTab).toBeVisible();
    await ingestionTab.click();
  });

  test("renders upload dropzone, security badges, and template download links", async ({ page }) => {
    // Header & Subtitle
    await expect(page.getByText("Port Data Bridge — Secure Document Ingestion")).toBeVisible();
    await expect(page.getByText("Stage public schedules or agent manifests with automatic provenance")).toBeVisible();

    // DEMO ENVIRONMENT banner
    await expect(page.getByText("DEMO ENVIRONMENT")).toBeVisible();

    // Security Pills
    await expect(page.getByText("SHA-256 Checksum Stamped")).toBeVisible();
    await expect(page.getByText("Formula Injection Sanitized")).toBeVisible();
    await expect(page.getByText("Human-in-the-Loop Review")).toBeVisible();

    // Download template links
    await expect(page.getByRole("link", { name: "CSV Template" })).toBeVisible();
    await expect(page.getByRole("link", { name: "XLSX Template" })).toBeVisible();
  });

  test("loads synthetic berthing sample and extracts candidate records with SHA-256 stamp", async ({ page }) => {
    // Click Load Synthetic Sample
    const sampleBtn = page.getByRole("button", { name: "Load Synthetic Sample" });
    await expect(sampleBtn).toBeVisible();
    await sampleBtn.click();

    // Review Table should appear
    await expect(page.getByText("synthetic_chattogram_berthing_log.csv").first()).toBeVisible();
    await expect(page.getByText(/SHA-256:/i).first()).toBeVisible();

    // Summary counts
    await expect(page.getByText("Total Parsed")).toBeVisible();
    await expect(page.getByText("Valid Rows")).toBeVisible();

    // Verify extracted rows
    await expect(page.getByText("MV Karnaphuli Pioneer")).toBeVisible();
    await expect(page.getByText("9381024")).toBeVisible();
    await expect(page.getByText("MV Bay Bengal")).toBeVisible();
    await expect(page.getByText("CCT-1").first()).toBeVisible();
  });

  test("allows human-in-the-loop row editing and correction before committing", async ({ page }) => {
    // Load sample
    await page.getByRole("button", { name: "Load Synthetic Sample" }).click();
    await expect(page.getByText("MV Karnaphuli Pioneer")).toBeVisible();

    // Click edit on the first row
    const editBtn = page.getByTitle("Edit row candidate values").first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Edit berth input to NCT-3
    const berthInput = page.locator("input.uppercase").first();
    await expect(berthInput).toBeVisible();
    await berthInput.fill("NCT-3");

    // Click save
    const saveBtn = page.getByTitle("Save corrections").first();
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Verify updated berth code is visible
    await expect(page.getByText("NCT-3")).toBeVisible();
  });

  test("allows human-in-the-loop row rejection", async ({ page }) => {
    // Load sample
    await page.getByRole("button", { name: "Load Synthetic Sample" }).click();
    await expect(page.getByText("MV Surma Voyager")).toBeVisible();

    // Click reject on a row
    const rejectBtn = page.getByRole("button", { name: "Reject" }).last();
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    // Rejection count should reflect in footer
    await expect(page.getByText(/1 marked for rejection/i)).toBeVisible();
  });

  test("confirms dataset through review modal and generates verifiable provenance report", async ({ page }) => {
    // Load sample
    await page.getByRole("button", { name: "Load Synthetic Sample" }).click();
    await expect(page.getByText("MV Karnaphuli Pioneer")).toBeVisible();

    // Click Confirm & Ingest Selected
    const ingestBtn = page.getByRole("button", { name: /Confirm & Ingest Selected/i });
    await expect(ingestBtn).toBeVisible();
    await ingestBtn.click();

    // Modal appears
    await expect(page.getByRole("heading", { name: "Human Review & Operational Commitment" })).toBeVisible();
    await expect(page.getByText("Reviewer Name / Operator ID")).toBeVisible();

    // Enter certified reviewer
    const reviewerInput = page.locator("#reviewer-name");
    await reviewerInput.fill("Senior Pilot Ahmed");

    // Click Confirm & Ingest in modal
    const confirmBtn = page.getByRole("button", { name: "Confirm & Ingest", exact: true });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Ingestion Audit Report Card should appear
    await expect(page.getByRole("heading", { name: "Ingestion Audit Report & Provenance Certificate" })).toBeVisible();
    await expect(page.getByText("VERIFIED").first()).toBeVisible();
    await expect(page.getByText("OBSERVED").first()).toBeVisible();
    await expect(page.getByText("Senior Pilot Ahmed", { exact: true })).toBeVisible();
    await expect(page.getByText("Provenance Hash:", { exact: true })).toBeVisible();

    // View Vessel Intelligence link
    await expect(page.getByRole("link", { name: "View Vessel Intelligence" })).toBeVisible();
  });
});
