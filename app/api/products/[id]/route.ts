import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - جلب منتج محدد
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.products.findUnique({
      where: { unique_id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "فشل في جلب بيانات المنتج" },
      { status: 500 }
    );
  }
}

// PUT - تحديث منتج
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // التحقق من وجود المنتج
    const existingProduct = await prisma.products.findUnique({
      where: { unique_id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }

    const updatedProduct = await prisma.products.update({
      where: { unique_id: params.id },
      data: {
        item_name: data.item_name,
        item_code: data.item_code,
        color: data.color,
        size: data.size,
        out_price: parseFloat(data.out_price) || 0,
        images: data.images,
        cur_qty: parseInt(data.cur_qty) || 0,
        group_name: data.group_name,
        kind_name: data.kind_name,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث المنتج بنجاح",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "فشل في تحديث المنتج" }, { status: 500 });
  }
}

// DELETE - حذف منتج
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // التحقق من وجود المنتج
    const existingProduct = await prisma.products.findUnique({
      where: { unique_id: params.id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    }

    await prisma.products.delete({
      where: { unique_id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف المنتج بنجاح",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "فشل في حذف المنتج" }, { status: 500 });
  }
}
