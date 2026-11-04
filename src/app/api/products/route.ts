import { NextResponse } from "next/server";
import { getProducts } from "@/lib/db-service";

export async function GET() {
  const products = await getProducts(true);
  return NextResponse.json({ products });
}
