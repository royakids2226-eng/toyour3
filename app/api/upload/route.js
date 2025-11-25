import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "لم يتم اختيار أي ملف" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "نوع الملف غير مدعوم" },
        { status: 400 }
      );
    }

    const originalName = file.name;
    const fileNameWithoutExt = path.parse(originalName).name;

    console.log("🚀 رفع:", originalName, "للمنتج:", fileNameWithoutExt);

    // ✅ المسار المباشر على السيرفر
    const uploadDir = "/home/mounir/images";
    const filePath = path.join(uploadDir, originalName);

    // البحث عن المنتج
    const product = await prisma.products.findFirst({
      where: { item_code: fileNameWithoutExt },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: `المنتج ${fileNameWithoutExt} غير موجود`,
        },
        { status: 404 }
      );
    }

    // ✅ حفظ الملف مباشرة على السيرفر بدون existsSync
    try {
      await mkdir(uploadDir, { recursive: true });
      const buffer = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(buffer));

      console.log("✅ تم محاولة حفظ الملف في:", filePath);

      // ✅ التحقق البديل: محاولة قراءة الملف
      try {
        const testRead = await import("fs").then((fs) =>
          fs.promises.readFile(filePath)
        );
        console.log("✅ تأكيد الحفظ - حجم الملف:", testRead.length, "بايت");
      } catch (readError) {
        console.log("⚠️ لا يمكن قراءة الملف بعد الحفظ:", readError.message);
        // نستمر حتى مع عدم القدرة على القراءة
      }
    } catch (error) {
      console.error("❌ فشل في حفظ الملف:", error);
      return NextResponse.json(
        {
          error: "فشل في حفظ الملف: " + error.message,
          debug: { uploadDir, filePath },
        },
        { status: 500 }
      );
    }

    // ✅ ربط الصورة مع المنتج
    const imageUrl = `https://www.royakids.shop/images/${originalName}`;

    await prisma.products.update({
      where: { unique_id: product.unique_id },
      data: { images: imageUrl },
    });

    console.log("🔗 تم ربط الصورة:", imageUrl);

    return NextResponse.json({
      success: true,
      message: "✅ تم رفع الصورة وربطها مع المنتج بنجاح",
      product: {
        code: product.item_code,
        name: product.item_name,
      },
      image: {
        fileName: originalName,
        url: imageUrl,
        directLink: imageUrl,
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: "فشل في رفع الملف: " + error.message,
      },
      { status: 500 }
    );
  }
}
