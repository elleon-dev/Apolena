import { NextResponse } from "next/server";
import { getProducts } from "@/lib/db-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const products = await getProducts(true);
  return NextResponse.json(
    { products },
    {
      headers: {
        "Cache-Control": "public, s-maxage=5, stale-while-revalidate=30",
      },
    },
  );
}
