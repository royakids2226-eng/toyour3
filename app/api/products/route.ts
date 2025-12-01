import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    console.log("🔍 جلب المنتجات للعميل:", { category, page, limit });

    // ✅ البحث عن التصنيف بالاسم إذا كان category اسم وليس ID
    let categoryName = category;

    if (category && !isNaN(parseInt(category))) {
      // إذا كان category هو ID، البحث عن اسم التصنيف
      const cat = await prisma.categories.findUnique({
        where: { id: parseInt(category) },
      });
      if (cat) {
        categoryName = cat.name;
      }
    }

    console.log(`🔍 البحث عن المنتجات في تصنيف: "${categoryName}"`);

    // ✅ 1. أولاً: جلب جميع المنتجات الخام مع فلترة حسب التصنيف
    const allProductsRaw = await prisma.products.findMany({
      where: {
        cur_qty: { gt: 0 },
        // ✅ فلترة حسب group_name أو kind_name أو item_name
        ...(categoryName && {
          OR: [
            { group_name: { contains: categoryName, mode: "insensitive" } },
            { kind_name: { contains: categoryName, mode: "insensitive" } },
            { item_name: { contains: categoryName, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: {
        item_name: "asc",
      },
    });

    console.log(`📊 جميع المنتجات الخام من DB: ${allProductsRaw.length} منتج`);

    // ✅ 2. تجميع المنتجات حسب master_code
    const groupedByMasterCode: { [key: string]: any } = {};

    allProductsRaw.forEach((row) => {
      const masterCode = row.master_code;
      if (!masterCode) return;

      const color = row.color || "Default";
      const size = row.size || null;

      if (!groupedByMasterCode[masterCode]) {
        groupedByMasterCode[masterCode] = {
          modelId: masterCode,
          master_code: masterCode,
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

    // ✅ 3. تحويل إلى مصفوفة وفلترة المنتجات التي لديها variants
    const allGroupedProducts = Object.values(groupedByMasterCode).filter(
      (product) => product.variants.length > 0
    );

    console.log(`🎯 المنتجات بعد التجميع: ${allGroupedProducts.length} موديل`);

    // ✅ 4. حساب الترقيم على الموديلات المجمعة
    const totalProducts = allGroupedProducts.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const skip = (page - 1) * limit;

    // ✅ 5. أخذ الجزء المطلوب فقط للصفحة الحالية
    const paginatedProducts = allGroupedProducts.slice(skip, skip + limit);

    console.log(
      `📄 الترقيم: صفحة ${page} من ${totalPages}, عرض ${paginatedProducts.length} موديل`
    );

    // ✅ 6. جلب الفئات
    const categories = await prisma.categories.findMany();

    // ✅ 7. إحصائيات الترقيم
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      products: paginatedProducts,
      categories: categories,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts,
        limit: limit,
        hasNextPage: hasNextPage,
        hasPrevPage: hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error in products API:", error);

    return NextResponse.json({
      products: [],
      categories: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        limit: 20,
        hasNextPage: false,
        hasPrevPage: false,
      },
      error: "حدث خطأ في تحميل البيانات",
    });
  }
}
