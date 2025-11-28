"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";

export default function BulkProductsUpload({ onClose, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState([]);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  // الأعمدة المطلوبة في ملف Excel
  const requiredColumns = [
    'master_code', 'item_code', 'item_name', 'color', 'size',
    'out_price', 'cur_qty', 'group_name', 'kind_name', 'images'
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // التحقق من الأعمدة
        const validationErrors = validateColumns(jsonData);
        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          setPreviewData([]);
          return;
        }

        setErrors([]);
        setPreviewData(jsonData.slice(0, 10)); // عرض أول 10 صفوف فقط للمعاينة
      } catch (error) {
        setErrors(['خطأ في قراءة ملف Excel: ' + error.message]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateColumns = (data) => {
    const errors = [];
    
    if (data.length === 0) {
      errors.push('الملف لا يحتوي على بيانات');
      return errors;
    }

    // التحقق من وجود الأعمدة المطلوبة
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      errors.push(`الأعمدة المفقودة: ${missingColumns.join(', ')}`);
    }

    // التحقق من صحة البيانات
    data.forEach((row, index) => {
      if (!row.master_code) {
        errors.push(`الصف ${index + 2}: master_code مطلوب`);
      }
      if (!row.item_name) {
        errors.push(`الصف ${index + 2}: item_name مطلوب`);
      }
      if (!row.out_price || isNaN(row.out_price)) {
        errors.push(`الصف ${index + 2}: out_price يجب أن يكون رقماً`);
      }
      if (!row.cur_qty || isNaN(row.cur_qty)) {
        errors.push(`الصف ${index + 2}: cur_qty يجب أن يكون رقماً`);
      }
    });

    return errors;
  };

  const handleUpload = async () => {
    if (previewData.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < previewData.length; i++) {
        const product = previewData[i];
        
        // تحضير البيانات للإرسال
        const productData = {
          master_code: product.master_code,
          item_code: product.item_code || product.master_code,
          item_name: product.item_name,
          color: product.color || "افتراضي",
          size: product.size || "ONE SIZE",
          out_price: parseFloat(product.out_price) || 0,
          cur_qty: parseInt(product.cur_qty) || 0,
          group_name: product.group_name || "عام",
          kind_name: product.kind_name || "عام",
          images: product.images || "",
          // إضافة حقول إضافية مطلوبة في قاعدة البيانات
          unique_id: `${product.master_code}-${product.color || 'default'}-${product.size || '0'}`,
          stor_id: 0
        };

        // إرسال كل منتج على حدة
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          throw new Error(`فشل في إضافة المنتج ${product.master_code}`);
        }

        // تحديث شريط التقدم
        setProgress(Math.round(((i + 1) / previewData.length) * 100));
      }

      alert(`✅ تم إضافة ${previewData.length} منتج بنجاح`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error uploading products:', error);
      alert('❌ فشل في إضافة بعض المنتجات: ' + error.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const downloadTemplate = () => {
    // إنشاء نموذج Excel
    const templateData = [
      {
        master_code: "PROD-001",
        item_code: "ITEM-001",
        item_name: "منتج مثال 1",
        color: "أحمر",
        size: "M",
        out_price: 100,
        cur_qty: 50,
        group_name: "ملابس",
        kind_name: "تيشيرت",
        images: "https://example.com/image1.jpg"
      },
      {
        master_code: "PROD-002", 
        item_code: "ITEM-002",
        item_name: "منتج مثال 2",
        color: "أزرق",
        size: "L",
        out_price: 150,
        cur_qty: 30,
        group_name: "ملابس",
        kind_name: "بنطلون",
        images: "https://example.com/image2.jpg"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "المنتجات");
    XLSX.writeFile(workbook, "نموذج_المنتجات.xlsx");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">إضافة منتجات متعددة</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* قسم تحميل النموذج */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">خطوات الاستخدام</h3>
              <button
                onClick={downloadTemplate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                📥 تحميل النموذج
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">تعليمات مهمة:</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• يجب أن يحتوي الملف على الأعمدة التالية: master_code, item_code, item_name, color, size, out_price, cur_qty, group_name, kind_name, images</li>
                <li>• master_code و item_name حقلان إجباريان</li>
                <li>• out_price و cur_qty يجب أن يكونا أرقاماً</li>
                <li>• unique_id سيتم إنشاؤه تلقائياً</li>
              </ul>
            </div>
          </div>

          {/* قسم رفع الملف */}
          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx, .xls"
                className="hidden"
              />
              
              <div className="mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  اختر ملف Excel
                </h3>
                <p className="text-gray-600">اسحب الملف أو انقر للاختيار</p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                اختر ملف Excel
              </button>
            </div>
          </div>

          {/* عرض الأخطاء */}
          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">الأخطاء:</h4>
              <ul className="text-red-700 text-sm space-y-1 max-h-32 overflow-y-auto">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* معاينة البيانات */}
          {previewData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                معاينة البيانات ({previewData.length} منتج)
              </h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-right border">الكود</th>
                      <th className="px-3 py-2 text-right border">الاسم</th>
                      <th className="px-3 py-2 text-right border">اللون</th>
                      <th className="px-3 py-2 text-right border">المقاس</th>
                      <th className="px-3 py-2 text-right border">السعر</th>
                      <th className="px-3 py-2 text-right border">الكمية</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((product, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 border text-xs">{product.master_code}</td>
                        <td className="px-3 py-2 border text-xs">{product.item_name}</td>
                        <td className="px-3 py-2 border text-xs">{product.color}</td>
                        <td className="px-3 py-2 border text-xs">{product.size}</td>
                        <td className="px-3 py-2 border text-xs">{product.out_price}</td>
                        <td className="px-3 py-2 border text-xs">{product.cur_qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* شريط التقدم */}
          {uploading && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>جاري رفع المنتجات...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* أزرار الإجراء */}
        <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
          
          <button
            onClick={handleUpload}
            disabled={uploading || previewData.length === 0 || errors.length > 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'جاري الرفع...' : `إضافة ${previewData.length} منتج`}
          </button>
        </div>
      </div>
    </div>
  );
}