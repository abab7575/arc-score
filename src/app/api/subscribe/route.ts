import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, brandUrl } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email is required" },
        { status: 400 }
      );
    }

    // Store the subscription request in the database
    db.run(sql`
      CREATE TABLE IF NOT EXISTS email_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        brand_url TEXT,
        subscribed_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    db.run(sql`
      INSERT OR IGNORE INTO email_subscribers (email, brand_url)
      VALUES (${email}, ${brandUrl || null})
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
