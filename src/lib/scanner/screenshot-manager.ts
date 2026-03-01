import path from "path";
import fs from "fs";

/**
 * Manages screenshot directories: dynamic paths per brand/date,
 * and cleanup of screenshots older than 14 days.
 *
 * Supports local storage (default) or S3 via SCREENSHOT_STORAGE env var.
 */

const STORAGE_MODE = process.env.SCREENSHOT_STORAGE ?? "local";

export function getScreenshotDir(slug: string): string {
  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const dir = path.join(process.cwd(), "public", "screenshots", slug, date);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getScreenshotUrlPrefix(slug: string): string {
  const date = new Date().toISOString().split("T")[0];

  if (STORAGE_MODE === "s3") {
    const bucket = process.env.S3_BUCKET ?? "arc-score-screenshots";
    const region = process.env.S3_REGION ?? "us-east-1";
    return `https://${bucket}.s3.${region}.amazonaws.com/screenshots/${slug}/${date}`;
  }

  return `/screenshots/${slug}/${date}`;
}

/**
 * Upload a screenshot file to S3 (when SCREENSHOT_STORAGE=s3).
 * Falls back to no-op for local storage since files are already written to disk.
 */
export async function uploadScreenshot(
  localPath: string,
  slug: string,
  filename: string
): Promise<string> {
  if (STORAGE_MODE !== "s3") {
    // Local mode: file already on disk, return the public URL path
    const date = new Date().toISOString().split("T")[0];
    return `/screenshots/${slug}/${date}/${filename}`;
  }

  // S3 upload using native fetch (no AWS SDK dependency required)
  const bucket = process.env.S3_BUCKET ?? "arc-score-screenshots";
  const region = process.env.S3_REGION ?? "us-east-1";
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKey || !secretKey) {
    console.warn("[screenshot-manager] S3 mode configured but AWS credentials missing, falling back to local");
    const date = new Date().toISOString().split("T")[0];
    return `/screenshots/${slug}/${date}/${filename}`;
  }

  const date = new Date().toISOString().split("T")[0];
  const key = `screenshots/${slug}/${date}/${filename}`;
  const fileBuffer = fs.readFileSync(localPath);

  // Simple S3 PUT using pre-signed style (for production, use @aws-sdk/client-s3)
  const endpoint = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(fileBuffer.length),
        "x-amz-acl": "public-read",
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      console.error(`[screenshot-manager] S3 upload failed: ${response.status}`);
      return `/screenshots/${slug}/${date}/${filename}`;
    }

    return endpoint;
  } catch (err) {
    console.error(`[screenshot-manager] S3 upload error:`, err);
    return `/screenshots/${slug}/${date}/${filename}`;
  }
}

export function cleanupOldScreenshots(maxAgeDays: number = 14): number {
  const screenshotBase = path.join(process.cwd(), "public", "screenshots");
  if (!fs.existsSync(screenshotBase)) return 0;

  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  let removed = 0;

  const slugDirs = fs.readdirSync(screenshotBase);
  for (const slug of slugDirs) {
    const slugPath = path.join(screenshotBase, slug);
    if (!fs.statSync(slugPath).isDirectory()) continue;

    const dateDirs = fs.readdirSync(slugPath);
    for (const dateDir of dateDirs) {
      const datePath = path.join(slugPath, dateDir);
      if (!fs.statSync(datePath).isDirectory()) continue;

      // Parse date from directory name (YYYY-MM-DD)
      const dirDate = new Date(dateDir).getTime();
      if (isNaN(dirDate) || dirDate < cutoff) {
        fs.rmSync(datePath, { recursive: true, force: true });
        removed++;
      }
    }

    // Remove empty slug dirs
    if (fs.readdirSync(slugPath).length === 0) {
      fs.rmdirSync(slugPath);
    }
  }

  return removed;
}
