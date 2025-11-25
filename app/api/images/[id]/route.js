import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // البحث عن المنتج
    const product = await prisma.products.findUnique({
      where: { unique_id: id },
      select: { images: true },
    });

    if (!product || !product.images) {
      return new NextResponse("الصورة غير موجودة", {
        status: 404,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    // إذا كانت الصورة مخزنة كـ Base64
    if (product.images.startsWith("data:image")) {
      const matches = product.images.match(
        /^data:image\/([a-zA-Z]*);base64,(.*)$/
      );

      if (matches && matches.length === 3) {
        const imageType = matches[1];
        const imageData = matches[2];
        const buffer = Buffer.from(imageData, "base64");

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": `image/${imageType}`,
            "Cache-Control": "public, max-age=31536000",
          },
        });
      }
    }

    // إذا كانت الصورة رابط URL عادي
    return NextResponse.redirect(product.images);
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse("خطأ في الخادم", { status: 500 });
  }
}
