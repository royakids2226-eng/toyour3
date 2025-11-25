"use client";

import { useState, useEffect, use } from "react";
import Header from "../../components/Header";
import ProductCard from "../../components/ProductCard";
import { useProducts } from "../../../context/ProductsContext";

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
  kind: string;
  sub?: string;
}

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // استخدام use() لتفكيك الـ Promise
  const { id } = use(params);

  const { products, categories, searchTerm, loading, error } = useProducts();

  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(
    null
  );

  // البحث عن التصنيف الحالي والـ Sub Categories
  useEffect(() => {
    if (categories.length > 0 && id) {
      const category = categories.find((cat) => cat.id.toString() === id);
      setCurrentCategory(category || null);

      // البحث عن الـ Sub Categories المرتبطة
      if (category) {
        const subs = categories.filter(
          (cat) => (cat as any).sub === category.name && cat.image // فقط اللي لها صور
        );
        setSubCategories(subs);
      }
    }
  }, [categories, id]);

  // فلترة المنتجات حسب التصنيف والبحث والـ Sub Category
  useEffect(() => {
    console.log(
      "🔄 فلترة المنتجات - البحث:",
      searchTerm,
      "التصنيف:",
      id,
      "Sub:",
      selectedSubCategory
    );

    if (products.length > 0 && categories.length > 0) {
      const category = categories.find((cat) => cat.id.toString() === id);
      console.log("📊 التصنيف الموجود:", category);

      if (category) {
        let filtered = products.filter((product) => {
          // أولاً: فلترة حسب التصنيف
          const categoryName = category.name.toLowerCase();
          const categoryFields = [
            product.category,
            product.group_name,
            product.kind_name,
            product.item_name,
          ]
            .filter(Boolean)
            .map((field) => field?.toLowerCase());

          const matchesCategory = categoryFields.some((field) =>
            field?.includes(categoryName)
          );
          if (!matchesCategory) {
            console.log("❌ المنتج مش من التصنيف:", product.description);
            return false;
          }

          // ثانياً: فلترة حسب الـ Sub Category إذا كان محدد
          if (selectedSubCategory) {
            const subCategoryFields = [
              product.description,
              product.category,
              product.group_name,
              product.kind_name,
              product.item_name,
            ]
              .filter(Boolean)
              .map((field) => field?.toLowerCase());

            const matchesSubCategory = subCategoryFields.some((field) =>
              field?.includes(selectedSubCategory.toLowerCase())
            );
            if (!matchesSubCategory) {
              console.log(
                "❌ المنتج مش من الـ Sub Category:",
                product.description
              );
              return false;
            }
          }

          // ثالثاً: فلترة حسب البحث إذا كان موجود
          if (searchTerm.trim() !== "") {
            const searchFields = [
              product.description,
              product.category,
              product.group_name,
              product.kind_name,
              product.item_name,
              product.master_code,
              ...product.variants.map((v) => v.color),
            ]
              .filter(Boolean)
              .map((field) => field?.toLowerCase());

            const matchesSearch = searchFields.some((field) =>
              field?.includes(searchTerm.toLowerCase())
            );
            if (!matchesSearch) {
              console.log("❌ المنتج مش مطابق للبحث:", product.description);
              return false;
            }
            console.log("✅ المنتج مطابق للبحث:", product.description);
          }

          return true;
        });

        console.log("🎯 عدد المنتجات بعد الفلترة:", filtered.length);
        setCategoryProducts(filtered);
      } else {
        console.log("❌ التصنيف مش موجود");
        setCategoryProducts([]);
      }
    }
  }, [products, categories, id, searchTerm, selectedSubCategory]);

  const handleSubCategoryClick = (subCategoryName: string) => {
    setSelectedSubCategory(
      selectedSubCategory === subCategoryName ? null : subCategoryName
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل المنتجات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const category = categories.find((cat) => cat.id.toString() === id);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
        {/* زر العودة */}
        <button
          onClick={() => window.history.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm sm:text-base"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          العودة
        </button>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
          {category?.name || `التصنيف ${id}`}
        </h1>

        {/* ✅ صور دائرية للـ Sub Categories - تصميم متجاوب */}
        {subCategories.length > 0 && (
          <section className="bg-white rounded-xl sm:rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 text-center">
              التصنيفات الفرعية
            </h2>

            {/* ✅ تصميم متجاوب للشاشات الصغيرة */}
            <div className="flex overflow-x-auto pb-3 gap-3 sm:flex-wrap sm:justify-center sm:gap-6 hide-scrollbar">
              {subCategories.map((subCategory) => (
                <button
                  key={subCategory.id}
                  onClick={() => handleSubCategoryClick(subCategory.name)}
                  className={`flex flex-col items-center transition-all duration-300 flex-shrink-0 ${
                    selectedSubCategory === subCategory.name
                      ? "transform -translate-y-1 sm:-translate-y-2"
                      : "hover:transform hover:-translate-y-1"
                  }`}
                >
                  {/* ✅ الصورة الدائرية بحجم متجاوب */}
                  <div
                    className={`w-14 h-14 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-full overflow-hidden border-3 sm:border-4 transition-all duration-300 ${
                      selectedSubCategory === subCategory.name
                        ? "border-blue-500 shadow-lg"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <img
                      src={
                        subCategory.image ||
                        "https://via.placeholder.com/100x100/EFEFEF/666666?text=No+Image"
                      }
                      alt={subCategory.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* ✅ النص بحجم متجاوب */}
                  <span
                    className={`mt-1 sm:mt-2 text-xs sm:text-sm font-medium transition-colors text-center max-w-16 sm:max-w-20 lg:max-w-none ${
                      selectedSubCategory === subCategory.name
                        ? "text-blue-600 font-bold"
                        : "text-gray-700 hover:text-blue-500"
                    }`}
                  >
                    {subCategory.name}
                  </span>
                </button>
              ))}
            </div>

            {/* ✅ زر إلغاء التصفية متجاوب */}
            {selectedSubCategory && (
              <div className="text-center mt-3 sm:mt-4">
                <button
                  onClick={() => setSelectedSubCategory(null)}
                  className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 sm:px-4 py-1 sm:py-2 rounded-full transition-colors"
                >
                  عرض كل منتجات {category?.name}
                </button>
              </div>
            )}
          </section>
        )}

        {/* ✅ شريط المعلومات - تصميم متجاوب */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs sm:text-sm text-blue-700 text-center sm:text-right">
            <strong>معلومات البحث:</strong> عرض {categoryProducts.length} منتج
            {searchTerm && (
              <span className="text-green-600"> لـ "{searchTerm}"</span>
            )}
            {category && (
              <span className="text-blue-600"> في "{category.name}"</span>
            )}
            {selectedSubCategory && (
              <span className="text-purple-600"> - {selectedSubCategory}</span>
            )}
          </p>
        </div>

        {/* ✅ شبكة المنتجات - تصميم متجاوب */}
        {categoryProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {categoryProducts.map((product) => (
              <ProductCard key={product.modelId} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 text-4xl sm:text-6xl mb-3 sm:mb-4">
              📦
            </div>
            <h3 className="text-base sm:text-lg lg:text-xl font-medium text-gray-900 mb-2">
              لا توجد منتجات
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              {category
                ? `لا توجد منتجات في تصنيف "${category.name}"`
                : "التصنيف غير موجود"}
              {selectedSubCategory && ` في "${selectedSubCategory}"`}
              {searchTerm && ` تطابق "${searchTerm}"`}
            </p>
          </div>
        )}
      </main>

      {/* ✅ إضافة CSS للـ scrollbar */}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
