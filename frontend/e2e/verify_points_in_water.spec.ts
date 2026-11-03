import { test, expect } from '@playwright/test';

test('verify 100% of 12 vessel positions hit water', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/digital-twin', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /2D GIS Map/i }).click();
  await page.waitForTimeout(2000);

  const vessels = [
    { id: 'vsl_01', coord: [91.8020, 22.3040], name: 'Karnaphuli Pioneer (Berthed CCT)' },
    { id: 'vsl_02', coord: [91.7990, 22.3000], name: 'Bay Feeder Express (Berthed CCT)' },
    { id: 'vsl_03', coord: [91.7960, 22.2940], name: 'Padma Bridge Star (Berthed NCT)' },
    { id: 'vsl_04', coord: [91.7500, 22.1750], name: 'Karnaphuli Express (Anchorage)' },
    { id: 'vsl_05', coord: [91.7250, 22.1550], name: 'Bengal Pearl (Anchorage)' },
    { id: 'vsl_06', coord: [91.7750, 22.1950], name: 'Meghna Carrier (Underway)' },
    { id: 'vsl_07', coord: [91.7000, 22.1300], name: 'Sundarban Pride (Anchorage)' },
    { id: 'vsl_08', coord: [91.7450, 22.1700], name: 'Karnaphuli Voyager (Anchorage)' },
    { id: 'vsl_09', coord: [91.7920, 22.2080], name: 'Chittagong Trader (Pilot Boarding)' },
    { id: 'vsl_10', coord: [91.8095, 22.2260], name: 'Shitalakshya Wave (Mouth Entry)' },
    { id: 'vsl_11', coord: [91.8295, 22.2450], name: 'Rupsha Hope (Patenga Reach)' },
    { id: 'vsl_12', coord: [91.7998, 22.2800], name: 'Jamuna Horizon (Gupta Bend)' },
  ];

  const errors: any[] = [];

  for (const v of vessels) {
    const res = await page.evaluate(async (point: [number, number]) => {
      const map = (window as any).__portMap;
      map.jumpTo({ center: point, zoom: 13.5 });
      await new Promise(r => setTimeout(r, 120));

      const p = map.project(point);
      const feats = map.queryRenderedFeatures([p.x, p.y]);
      const isWater = feats.some((f: any) => 
        (f.layer.id && f.layer.id.includes('water')) || 
        (f.properties && (f.properties.class === 'water' || f.properties.natural === 'water'))
      );
      return { isWater };
    }, v.coord as [number, number]);

    if (!res.isWater) {
      errors.push(v);
    }
  }

  console.log('Vessel water errors:', errors);
  expect(errors.length).toBe(0);
});
