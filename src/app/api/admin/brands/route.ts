import { NextResponse } from "next/server";
import { getAllBrandsAdmin, addBrand } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = getAllBrandsAdmin();
    return NextResponse.json(brands);
  } catch (error) {
    console.error("Brands error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, url, category, productUrl } = await request.json();

    if (!name || !url || !category) {
      return NextResponse.json(
        { error: "name, url, and category are required" },
        { status: 400 }
      );
    }

    const brand = addBrand({ name, url, category, productUrl });
    return NextResponse.json(brand, { status: 201 });
  } catch (error) {
    console.error("Add brand error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
