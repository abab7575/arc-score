import { generateImageForItem } from "../src/lib/content-studio/images/generate-images";
import { db, schema } from "../src/lib/db/index";
import { eq, isNull } from "drizzle-orm";

async function main() {
  const item = db.select({
    id: schema.contentQueue.id,
    imageTemplate: schema.contentQueue.imageTemplate,
    metadata: schema.contentQueue.metadata,
    title: schema.contentQueue.title,
  }).from(schema.contentQueue)
    .where(isNull(schema.contentQueue.imageData))
    .limit(1)
    .all()[0];

  if (!item) {
    console.log("No items need images");
    return;
  }

  console.log(`Testing item ${item.id}: ${item.imageTemplate} — "${item.title}"`);

  const result = await generateImageForItem(item);
  console.log("Result:", result);

  if (result) {
    const check = db.select({
      imageUrl: schema.contentQueue.imageUrl,
    }).from(schema.contentQueue).where(eq(schema.contentQueue.id, item.id)).get();
    console.log("Image URL saved:", check?.imageUrl);
    console.log("SUCCESS — image generated and stored in database");
  } else {
    console.log("FAILED — no image generated");
  }
}

main().catch(e => console.error("Error:", e.message, e.stack));
