"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
  image: string;
  item_code?: string;
  master_code?: string; // ✅ جديد: إضافة master_code
  maxQuantity?: number;
}

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
    itemCode?: string; // ✅ item_code للون
    sizeItemCodes?: { [size: string]: string }; // ✅ item_codes للمقاسات
  }>;
  cur_qty?: number;
  stor_id?: number;
  item_code?: string;
  unique_id?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (
    product: Product,
    color: string,
    size: string,
    quantity?: number
  ) => void;
  removeFromCart: (id: string, color: string, size: string) => void;
  updateQuantity: (id: string, quantity: number) => void; // ✅ تعديل: إزالة color و size
  clearCart: () => void;
  getCartItemsCount: () => number;
  getCartTotal: () => number;
  isProductInCart: (productId: string, color: string, size: string) => boolean;
  getProductQuantity: (
    productId: string,
    color: string,
    size: string
  ) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // ✅ تحميل السلة من localStorage عند التحميل
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
      }
    }
  }, []);

  // ✅ حفظ السلة في localStorage عند كل تغيير
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // ✅ إضافة منتج إلى السلة - محدث
  const addToCart = (
    product: Product,
    color: string,
    size: string,
    quantity: number = 1
  ) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.id === product.modelId &&
          item.color === color &&
          item.size === size
      );

      if (existingItemIndex > -1) {
        // ✅ المنتج موجود بالفعل - تحديث الكمية
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];

        // ✅ للموظفين: لا تتجاوز الكمية المتاحة
        const newQuantity = existingItem.maxQuantity
          ? Math.min(existingItem.quantity + quantity, existingItem.maxQuantity)
          : existingItem.quantity + quantity;

        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
        };

        return updatedItems;
      } else {
        // ✅ الحصول على item_code الصحيح بناءً على اللون والمقاس
        const selectedVariant = product.variants?.find(v => v.color === color);
        let correctItemCode = product.item_code; // ✅ الافتراضي
        
        // ✅ إذا كان هناك item_code للمقاس المحدد
        if (selectedVariant?.sizeItemCodes && selectedVariant.sizeItemCodes[size]) {
          correctItemCode = selectedVariant.sizeItemCodes[size];
        } 
        // ✅ إذا كان هناك item_code للون
        else if (selectedVariant?.itemCode) {
          correctItemCode = selectedVariant.itemCode;
        }

        // ✅ منتج جديد - إضافته إلى السلة
        const newItem: CartItem = {
          id: product.modelId,
          name: product.item_name || product.description,
          price: product.price,
          color: color,
          size: size,
          quantity: quantity,
          image: selectedVariant?.imageUrl || product.variants[0]?.imageUrl || "/placeholder-product.jpg",
          item_code: correctItemCode, // ✅ استخدام الكود الصحيح
          master_code: product.master_code, // ✅ حفظ master_code
          // ✅ حفظ أقصى كمية للموظفين
          maxQuantity:
            product.cur_qty && product.stor_id === 0
              ? product.cur_qty
              : undefined,
        };

        console.log("🛒 إضافة منتج للسلة:", {
          name: newItem.name,
          color: newItem.color,
          size: newItem.size,
          item_code: newItem.item_code,
          master_code: newItem.master_code
        });

        return [...prevItems, newItem];
      }
    });
  };

  // ✅ إزالة منتج من السلة - محدث
  const removeFromCart = (id: string, color: string, size: string) => {
    console.log("🗑️ محاولة إزالة منتج:", { id, color, size });
    
    setCartItems((prevItems) => {
      const filteredItems = prevItems.filter(
        (item) =>
          !(item.id === id && item.color === color && item.size === size)
      );
      
      console.log("🔄 قبل الإزالة:", prevItems.length, "بعد الإزالة:", filteredItems.length);
      return filteredItems;
    });
  };

  // ✅ تحديث كمية منتج في السلة - محدث (تبسيط)
  const updateQuantity = (id: string, quantity: number) => {
    console.log("🔄 تحديث كمية المنتج:", { id, quantity });
    
    if (quantity <= 0) {
      // ✅ البحث عن المنتج وإزالته باستخدام id فقط
      setCartItems(prevItems => prevItems.filter(item => item.id !== id));
      return;
    }

    setCartItems((prevItems) => {
      const updatedItems = prevItems.map((item) => {
        if (item.id === id) {
          // ✅ للموظفين: لا تسمح بتجاوز الكمية المتاحة
          const finalQuantity = item.maxQuantity
            ? Math.min(quantity, item.maxQuantity)
            : quantity;

          return { ...item, quantity: finalQuantity };
        }
        return item;
      });

      return updatedItems;
    });
  };

  // ✅ تفريغ السلة
  const clearCart = () => {
    setCartItems([]);
  };

  // ✅ حساب العدد الإجمالي للمنتجات في السلة
  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // ✅ حساب المجموع الكلي للسلة
  const getCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // ✅ التحقق إذا كان المنتج موجود في السلة
  const isProductInCart = (productId: string, color: string, size: string) => {
    return cartItems.some(
      (item) =>
        item.id === productId && item.color === color && item.size === size
    );
  };

  // ✅ الحصول على كمية منتج معين في السلة
  const getProductQuantity = (
    productId: string,
    color: string,
    size: string
  ) => {
    const item = cartItems.find(
      (item) =>
        item.id === productId && item.color === color && item.size === size
    );
    return item ? item.quantity : 0;
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItemsCount,
    getCartTotal,
    isProductInCart,
    getProductQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}