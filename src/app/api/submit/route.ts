import { NextResponse } from "next/server";
import { insertSubmission } from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brandName, url, productUrl, category, email } = body;

    if (!brandName || !url) {
      return NextResponse.json(
        { error: "brandName and url are required" },
        { status: 400 }
      );
    }

    const result = insertSubmission({
      brandName,
      url,
      productUrl: productUrl || undefined,
      category: category || undefined,
      email: email || undefined,
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
