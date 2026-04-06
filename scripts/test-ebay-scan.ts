import path from 'path';

const projectRoot = '/Users/andybryn/projects/arc-score';

async function main() {
  const { runLightweightScan } = await import(path.join(projectRoot, 'src/lib/scanner/lightweight-scanner'));
  const { db } = await import(path.join(projectRoot, 'src/lib/db'));
  const schema = await import(path.join(projectRoot, 'src/lib/db/schema'));
  const { insertLightweightScan } = await import(path.join(projectRoot, 'src/lib/db/queries'));
  const { eq } = await import('drizzle-orm');

  const brand = db.select().from(schema.brands).where(eq(schema.brands.slug, 'ebay')).get();
  console.log('Brand:', JSON.stringify(brand));

  console.log('Starting eBay scan at', new Date().toISOString());
  const t = Date.now();
  
  try {
    const result = await runLightweightScan('https://www.ebay.com', undefined);
    console.log('Completed in', Date.now() - t, 'ms');
    console.log('Platform:', result.platform.platform);
    const blocked = result.userAgentTests.filter((u: any) => u.verdict === 'blocked').map((u: any) => u.userAgent);
    console.log('Blocked agents:', blocked);
    console.log('RobotsTxt found:', result.robotsTxt.found);
    
    if (brand) {
      insertLightweightScan(brand.id, result);
      console.log('Saved to database for brand ID:', brand.id);
    }
  } catch (err: any) {
    console.error('Error after', Date.now() - t, 'ms:', err.message);
  }
}

main();
