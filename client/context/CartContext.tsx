import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../utils/firebase';
import { useToast } from './ToastContext';
import { CartItem, Product, Coupon, StoreSettings } from '../types';
import { onAuthStateChanged } from 'firebase/auth';

interface CartContextProps {
  cartItems: CartItem[];
  wishlist: string[];
  activeCoupon: Coupon | null;
  addToCart: (productId: string, quantity: number, size: string, color: string) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  applyCouponCode: (code: string, subtotal: number) => Promise<boolean>;
  removeCoupon: () => void;
  getCartSubtotal: (products: Product[]) => number;
  getCartTotal: (products: Product[]) => number;
  getCouponDiscount: (subtotal: number) => number;
  storeSettings: StoreSettings | null;
  getCartTax: (subtotal: number, discount: number) => number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'global'));
        if (snap.exists()) {
          setStoreSettings(snap.data() as StoreSettings);
        } else {
          // Default fallback if document doesn't exist
          setStoreSettings({
            deliveryFee: 0,
            taxRate: 0,
            paymentMethods: { cod: true, online: false }
          });
        }
      } catch (e) {
        console.error("Failed to load store settings", e);
      }
    };
    fetchSettings();
  }, []);

  // 1. Auth Listener to switch between Guest (local) and Real User (firestore) data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await loadUserDataFromFirestore(user.uid);
      } else {
        setUserId(null);
        // Load guest items from localStorage
        const localCart = localStorage.getItem('twillox_cart');
        const localWishlist = localStorage.getItem('twillox_wishlist');
        if (localCart) setCartItems(JSON.parse(localCart));
        if (localWishlist) setWishlist(JSON.parse(localWishlist));
      }
    });
    return unsubscribe;
  }, []);

  // 2. Local fallback sync for guest session
  useEffect(() => {
    if (!userId) {
      localStorage.setItem('twillox_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, userId]);

  useEffect(() => {
    if (!userId) {
      localStorage.setItem('twillox_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, userId]);

  // Load user data from Firestore on sign-in
  const loadUserDataFromFirestore = async (uid: string) => {
    try {
      // Cart loader
      const cartRef = doc(db, 'cart', uid);
      const cartSnap = await getDoc(cartRef);
      let firestoreItems: CartItem[] = [];
      if (cartSnap.exists()) {
        firestoreItems = cartSnap.data().items || [];
      }

      // Merge local guest cart with Firestore cart if local items exist
      const localCartStr = localStorage.getItem('twillox_cart');
      if (localCartStr) {
        const localItems: CartItem[] = JSON.parse(localCartStr);
        if (localItems.length > 0) {
          // Merge logic
          const merged = [...firestoreItems];
          localItems.forEach((local) => {
            const idx = merged.findIndex(
              (f) => f.productId === local.productId && f.size === local.size && f.color === local.color
            );
            if (idx > -1) {
              merged[idx].quantity += local.quantity;
            } else {
              merged.push(local);
            }
          });
          firestoreItems = merged;
          // Clean local guest storage
          localStorage.removeItem('twillox_cart');
          // Save merged cart back to firestore
          await setDoc(cartRef, { items: firestoreItems, updatedAt: Timestamp.now() });
        }
      }
      setCartItems(firestoreItems);

      // Wishlist loader
      const wishlistRef = doc(db, 'wishlist', uid);
      const wishlistSnap = await getDoc(wishlistRef);
      let firestoreWishlist: string[] = [];
      if (wishlistSnap.exists()) {
        firestoreWishlist = wishlistSnap.data().productIds || [];
      }

      const localWishlistStr = localStorage.getItem('twillox_wishlist');
      if (localWishlistStr) {
        const localWishlist: string[] = JSON.parse(localWishlistStr);
        if (localWishlist.length > 0) {
          // Merge arrays unique
          firestoreWishlist = Array.from(new Set([...firestoreWishlist, ...localWishlist]));
          localStorage.removeItem('twillox_wishlist');
          await setDoc(wishlistRef, { productIds: firestoreWishlist, updatedAt: Timestamp.now() });
        }
      }
      setWishlist(firestoreWishlist);

    } catch (e) {
      console.error("Error loading user records from firestore:", e);
    }
  };

  // Sync to Firestore helper
  const syncCartToFirestore = async (items: CartItem[]) => {
    if (userId) {
      try {
        await setDoc(doc(db, 'cart', userId), {
          items,
          updatedAt: Timestamp.now()
        });
      } catch (e) {
        console.error("Cart sync failed:", e);
      }
    }
  };

  const syncWishlistToFirestore = async (productIds: string[]) => {
    if (userId) {
      try {
        await setDoc(doc(db, 'wishlist', userId), {
          productIds,
          updatedAt: Timestamp.now()
        });
      } catch (e) {
        console.error("Wishlist sync failed:", e);
      }
    }
  };

  // Cart operations
  const addToCart = (productId: string, quantity: number, size: string, color: string) => {
    setCartItems((prev) => {
      const idx = prev.findIndex(
        (item) => item.productId === productId && item.size === size && item.color === color
      );
      let updated = [];
      if (idx > -1) {
        updated = prev.map((item, index) =>
          index === idx ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        updated = [...prev, { productId, quantity, size, color }];
      }
      syncCartToFirestore(updated);
      return updated;
    });
    toast.success("Added to bag.");
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCartItems((prev) => {
      const updated = prev.filter(
        (item) => !(item.productId === productId && item.size === size && item.color === color)
      );
      syncCartToFirestore(updated);
      return updated;
    });
    toast.warning("Removed from bag.");
  };

  const updateQuantity = (productId: string, size: string, color: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCartItems((prev) => {
      const updated = prev.map((item) =>
        item.productId === productId && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      );
      syncCartToFirestore(updated);
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    syncCartToFirestore([]);
    setActiveCoupon(null);
  };

  // Wishlist operations
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      let updated = [];
      if (exists) {
        updated = prev.filter((id) => id !== productId);
        toast.info("Removed from saved.");
      } else {
        updated = [...prev, productId];
        toast.success("Saved to wishlist.");
      }
      syncWishlistToFirestore(updated);
      return updated;
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Coupon handling
  const applyCouponCode = async (code: string, subtotal: number): Promise<boolean> => {
    try {
      const couponRef = doc(db, 'coupons', code.toUpperCase().trim());
      const couponSnap = await getDoc(couponRef);
      
      if (!couponSnap.exists()) {
        toast.error("That code doesn't exist.");
        return false;
      }
      
      const couponData = couponSnap.data() as Coupon;
      if (!couponData.active) {
        toast.error("That code is expired.");
        return false;
      }
      
      if (subtotal < couponData.minPurchase) {
        toast.warning(`Min spend of $${couponData.minPurchase} needed for this code.`);
        return false;
      }
      
      setActiveCoupon({
        ...couponData,
        code: couponSnap.id
      });
      toast.success("Code applied. Discount locked in.");
      return true;
    } catch (e) {
      toast.error("Couldn't apply that code.");
      return false;
    }
  };

  const removeCoupon = () => {
    setActiveCoupon(null);
    toast.info("Code removed.");
  };

  // Pricing tallies
  const getCartSubtotal = (products: Product[]) => {
    return cartItems.reduce((acc, item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return acc;
      const unitPrice = prod.salePrice || prod.price;
      return acc + unitPrice * item.quantity;
    }, 0);
  };

  const getCouponDiscount = (subtotal: number) => {
    if (!activeCoupon) return 0;
    if (activeCoupon.type === 'percentage') {
      return (subtotal * activeCoupon.value) / 100;
    } else {
      return Math.min(activeCoupon.value, subtotal);
    }
  };

  const getCartTax = (subtotal: number, discount: number) => {
    if (!storeSettings) return 0;
    const taxableAmount = Math.max(subtotal - discount, 0);
    return (taxableAmount * storeSettings.taxRate) / 100;
  };

  const getCartTotal = (products: Product[]) => {
    const sub = getCartSubtotal(products);
    const disc = getCouponDiscount(sub);
    const tax = getCartTax(sub, disc);
    const delivery = storeSettings?.deliveryFee || 0;
    return Math.max(sub - disc, 0) + tax + delivery;
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      wishlist,
      activeCoupon,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      toggleWishlist,
      isInWishlist,
      applyCouponCode,
      removeCoupon,
      getCartSubtotal,
      getCartTotal,
      getCouponDiscount,
      storeSettings,
      getCartTax
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
