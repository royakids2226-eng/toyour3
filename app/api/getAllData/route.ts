import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const productsRaw = await prisma.products.findMany({
      where: {
        unique_id: { contains: "-0" },
        cur_qty: { gt: 0 },
      },
    });

    const categories = await prisma.categories.findMany();

    const groupedByMasterCode: { [key: string]: any } = {};
    productsRaw.forEach((row) => {
      const masterCode = row.master_code;
      if (!masterCode) return;
      const color = row.color || "Default";
      const size = row.size || null;

      if (!groupedByMasterCode[masterCode]) {
        groupedByMasterCode[masterCode] = {
          modelId: masterCode,
          price: row.out_price,
          category: row.group_name || "",
          description: row.kind_name || "",
          variants: [],
        };
      }

      let variant = groupedByMasterCode[masterCode].variants.find(
        (v: any) => v.color === color
      );

      if (!variant) {
        if (!row.images || row.images.trim() === "") return;
        variant = {
          id: row.unique_id,
          itemCode: row.item_code,
          color: color,
          imageUrl: row.images,
          sizes: [],
        };
        groupedByMasterCode[masterCode].variants.push(variant);
      }

      if (size && !variant.sizes.includes(size)) {
        variant.sizes.push(size);
      }
    });

    const finalProducts = Object.values(groupedByMasterCode).filter(
      (product) => product.variants.length > 0
    );

    return NextResponse.json({
      products: finalProducts,
      categories: categories,
    });
  } catch (error) {
    console.error("Error in getAllData API:", error);
    return NextResponse.json(
      { error: "Failed to fetch store data." },
      { status: 500 }
    );
  }
}
