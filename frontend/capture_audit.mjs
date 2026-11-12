import { chromium } from "@playwright/test";
import path from "path";

const ARTIFACT_DIR = "C:/Users/Farhan/.gemini/antigravity/brain/fa98f2c4-eecf-4532-9a57-d67662ff0f6b";

async function run() {
  console.log("Launching browser for audit verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // 1. Digital Twin - 3D Real WebGL
  console.log("Capturing 3D Digital Twin...");
  await page.goto("http://localhost:3000/digital-twin", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "audit_real_3d_digital_twin.png"),
    fullPage: false,
  });

  // Switch to 2D Isometric View
  console.log("Capturing 2D Isometric View...");
  const btn2D = page.locator("button:has-text('2D Isometric')");
  if (await btn2D.count() > 0) {
    await btn2D.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "audit_2d_isometric_view.png"),
      fullPage: false,
    });
  }

  // Switch to Thermal IR View
  console.log("Capturing Thermal IR View...");
  const btnThermal = page.locator("button:has-text('Thermal IR')");
  if (await btnThermal.count() > 0) {
    await btnThermal.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "audit_thermal_ir_view.png"),
      fullPage: false,
    });
  }

  // 2. Vessels / Fairway Navigation (Geospatial MapLibre & Polar Radar)
  console.log("Capturing Vessels Fairway Navigation (ECDIS GIS Chart)...");
  await page.goto("http://localhost:3000/vessels", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "audit_vessels_ecdis_gis.png"),
    fullPage: false,
  });

  // Switch to Polar Radar Sweep
  console.log("Capturing Vessels Fairway Navigation (Polar Radar Sweep)...");
  const btnPolar = page.locator("button:has-text('Polar Sweep')");
  if (await btnPolar.count() > 0) {
    await btnPolar.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "audit_vessels_polar_sweep.png"),
      fullPage: false,
    });
  }

  // 3. Copilot Tactical Cockpit
  console.log("Capturing Copilot Tactical Cockpit...");
  await page.goto("http://localhost:3000/copilot", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "audit_copilot_cockpit.png"),
    fullPage: false,
  });

  console.log("Verification screenshots captured successfully!");
  await browser.close();
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
