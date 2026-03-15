import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/index";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/outreach — List outreach queue items
 * Query params: status, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "100");

    let query = db
      .select({
        id: schema.outreach.id,
        brandId: schema.outreach.brandId,
        contactEmail: schema.outreach.contactEmail,
        contactName: schema.outreach.contactName,
        contactTitle: schema.outreach.contactTitle,
        emailSource: schema.outreach.emailSource,
        subject: schema.outreach.subject,
        body: schema.outreach.body,
        brandScore: schema.outreach.brandScore,
        brandGrade: schema.outreach.brandGrade,
        issueCount: schema.outreach.issueCount,
        topIssues: schema.outreach.topIssues,
        reportUrl: schema.outreach.reportUrl,
        status: schema.outreach.status,
        notes: schema.outreach.notes,
        sentAt: schema.outreach.sentAt,
        repliedAt: schema.outreach.repliedAt,
        createdAt: schema.outreach.createdAt,
      })
      .from(schema.outreach)
      .orderBy(desc(schema.outreach.createdAt))
      .limit(limit)
      .all();

    if (status) {
      query = query.filter((item: { status: string }) => item.status === status);
    }

    // Attach brand names
    const items = query.map((item: { brandId: number }) => {
      const brand = db
        .select({ name: schema.brands.name, slug: schema.brands.slug, url: schema.brands.url })
        .from(schema.brands)
        .where(eq(schema.brands.id, item.brandId))
        .get();
      return { ...item, brandName: brand?.name ?? "Unknown", brandSlug: brand?.slug ?? "", brandUrl: brand?.url ?? "" };
    });

    // Stats
    const all = db.select({ status: schema.outreach.status }).from(schema.outreach).all();
    const stats = {
      total: all.length,
      queued: all.filter((r: { status: string }) => r.status === "queued").length,
      ready: all.filter((r: { status: string }) => r.status === "ready" || r.status === "email_found").length,
      sent: all.filter((r: { status: string }) => r.status === "sent").length,
      replied: all.filter((r: { status: string }) => r.status === "replied").length,
      converted: all.filter((r: { status: string }) => r.status === "converted").length,
      skipped: all.filter((r: { status: string }) => r.status === "skipped").length,
    };

    return NextResponse.json({ items, stats });
  } catch (error) {
    console.error("Error fetching outreach:", error);
    return NextResponse.json({ error: "Failed to fetch outreach" }, { status: 500 });
  }
}

/**
 * POST /api/admin/outreach — Generate new outreach queue items
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const maxScore = body.maxScore ?? 70;
    const category = body.category;
    const limit = body.limit ?? 50;

    const { generateOutreachQueue, insertOutreachItems } = await import("@/lib/outreach/generate");
    const items = generateOutreachQueue({ maxScore, category, limit });
    const inserted = insertOutreachItems(items);

    return NextResponse.json({
      generated: items.length,
      inserted,
      message: `Generated ${items.length} outreach items, inserted ${inserted} new`,
    });
  } catch (error) {
    console.error("Error generating outreach:", error);
    return NextResponse.json({ error: "Failed to generate outreach" }, { status: 500 });
  }
}
