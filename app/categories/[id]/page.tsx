"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import ProductCard from "../../components/ProductCard";
import Pagination from "../../components/Pagination";

interface Product {
  modelId: string;
  price: number;
  category: string;
  description: string;
  group_name?: string;
  kind_name?: string;
  item_name?: string;
  master_code?: string;
  variants: Array<{
    id: string;
    color: string;
    imageUrl: string;
    sizes: string[];
  }>;
}

interface Category {
  id: number;
  name: string;
  image: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function CategoryDetailPage({
  params,
}: {
  params: { id: string }; // ✅ هذا مهم - اسمه id وليس categoryId
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // ✅ التحقق من حالة المستخدم
  const checkUserType = () => {
    try {
      const employee = localStorage.getItem("employee");
      const employeeToken = localStorage.getItem("employeeToken");
      return !!(employee && employeeToken);
    } catch (error) {
      return false;
    }
  };

  // ✅ جلب بيانات التصنيف بالاسم
  const fetchCategoryName = async () => {
    try {
      console.log(`🔍 جلب اسم التصنيف للـ ID: ${params.id}`);

      // ✅ محاولة جلب التصنيف من الـ API
      const response = await fetch(`/api/categories/${params.id}`);
      if (response.ok) {
        const categoryData = await response.json();
        console.log(`✅ وجدت التصنيف:`, categoryData);
        setCategory(categoryData);
        return categoryData.name;
      }

      // ✅ إذا فشل، جرب الـ API الآخر
      const response2 = await fetch("/api/categories");
      if (response2.ok) {
        const categories = await response2.json();
        const foundCategory = categories.find(
          (cat: Category) => cat.id.toString() === params.id
        );
        if (foundCategory) {
          console.log(`✅ وجدت التصنيف من القائمة:`, foundCategory);
          setCategory(foundCategory);
          return foundCategory.name;
        }
      }

      console.log(`❌ لم أجد التصنيف للـ ID: ${params.id}`);
      return null;
    } catch (error) {
      console.error("Error fetching category:", error);
      return null;
    }
  };

  // ✅ جلب المنتجات
  const fetchProducts = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const isEmployee = checkUserType();

      // ✅ جلب اسم التصنيف أولاً
      const categoryName = await fetchCategoryName();

      console.log(`📢 اسم التصنيف المستخدم للبحث: "${categoryName}"`);

      // ✅ بناء URL مع أو بدون تصنيف
      const endpoint = isEmployee ? "/api/products/employee" : "/api/products";
      let url = `${endpoint}?page=${page}&limit=${limit}`;

      if (categoryName) {
        url += `&category=${encodeURIComponent(categoryName)}`;
        console.log(`🌐 جلب المنتجات للتصنيف: ${url}`);
      } else {
        console.log(`🌐 جلب جميع المنتجات (بدون تصنيف): ${url}`);
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("فشل في جلب البيانات");
      }

      const data = await response.json();

      console.log(`📦 البيانات المستلمة: ${data.products?.length || 0} منتج`);
      console.log(`📊 معلومات الترقيم:`, data.pination);

      setProducts(data.products || []);

      // ✅ حفظ معلومات الترقيم
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("حدث خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  // ✅ جلب البيانات أول مرة
  useEffect(() => {
    fetchProducts();
  }, [params.id]);

  // ✅ دالة تغيير الصفحة
  const handlePageChange = (page: number) => {
    console.log(`🔄 تغيير الصفحة إلى: ${page}`);
    fetchProducts(page, pagination.limit);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ دالة تغيير عدد المنتجات في الصفحة
  const handleLimitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(event.target.value);
    console.log(`🔄 تغيير عدد المنتجات في الصفحة إلى: ${newLimit}`);
    fetchProducts(1, newLimit);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">جاري تحميل المنتجات...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => fetchProducts()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                حاول مرة أخرى
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* رأس الصفحة */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {category?.name || `التصنيف ${params.id}`}
          </h1>

          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">
              {products.length > 0
                ? `عرض ${Math.min(
                    (pagination.currentPage - 1) * pagination.limit + 1,
                    pagination.totalProducts
                  )} - ${Math.min(
                    pagination.currentPage * pagination.limit,
                    pagination.totalProducts
                  )} من ${pagination.totalProducts} منتج`
                : "لا توجد منتجات في هذا التصنيف"}
            </p>

            <div className="flex items-center gap-2">
              <span
                className={`text-sm px-3 py-1 rounded-full ${
                  checkUserType()
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {checkUserType() ? "👔 موظف" : "👤 عميل"}
              </span>
            </div>
          </div>
        </div>

        {/* عرض المنتجات */}
        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.modelId} product={product} />
              ))}
            </div>

            {/* الترقيم */}
            <div className="mt-8">
              {pagination.totalPages > 1 ? (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalProducts={pagination.totalProducts}
                  limit={pagination.limit}
                  hasNextPage={pagination.hasNextPage}
                  hasPrevPage={pagination.hasPrevPage}
                  onPageChange={handlePageChange}
                />
              ) : (
                <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                  <p className="text-gray-600">
                    صفحة {pagination.currentPage} من {pagination.totalPages} •
                    {pagination.totalProducts} منتج
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد منتجات
            </h3>
            <p className="text-gray-600 mb-4">
              {category
                ? `لا توجد منتجات في تصنيف "${category.name}"`
                : "التصنيف غير موجود"}
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              العودة
            </button>
          </div>
        )}

        {/* معلومات للتصحيح */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
          <div className="mb-2">
            <p>
              <strong>معلومات التصحيح:</strong>
            </p>
            <p>المسار: /categories/{params.id}</p>
            <p>
              التصنيف: {category?.name || "غير معروف"} (ID: {params.id})
            </p>
            <p>
              الترقيم: {pagination.currentPage}/{pagination.totalPages} صفحات
            </p>
            <p>
              المنتجات: {products.length} من أصل {pagination.totalProducts}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                console.log("📋 معلومات كاملة:", {
                  params,
                  category,
                  products,
                  pagination,
                });
                alert(
                  `معلومات:\nالتصنيف: ${
                    category?.name || params.id
                  }\nالصفحات: ${pagination.currentPage}/${
                    pagination.totalPages
                  }\nالمنتجات: ${pagination.totalProducts}`
                );
              }}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs"
            >
              عرض التفاصيل
            </button>

            <button
              onClick={() => fetchProducts()}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs"
            >
              تحديث
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
