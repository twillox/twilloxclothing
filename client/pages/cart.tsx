import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [applying, setApplying] = useState(false);

  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    activeCoupon, 
    applyCouponCode, 
    removeCoupon,
    getCartSubtotal,
    getCartTotal,
    getCouponDiscount,
    storeSettings,
    getCartTax
  } = useCart();
  
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const prodSnap = await getDocs(collection(db, 'products'));
        const prodList: Product[] = [];
        prodSnap.forEach((doc) => {
          prodList.push({ id: doc.id, ...doc.data() } as Product);
        });
        setProducts(prodList);
      } catch (e) {
        console.error("Firestore loading error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim() === '') return;
    setApplying(true);
    const sub = getCartSubtotal(products);
    await applyCouponCode(couponInput, sub);
    setApplying(false);
  };

  const getProductDetails = (prodId: string) => {
    return products.find((p) => p.id === prodId);
  };

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 py-32 text-center">
        <p className="text-sm text-gray-500 font-bold tracking-widest uppercase">CHECKING BAG...</p>
      </div>
    );
  }

  const subtotal = getCartSubtotal(products);
  const discount = getCouponDiscount(subtotal);
  const tax = getCartTax(subtotal, discount);
  const delivery = storeSettings?.deliveryFee || 0;
  const total = getCartTotal(products);

  return (
    <>
      <Head>
        <title>CART — TWILLOX</title>
      </Head>

      <div className="bg-white min-h-screen pt-6 pb-20 border-b-4 border-black">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          
          {/* Section Header */}
          <div className="mb-6 md:mb-12 border-b-4 border-black pb-4 md:pb-6">
            <h1 className="font-anton text-4xl md:text-6xl lg:text-8xl text-black uppercase leading-none">CART</h1>
            <p className="text-gray-500 font-bold text-sm mt-2 uppercase tracking-widest">
              {cartItems.length} PIECE{cartItems.length !== 1 ? 'S' : ''} COPPED
            </p>
          </div>

          {cartItems.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
              
              {/* Left Column - List of items */}
              <div className="flex-1 w-full space-y-8">
                {cartItems.map((item, idx) => {
                  const prod = getProductDetails(item.productId);
                  if (!prod) return null;
                  const unitPrice = prod.salePrice || prod.price;
                  const itemTotal = unitPrice * item.quantity;

                  return (
                    <div key={`${item.productId}-${item.size}-${item.color}`} className="flex flex-col sm:flex-row gap-6 p-6 border-4 border-black bg-surface-dim shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                      {/* Image */}
                      <Link href={`/product/${prod.id}`} className="w-full sm:w-32 aspect-[4/5] bg-white border-2 border-black shrink-0 relative block">
                        <img alt={prod.name} src={prod.imageUrls[0]} className="absolute inset-0 w-full h-full object-cover mix-blend-multiply" />
                      </Link>
                      
                      {/* Details */}
                      <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{prod.category}</p>
                            <Link href={`/product/${prod.id}`}>
                              <h3 className="font-anton text-2xl md:text-3xl uppercase text-black hover:text-gray-600 transition-colors leading-tight">
                                {prod.name}
                              </h3>
                            </Link>
                          </div>
                          <span className="font-bold text-black text-xl md:text-2xl">${itemTotal}</span>
                        </div>

                        <div className="text-sm text-black font-bold mb-4 space-y-1 uppercase tracking-widest">
                          {item.size !== 'One Size' && <p>SIZE: {item.size}</p>}
                          {item.color !== 'Default' && <p>COLOR: {item.color}</p>}
                        </div>

                        <div className="mt-auto flex justify-between items-center">
                          {/* Quantity */}
                          <div className="flex items-center border-2 border-black bg-white h-10 w-24">
                            <button 
                              onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                              className="w-8 h-full flex items-center justify-center text-black hover:bg-gray-200 transition-colors font-bold text-lg"
                            >
                              −
                            </button>
                            <span className="text-sm font-bold w-8 text-center text-black border-x-2 border-black h-full flex items-center justify-center bg-gray-100">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                              className="w-8 h-full flex items-center justify-center text-black hover:bg-gray-200 transition-colors font-bold text-lg"
                            >
                              +
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            onClick={() => removeFromCart(item.productId, item.size, item.color)}
                            className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors border-b-2 border-transparent hover:border-black pb-0.5 cursor-pointer"
                          >
                            DROP THIS
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column - Summary */}
              <aside className="w-full lg:w-[400px] shrink-0 space-y-8">
                
                {/* Order Summary */}
                <div className="border-4 border-black p-6 md:p-8 bg-white shadow-hard">
                  <h3 className="font-anton text-3xl md:text-4xl text-black mb-4 md:mb-6 uppercase">SUMMARY</h3>
                  
                  <div className="space-y-4 text-sm font-bold uppercase tracking-widest text-gray-500 border-b-4 border-black pb-6 mb-6">
                    <div className="flex justify-between">
                      <span>SUBTOTAL</span>
                      <span className="text-black font-bold">${subtotal}</span>
                    </div>
                    
                    {activeCoupon && (
                      <div className="flex justify-between text-black">
                        <span className="flex items-center gap-2">
                          CODE ({activeCoupon.code})
                          <button onClick={removeCoupon} className="text-[10px] text-gray-500 hover:text-black underline">REMOVE</button>
                        </span>
                        <span className="font-bold text-[#8B0000]">-${discount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>TAX ({storeSettings?.taxRate || 0}%)</span>
                      <span className="text-black font-bold">${tax.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>SHIPPING</span>
                      <span className="text-black font-bold">
                        {delivery === 0 ? 'FREE' : `$${delivery.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mb-8">
                    <span className="text-lg text-black font-bold uppercase tracking-widest">TOTAL</span>
                    <span className="text-4xl text-black font-anton leading-none">${total.toFixed(2)}</span>
                  </div>

                  <Link href="/checkout">
                    <button className="w-full bg-black text-white py-3 md:py-5 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors cursor-pointer border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px]">
                      PROCEED TO CHECKOUT
                    </button>
                  </Link>
                </div>

                {/* Promo Code */}
                <div className="p-6 md:p-8 border-4 border-black bg-surface-dim shadow-hard">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-black mb-4">PROMO CODE</h3>
                  <form onSubmit={handleApplyCoupon} className="flex flex-col gap-4">
                    <input
                      type="text"
                      placeholder="ENTER CODE"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="w-full bg-white border-2 border-black focus:outline-none px-4 py-4 text-sm font-bold uppercase text-black"
                    />
                    <button 
                      type="submit" 
                      disabled={applying || !couponInput.trim()} 
                      className="w-full border-2 border-black text-black bg-white py-3 md:py-4 text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {applying ? 'VERIFYING...' : 'APPLY CODE'}
                    </button>
                  </form>
                </div>

              </aside>

            </div>
          ) : (
            // Empty cart state
            <div className="py-24 text-center max-w-lg mx-auto border-4 border-black border-dashed">
              <span className="material-symbols-outlined text-[64px] text-gray-300 font-bold block mb-6">production_quantity_limits</span>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-8">
                YOUR BAG IS EMPTY. NO PIECES COPPED YET.
              </p>
              <Link href="/catalog">
                <button className="bg-black text-white px-8 md:px-10 py-3 md:py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors cursor-pointer border-2 border-black">
                  CHECK THE STASH
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
