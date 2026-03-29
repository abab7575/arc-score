import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/index";
import { eq } from "drizzle-orm";
import { hashPassword, createCustomer, updateCustomerPlan, getCustomerByEmail } from "@/lib/customer-auth";

// Temporary endpoint to create Andy's Pro account on production.
// Protected by ADMIN_PASSWORD env var.
// DELETE THIS FILE after use.

export async function POST(request: NextRequest) {
  const { password: adminPass } = await request.json();
  if (adminPass !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = "andy@arcreport.ai";
  const userPassword = "andyadmin";

  try {
    // Check if exists
    let customer = getCustomerByEmail(email);

    if (!customer) {
      const passwordHash = await hashPassword(userPassword);
      customer = createCustomer({ email, passwordHash, name: "Andy" });
    }

    // Ensure Pro plan
    updateCustomerPlan(customer.id, "pro");

    return NextResponse.json({
      success: true,
      email,
      plan: "pro",
      customerId: customer.id,
      message: "Account ready. Delete this endpoint now.",
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
