import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  increment,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Product, OrderItem, Order } from '../types';

export default function Checkout() {
  const { currentUser, userProfile, updateProfileInfo } = useAuth();
  const { 
    cartItems, 
    clearCart, 
    activeCoupon, 
    getCartSubtotal, 
    getCartTotal, 
    getCouponDiscount,
    storeSettings,
    getCartTax
  } = useCart();
  
  const { toast } = useToast();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');

  const [hasSavedInfo, setHasSavedInfo] = useState(false);
  const [useSavedInfo, setUseSavedInfo] = useState(false);

  // 1. Fetch products to resolve details
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

  // 2. Pre-populate form if user profile exists
  useEffect(() => {
    if (userProfile) {
      if (userProfile.address && userProfile.address.street && userProfile.phone) {
        setHasSavedInfo(true);
        setUseSavedInfo(true);
      }
      setFullName(userProfile.displayName || '');
      setEmailInput(userProfile.email || '');
      setPhone(userProfile.phone || '');
      if (userProfile.address) {
        setStreetAddress(userProfile.address.street || '');
        setCity(userProfile.address.city || '');
        setStateName(userProfile.address.state || '');
        setPincode(userProfile.address.pincode || '');
      }
    } else if (currentUser) {
      setEmailInput(currentUser.email || '');
    }
  }, [userProfile, currentUser]);

  useEffect(() => {
    if (storeSettings) {
      if (storeSettings.paymentMethods.cod && !storeSettings.paymentMethods.online) {
        setPaymentMethod('COD');
      } else if (!storeSettings.paymentMethods.cod && storeSettings.paymentMethods.online) {
        setPaymentMethod('ONLINE');
      }
    }
  }, [storeSettings]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error("BAG IS EMPTY.");
      return;
    }

    if (!fullName || !emailInput || !phone || !streetAddress || !city || !stateName || !pincode) {
      toast.warning("FILL IN ALL THE BLANKS.");
      return;
    }

    setProcessing(true);
    try {
      const subtotal = getCartSubtotal(products);
      const discount = getCouponDiscount(subtotal);
      const tax = getCartTax(subtotal, discount);
      const deliveryFee = storeSettings?.deliveryFee || 0;
      const total = getCartTotal(products);

      const orderItems: OrderItem[] = cartItems.map((c) => {
        const p = products.find((prod) => prod.id === c.productId);
        const unitPrice = p?.salePrice || p?.price || 0;
        return {
          productId: c.productId,
          name: p?.name || 'Item',
          price: unitPrice,
          quantity: c.quantity,
          size: c.size,
          color: c.color,
          imageUrl: p?.imageUrls[0] || ''
        };
      });

      const orderPayload: Omit<Order, 'id'> = {
        customerId: currentUser?.uid || 'guest-session',
        customerName: fullName,
        customerEmail: emailInput,
        phone,
        shippingAddress: {
          address: streetAddress,
          city,
          state: stateName,
          pincode
        },
        items: orderItems,
        subtotal,
        discount,
        tax,
        deliveryFee,
        total,
        paymentMethod,
        status: 'Pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      if (activeCoupon) orderPayload.couponCode = activeCoupon.code;

      const docRef = await addDoc(collection(db, 'orders'), orderPayload);

      // Non-blocking: update stock in background, don't fail the order if it errors
      Promise.all(
        cartItems.map((item) =>
          updateDoc(doc(db, 'products', item.productId), {
            stock: increment(-item.quantity)
          }).catch((err) => console.warn('Stock update failed for', item.productId, err))
        )
      );

      if (currentUser) {
        await addDoc(collection(db, 'notifications'), {
          userId: currentUser.uid,
          title: 'SECURED',
          message: `ORDER #${docRef.id.substring(0, 10).toUpperCase()} CONFIRMED.`,
          type: 'order_update',
          read: false,
          createdAt: Timestamp.now()
        });
        
        // Save new info to profile if they entered new details
        if (!useSavedInfo) {
          try {
            await updateProfileInfo(fullName, phone, {
              street: streetAddress,
              city,
              state: stateName,
              pincode
            });
          } catch (profileErr) {
            console.warn("Failed to save new info to profile:", profileErr);
          }
        }
      }

      toast.success("ORDER PLACED.");
      clearCart();
      
      if (currentUser) router.push('/profile');
      else router.push('/');
    } catch (e: any) {
      console.error("Order submission error:", e);
      const errMsg = e?.code === 'permission-denied'
        ? 'Permission denied — check Firestore rules.'
        : e?.message || 'Unknown error';
      toast.error(`ORDER FAILED: ${errMsg}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 py-32 text-center">
        <p className="text-sm text-gray-500 font-bold tracking-widest uppercase">LOADING CHECKOUT...</p>
      </div>
    );
  }

  const subtotal = getCartSubtotal(products);
  const discount = getCouponDiscount(subtotal);
  const tax = getCartTax(subtotal, discount);
  const deliveryFee = storeSettings?.deliveryFee || 0;
  const total = getCartTotal(products);

  return (
    <>
      <Head>
        <title>CHECKOUT — TWILLOX</title>
      </Head>

      <div className="bg-white min-h-screen pt-12 pb-24 border-b-8 border-black">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          
          <div className="mb-6 md:mb-12 border-b-4 border-black pb-4 md:pb-6">
            <h1 className="font-anton text-4xl md:text-6xl lg:text-8xl text-black uppercase leading-none">CHECKOUT</h1>
            <p className="text-gray-500 font-bold text-sm mt-2 uppercase tracking-widest">SECURE CHECKOUT</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-16 items-start">
            
            {/* Left Form */}
            <div className="flex-1 w-full space-y-6 md:space-y-8">
              <h3 className="font-anton text-3xl md:text-4xl text-black mb-4 md:mb-6 uppercase">SHIPPING INFO</h3>
              
              <form onSubmit={handlePlaceOrder} className="space-y-6">
                
                {hasSavedInfo && (
                  <div className="bg-gray-100 border-2 border-black p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="font-bold uppercase tracking-widest text-xs text-black mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                        SAVED PROFILE SELECTED
                      </h4>
                      <p className="text-sm font-bold text-gray-600 uppercase leading-relaxed">
                        {userProfile?.displayName} // {userProfile?.phone} <br/>
                        {userProfile?.address?.street}, {userProfile?.address?.city}, {userProfile?.address?.state} {userProfile?.address?.pincode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseSavedInfo(!useSavedInfo)}
                      className="text-xs font-bold uppercase tracking-widest border-2 border-black px-4 py-3 hover:bg-black hover:text-white transition-colors shrink-0"
                    >
                      {useSavedInfo ? 'USE A DIFFERENT ADDRESS' : 'USE SAVED DETAILS'}
                    </button>
                  </div>
                )}

                {!useSavedInfo && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2">FULL NAME</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-white border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                      placeholder="ENTER FULL NAME"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2">EMAIL</label>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-white border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                      placeholder="ENTER EMAIL"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2">PHONE NUMBER</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                    placeholder="ENTER PHONE NUMBER"
                  />
                </div>

                <div className="pt-4 border-t-2 border-black">
                  <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2 mt-4">STREET ADDRESS</label>
                  <input
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    className="w-full bg-white border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors mb-6"
                    placeholder="ENTER STREET ADDRESS"
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2">CITY</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-white border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                        placeholder="CITY"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2">STATE / PROVINCE</label>
                      <input
                        type="text"
                        required
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full bg-white border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                        placeholder="STATE"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2">ZIP CODE</label>
                      <input
                        type="text"
                        required
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full bg-white border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                        placeholder="ZIP CODE"
                      />
                    </div>
                  </div>
                </div>
                </div>
                )}

                <div className="pt-10 space-y-6">
                  <h3 className="font-anton text-2xl md:text-3xl text-black uppercase">PAYMENT METHOD</h3>
                  
                  <div className="space-y-4">
                    {storeSettings?.paymentMethods?.cod && (
                      <label className={`block border-2 p-6 cursor-pointer transition-colors ${paymentMethod === 'COD' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black'}`}>
                        <div className="flex items-center gap-4">
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="COD"
                            checked={paymentMethod === 'COD'}
                            onChange={() => setPaymentMethod('COD')}
                            className="w-5 h-5 accent-black" 
                          />
                          <div>
                            <span className="font-bold uppercase tracking-widest text-sm text-black block">CASH ON DELIVERY</span>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mt-1">Pay with cash when the package arrives.</span>
                          </div>
                        </div>
                      </label>
                    )}

                    {storeSettings?.paymentMethods?.online && (
                      <label className={`block border-2 p-6 cursor-pointer transition-colors ${paymentMethod === 'ONLINE' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black'}`}>
                        <div className="flex items-center gap-4">
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="ONLINE"
                            checked={paymentMethod === 'ONLINE'}
                            onChange={() => setPaymentMethod('ONLINE')}
                            className="w-5 h-5 accent-black" 
                          />
                          <div>
                            <span className="font-bold uppercase tracking-widest text-sm text-black block">PAY SECURELY ONLINE</span>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mt-1">Credit card, Debit card, or Netbanking.</span>
                          </div>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <div className="pt-10">
                  <button
                    type="submit"
                    disabled={processing || cartItems.length === 0}
                    className="w-full bg-black text-white py-5 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors cursor-pointer border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[6px] hover:translate-y-[6px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                  >
                    {processing ? 'PROCESSING...' : `COMPLETE ORDER — $${total}`}
                  </button>
                  <p className="text-center text-xs text-black mt-6 font-bold tracking-widest flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px] font-bold">lock</span>
                    100% SECURE CHECKOUT
                  </p>
                </div>

              </form>
            </div>

            {/* Right Summary Column */}
            <aside className="w-full lg:w-[450px] shrink-0 space-y-8">
              
              <div className="bg-white border-4 border-black p-8 shadow-hard">
                <h3 className="font-anton text-3xl md:text-4xl text-black mb-4 md:mb-6 uppercase border-b-4 border-black pb-4">ORDER DETAILS</h3>
                
                <div className="max-h-96 overflow-y-auto pr-2 space-y-6 mb-8 scrollbar-thin">
                  {cartItems.map((item) => {
                    const p = products.find((prod) => prod.id === item.productId);
                    if (!p) return null;
                    const unitPrice = p.salePrice || p.price;

                    return (
                      <div key={`${item.productId}-${item.size}-${item.color}`} className="flex items-start gap-4 font-bold border-b-2 border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="w-16 h-20 bg-surface-dim shrink-0 overflow-hidden border-2 border-black">
                          <img alt={p.name} src={p.imageUrls[0]} className="w-full h-full object-cover mix-blend-multiply" />
                        </div>
                        <div className="flex flex-col flex-1">
                          <p className="font-anton text-xl text-black uppercase leading-tight">{p.name}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                            {item.size} // {item.color}
                          </p>
                          <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">QTY: {item.quantity}</p>
                        </div>
                        <span className="font-bold text-black text-lg shrink-0">${unitPrice * item.quantity}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4 text-sm font-bold uppercase tracking-widest text-gray-500 border-t-4 border-black pt-6">
                  <div className="flex justify-between">
                    <span>SUBTOTAL</span>
                    <span className="text-black font-bold">${subtotal}</span>
                  </div>
                  
                  {activeCoupon && (
                    <div className="flex justify-between text-black">
                      <span>CODE: {activeCoupon.code}</span>
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
                      {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-end pt-4 mt-4 border-t-2 border-black">
                    <span className="text-lg text-black font-bold uppercase tracking-widest">FINAL TOTAL</span>
                    <span className="text-4xl text-black font-anton leading-none">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </aside>

          </div>
        </div>
      </div>
    </>
  );
}
