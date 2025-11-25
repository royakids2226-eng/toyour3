import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // جلب المنتجات من قاعدة البيانات
    const productsRaw = await prisma.products.findMany({
      where: {
        unique_id: { contains: "-0" },
        cur_qty: { gt: 0 },
        ...(category && { group_name: { contains: category } }),
      },
      take: 50,
    });

    // جلب الفئات
    const categories = await prisma.categories.findMany();

    // تجميع المنتجات حسب master_code
    const groupedByMasterCode: { [key: string]: any } = {};

    productsRaw.forEach((row) => {
      const masterCode = row.master_code;
      if (!masterCode) return;

      const color = row.color || "Default";
      const size = row.size || null;

      if (!groupedByMasterCode[masterCode]) {
        groupedByMasterCode[masterCode] = {
          modelId: masterCode,
          master_code: masterCode, // إضافة master_code كحقل منفصل
          price: row.out_price || 0,
          category: row.group_name || "",
          description: row.item_name || row.kind_name || "منتج بدون وصف",
          group_name: row.group_name || "",
          kind_name: row.kind_name || "",
          item_name: row.item_name || "",
          variants: [],
        };
      }

      let variant = groupedByMasterCode[masterCode].variants.find(
        (v: any) => v.color === color
      );

      if (!variant) {
        const imageUrl =
          row.images && row.images.trim() !== ""
            ? row.images
            : "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500";

        variant = {
          id: row.unique_id,
          itemCode: row.item_code,
          color: color,
          imageUrl: imageUrl,
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
    console.error("Error in products API:", error);

    const fallbackProducts = [
      {
        modelId: "fallback-1",
        master_code: "FB001",
        price: 199,
        category: "إلكترونيات",
        description: "منتج تجريبي - سماعات رأس",
        group_name: "إلكترونيات",
        kind_name: "سماعات",
        variants: [
          {
            id: "var-fb-1",
            color: "أسود",
            imageUrl:
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
            sizes: ["ONE SIZE"],
          },
        ],
      },
    ];

    return NextResponse.json({
      products: fallbackProducts,
      categories: [{ id: 1, name: "إلكترونيات" }],
      error: "جاري تحميل البيانات الحقيقية قريباً",
    });
  }
}
