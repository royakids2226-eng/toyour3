"use client";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalProducts,
  limit,
  hasNextPage,
  hasPrevPage,
  onPageChange,
}: PaginationProps) {
  // ✅ التأكد من عرض مكون الترقيم
  console.log("🔧 Pagination Component Props:", {
    currentPage,
    totalPages,
    totalProducts,
    hasNextPage,
    hasPrevPage,
  });

  if (totalPages <= 1) {
    return (
      <div className="text-center text-gray-500 py-4">
        صفحة {currentPage} من {totalPages} • {totalProducts} منتج
      </div>
    );
  }

  // ✅ إنشاء مصفوفة من أرقام الصفحات
  const pageNumbers = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      {/* معلومات الترقيم */}
      <div className="text-gray-700">
        <span className="font-medium">عرض</span>{" "}
        {Math.min((currentPage - 1) * limit + 1, totalProducts)} -{" "}
        {Math.min(currentPage * limit, totalProducts)}{" "}
        <span className="font-medium">من</span> {totalProducts} منتج
      </div>

      {/* أزرار الصفحات */}
      <div className="flex items-center gap-2">
        {/* زر الصفحة السابقة */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            hasPrevPage
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          ← السابق
        </button>

        {/* أرقام الصفحات */}
        <div className="flex items-center gap-1">
          {startPage > 1 && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
            </>
          )}

          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                currentPage === pageNum
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {pageNum}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="px-2 text-gray-400">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* زر الصفحة التالية */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            hasNextPage
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          التالي →
        </button>
      </div>

      {/* معلومات الصفحات */}
      <div className="text-gray-600">
        <span className="font-medium">الصفحة</span> {currentPage}{" "}
        <span className="font-medium">من</span> {totalPages}
      </div>
    </div>
  );
}
