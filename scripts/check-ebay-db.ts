import path from 'path';

const projectRoot = '/Users/andybryn/projects/arc-score';

async function main() {
  const { getLatestLightweightScan } = await import(path.join(projectRoot, 'src/lib/db/queries'));
  const data = getLatestLightweightScan(66); // eBay brand ID
  if (data) {
    console.log('eBay scan data EXISTS - scanned at:', data.scannedAt);
    console.log('Platform:', JSON.parse(data.platformData || '{}').platform);
    const uaTests = JSON.parse(data.userAgentTests || '[]');
    const blocked = uaTests.filter((t: any) => t.verdict === 'blocked').map((t: any) => t.userAgent);
    console.log('Blocked agents:', blocked.length, blocked);
  } else {
    console.log('eBay: NO SCAN DATA in database');
  }
}

main();
