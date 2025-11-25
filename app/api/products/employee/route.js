import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const category = searchParams.get("category");

    // ✅ جلب المنتجات للموظفين بشرط cur_qty > 0 و stor_id = 0
    const productsRaw = await prisma.products.findMany({
      where: {
        unique_id: { contains: "-0" },
        cur_qty: { gt: 0 }, // ✅ فقط الكميات أكبر من صفر
        stor_id: 0, // ✅ فقط من المخزن الرئيسي
        ...(category && { group_name: { contains: category } }),
      },
      select: {
        unique_id: true,
        master_code: true,
        item_code: true,
        item_name: true,
        color: true,
        size: true,
        out_price: true,
        images: true,
        cur_qty: true,
        stor_id: true,
        group_name: true,
        kind_name: true,
      },
      take: 100,
    });

    console.log(
      "📊 بيانات الموظفين - المنتجات المتاحة فقط:",
      productsRaw.map((p) => ({
        item_code: p.item_code,
        color: p.color,
        size: p.size,
        item_name: p.item_name,
        cur_qty: p.cur_qty,
        stor_id: p.stor_id,
      }))
    );

    // جلب الفئات
    const categories = await prisma.categories.findMany();

    // ✅ تجميع المنتجات حسب master_code مع تجميع الكميات لكل لون ومقاس
    const groupedByMasterCode = {};

    productsRaw.forEach((row) => {
      const masterCode = row.master_code;
      if (!masterCode) return;

      const color = row.color || "Default";
      const size = row.size || "ONE SIZE";
      const quantity = Number(row.cur_qty) || 0; // ✅ تحويل إلى رقم

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
          item_code: row.item_code,
          variants: [],
        };
      }

      // ✅ البحث عن variant بنفس اللون
      let variant = groupedByMasterCode[masterCode].variants.find(
        (v) => v.color === color
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
          sizeItemCodes: {},
          sizeQuantities: {}, // ✅ كميات كل مقاس
          totalColorQuantity: 0, // ✅ سيتم تجميع الكميات هنا
          stor_id: row.stor_id || 0,
        };
        groupedByMasterCode[masterCode].variants.push(variant);
      }

      // ✅ إضافة المقاس إذا لم يكن موجوداً
      if (size && !variant.sizes.includes(size)) {
        variant.sizes.push(size);
      }

      // ✅ حفظ item_code والكمية للمقاس المحدد
      if (size) {
        variant.sizeItemCodes[size] = row.item_code;
        
        // ✅ جمع الكميات بدلاً من استبدالها للمقاسات المتكررة
        const currentSizeQty = variant.sizeQuantities[size] || 0;
        variant.sizeQuantities[size] = currentSizeQty + quantity;
      }

      // ✅ تجميع الكميات لكل لون (مجموع جميع المقاسات)
      variant.totalColorQuantity += quantity;
    });

    // ✅ تحديث cur_qty لكل variant ليكون المجموع الكلي
    Object.values(groupedByMasterCode).forEach((product) => {
      product.variants.forEach((variant) => {
        variant.cur_qty = variant.totalColorQuantity;
      });
    });

    const finalProducts = Object.values(groupedByMasterCode).filter(
      (product) => product.variants.length > 0
    );

    console.log(
      "✅ المنتجات النهائية للموظفين (بعد التجميع الصحيح):",
      finalProducts.map((p) => ({
        modelId: p.modelId,
        item_name: p.item_name,
        variants: p.variants.map((v) => ({
          color: v.color,
          totalColorQuantity: v.totalColorQuantity, // ✅ المجموع الصحيح
          sizes: v.sizes,
          sizeQuantities: v.sizeQuantities, // ✅ كميات كل مقاس
        })),
      }))
    );

    return NextResponse.json({
      products: finalProducts,
      categories: categories,
    });
  } catch (error) {
    console.error("Error in employee products API:", error);

    return NextResponse.json(
      { error: "فشل في جلب البيانات من قاعدة البيانات" },
      { status: 500 }
    );
  }
}