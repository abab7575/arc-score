import { NextRequest, NextResponse } from "next/server";
import { addEmailSubscriber } from "@/lib/customer-auth";

export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    addEmailSubscriber(email, source || "homepage");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
