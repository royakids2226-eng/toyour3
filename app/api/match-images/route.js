import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { readdirSync, existsSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

export async function POST() {
  try {
    const uploadDir = "/home/mounir/images";

    if (!existsSync(uploadDir)) {
      return NextResponse.json(
        { error: "مجلد الصور غير موجود" },
        { status: 404 }
      );
    }

    const imageFiles = readdirSync(uploadDir);
    const imageExtensions = [".webp", ".jpg", ".jpeg", ".png", ".gif"];
    const validImages = imageFiles.filter((file) =>
      imageExtensions.some((ext) => file.toLowerCase().endsWith(ext))
    );

    let matchedCount = 0;
    const results = [];

    for (const imageFile of validImages) {
      const fileNameWithoutExt = path.parse(imageFile).name;
      const product = await prisma.products.findFirst({
        where: { item_code: fileNameWithoutExt },
      });

      if (product) {
        const imageUrl = `https://www.royakids.shop/images/${imageFile}`;
        await prisma.products.update({
          where: { unique_id: product.unique_id },
          data: { images: imageUrl },
        });
        matchedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `تمت مطابقة ${matchedCount} صورة`,
      matched: matchedCount,
      totalImages: validImages.length,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allProducts = await prisma.products.findMany({
      select: {
        unique_id: true,
        item_code: true,
        item_name: true,
        images: true,
      },
    });

    const productsWithImages = allProducts.filter((p) => p.images);
    const productsWithoutImages = allProducts.filter((p) => !p.images);

    return NextResponse.json({
      statistics: {
        totalProducts: allProducts.length,
        productsWithImages: productsWithImages.length,
        productsWithoutImages: productsWithoutImages.length,
      },
      productsWithoutImages: productsWithoutImages,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
