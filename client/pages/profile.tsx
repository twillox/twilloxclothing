import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { Order, Product, Notification } from '../types';

type ActiveTab = 'orders' | 'profile' | 'wishlist' | 'inbox';

export default function ProfileDashboard() {
  const { currentUser, userProfile, loading: authLoading, updateProfileInfo, logout } = useAuth();
  const { wishlist, toggleWishlist } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Edit Profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');

  // 1. Auth check
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/auth');
    }
  }, [currentUser, authLoading]);

  // 2. Pre-populate profile values
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.displayName || '');
      setPhone(userProfile.phone || '');
      if (userProfile.address) {
        setStreet(userProfile.address.street || '');
        setCity(userProfile.address.city || '');
        setStateName(userProfile.address.state || '');
        setPincode(userProfile.address.pincode || '');
      }
    }
  }, [userProfile]);

  // 3. Load orders + notifications
  const loadDashboardData = async () => {
    if (!currentUser) return;
    setLoadingData(true);
    try {
      const ordersSnap = await getDocs(
        query(
          collection(db, 'orders'),
          where('customerId', '==', currentUser.uid)
        )
      );
      const ordersList: Order[] = [];
      ordersSnap.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() } as Order);
      });
      // Sort client-side to avoid needing a Firestore composite index
      ordersList.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setOrders(ordersList);

      const notifySnap = await getDocs(
        query(
          collection(db, 'notifications'),
          where('userId', 'in', [currentUser.uid, 'all'])
        )
      );
      const notifyList: Notification[] = [];
      notifySnap.forEach((doc) => {
        notifyList.push({ id: doc.id, ...doc.data() } as Notification);
      });
      // Sort client-side to avoid needing a Firestore composite index
      notifyList.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setNotifications(notifyList);

    } catch (e) {
      console.error("Dashboard data load error:", e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  // 4. Separately load wishlist products whenever the wishlist IDs change
  useEffect(() => {
    const loadWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setWishlistProducts([]);
        return;
      }
      try {
        const wishList: Product[] = [];
        for (const pid of wishlist) {
          const pSnap = await getDoc(doc(db, 'products', pid));
          if (pSnap.exists()) {
            wishList.push({ id: pSnap.id, ...pSnap.data() } as Product);
          }
        }
        setWishlistProducts(wishList);
      } catch (e) {
        console.error('Wishlist products load error:', e);
      }
    };
    loadWishlistProducts();
  }, [wishlist]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await updateProfileInfo(name, phone, {
        street,
        city,
        state: stateName,
        pincode
      });
      toast.success("PROFILE UPDATED.");
    } catch (err) {
      console.error(err);
      toast.error("UPDATE FAILED.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleMarkNotificationRead = async (nid: string) => {
    try {
      const nRef = doc(db, 'notifications', nid);
      await updateDoc(nRef, { read: true });
      setNotifications((prev) => 
        prev.map((n) => n.id === nid ? { ...n, read: true } : n)
      );
    } catch (e) {
      console.error(e);
    }
  };

  const orderStages = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered'];
  const getStageIndex = (status: Order['status']) => {
    if (status === 'Cancelled') return -1;
    return orderStages.indexOf(status);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || (!currentUser && !authLoading)) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 py-32 text-center">
        <p className="text-sm text-gray-500 font-bold tracking-widest uppercase">VERIFYING CLEARANCE...</p>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <>
      <Head>
        <title>YOUR PROFILE — TWILLOX</title>
      </Head>

      <div className="bg-white min-h-screen pt-12 pb-24 border-b-8 border-black">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          
          {/* Header */}
          <div className="mb-8 md:mb-12 border-b-4 border-black pb-4 md:pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
            <div>
              <h1 className="font-anton text-4xl md:text-6xl lg:text-8xl text-black uppercase leading-none">YOUR PROFILE</h1>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mt-2">USERNAME: {userProfile?.displayName || 'GUEST'}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm font-bold uppercase tracking-widest text-black border-2 border-black px-6 py-3 hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              SIGN OUT
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-start">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 shrink-0 space-y-4">
              {[
                { id: 'orders', label: 'ORDER HISTORY', count: orders.length },
                { id: 'wishlist', label: 'SAVED PIECES', count: wishlist.length },
                { id: 'inbox', label: 'NOTIFICATIONS', count: unreadNotifications, highlight: unreadNotifications > 0 },
                { id: 'profile', label: 'PROFILE DETAILS' }
              ].map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`w-full text-left px-6 py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-between transition-all border-2 border-black cursor-pointer ${
                      active ? 'bg-black text-white shadow-hard scale-[1.02]' : 'bg-white text-black hover:bg-surface-dim hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`text-xs px-2 py-1 ${
                        tab.highlight ? 'bg-[#8B0000] text-white border border-white' : active ? 'bg-white text-black' : 'bg-black text-white'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 w-full min-h-[500px]">
              {loadingData ? (
                <div className="text-center py-20 text-sm font-bold text-gray-500 tracking-widest uppercase">
                  LOADING...
                </div>
              ) : (
                <>
                  {/* Orders Tab */}
                  {activeTab === 'orders' && (
                    <div className="space-y-6 md:space-y-8">
                      <h2 className="font-anton text-3xl md:text-4xl text-black mb-4 md:mb-6 uppercase border-b-4 border-black pb-3 md:pb-4">ORDER HISTORY</h2>
                      
                      {orders.length > 0 ? (
                        orders.map((order) => {
                          const stageIdx = getStageIndex(order.status);
                          const isCancelled = order.status === 'Cancelled';

                          return (
                            <div key={order.id} className="border-4 border-black bg-white shadow-hard mb-8">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-dim border-b-4 border-black p-6 gap-4">
                                <div>
                                  <span className="text-xl font-anton uppercase text-black block leading-none">ORDER #{order.id.substring(0, 8).toUpperCase()}</span>
                                  <span className="text-xs text-gray-500 font-bold uppercase tracking-widest block mt-2">
                                    LOGGED: {order.createdAt.toDate().toLocaleDateString('en-US')}
                                  </span>
                                </div>
                                <div className="text-left sm:text-right">
                                  <span className="text-2xl font-bold text-black block">${order.total.toFixed(2)}</span>
                                  <span className={`text-xs font-bold uppercase tracking-widest mt-1 block px-3 py-1 border-2 border-black inline-block mt-2 ${
                                    isCancelled ? 'bg-[#8B0000] text-white' : 'bg-white text-black'
                                  }`}>
                                    STATUS: {order.status}
                                  </span>
                                </div>
                              </div>

                              {/* Progress Tracker */}
                              {!isCancelled && stageIdx >= 0 && (
                                <div className="p-6 border-b-4 border-black bg-white">
                                  <div className="flex justify-between relative before:absolute before:top-1/2 before:-translate-y-1/2 before:left-0 before:right-0 before:h-2 before:bg-gray-200">
                                    {orderStages.map((stage, idx) => {
                                      const done = idx <= stageIdx;
                                      return (
                                        <div key={stage} className="relative z-10 flex flex-col items-center gap-2">
                                          <div className={`w-6 h-6 rounded-none border-2 border-black ${
                                            done ? 'bg-black' : 'bg-white'
                                          }`} />
                                          <span className={`text-[10px] font-bold uppercase tracking-widest hidden sm:block ${
                                            done ? 'text-black' : 'text-gray-400'
                                          }`}>
                                            {stage}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="p-6 space-y-6">
                                {order.items.map((item) => (
                                  <div key={`${item.productId}-${item.size}-${item.color}`} className="flex items-start gap-6 border-b-2 border-gray-100 pb-6 last:border-0 last:pb-0">
                                    <div className="w-20 h-24 bg-surface-dim border-2 border-black overflow-hidden shrink-0">
                                      <img alt={item.name} src={item.imageUrl} className="w-full h-full object-cover mix-blend-multiply" />
                                    </div>
                                    <div className="flex-1">
                                      <span className="text-xl font-anton uppercase text-black block leading-none">{item.name}</span>
                                      <span className="text-xs text-gray-500 font-bold uppercase tracking-widest block mt-2">
                                        SIZE: {item.size} // COLOR: {item.color} // QTY: {item.quantity}
                                      </span>
                                    </div>
                                    <span className="text-lg font-bold text-black">${(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-20 border-4 border-black border-dashed">
                          <span className="material-symbols-outlined text-[64px] text-gray-300 font-bold block mb-6">receipt_long</span>
                          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-6">YOU HAVEN'T COPPED ANYTHING YET.</p>
                          <Link href="/catalog">
                            <button className="border-2 border-black bg-black text-white px-8 py-4 text-sm uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              COP SOMETHING
                            </button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Wishlist Tab */}
                  {activeTab === 'wishlist' && (
                    <div>
                      <h2 className="font-anton text-3xl md:text-4xl text-black mb-4 md:mb-6 uppercase border-b-4 border-black pb-3 md:pb-4">SAVED PIECES</h2>
                      {wishlistProducts.length > 0 ? (
                        <div className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory scrollbar-thin">
                          {wishlistProducts.map((p) => (
                            <div key={p.id} className="group relative border-4 border-black bg-white shadow-hard hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all shrink-0 w-[280px] sm:w-[320px] snap-start">
                              <div className="w-full aspect-[4/5] bg-surface-dim overflow-hidden relative border-b-4 border-black">
                                <img 
                                  src={p.imageUrls[0]} 
                                  alt={p.name} 
                                  className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                                />
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toggleWishlist(p.id);
                                  }}
                                  className="absolute top-4 right-4 bg-white text-black border-2 border-black w-10 h-10 flex items-center justify-center hover:bg-black hover:text-white transition-colors z-10 cursor-pointer shadow-hard"
                                >
                                  <span className="material-symbols-outlined font-bold text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                                </button>
                              </div>
                              <div className="p-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{p.category}</p>
                                <div className="flex justify-between items-start gap-2">
                                  <h3 className="text-xl font-anton uppercase text-black leading-tight">{p.name}</h3>
                                  <span className="text-lg font-bold text-black">${p.price}</span>
                                </div>
                              </div>
                              <Link href={`/product/${p.id}`} className="absolute inset-0 z-0">
                                <span className="sr-only">View {p.name}</span>
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-20 border-4 border-black border-dashed">
                          <span className="material-symbols-outlined text-[64px] text-gray-300 font-bold block mb-6">visibility_off</span>
                          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-6">YOU HAVEN'T SAVED ANYTHING.</p>
                          <Link href="/catalog">
                            <button className="border-2 border-black bg-black text-white px-8 py-4 text-sm uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              BROWSE THE STASH
                            </button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inbox Tab */}
                  {activeTab === 'inbox' && (
                    <div>
                      <h2 className="font-anton text-3xl md:text-4xl text-black mb-4 md:mb-6 uppercase border-b-4 border-black pb-3 md:pb-4">NOTIFICATIONS</h2>
                      <div className="space-y-6">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => !n.read && handleMarkNotificationRead(n.id)}
                              className={`p-6 border-4 transition-all cursor-pointer shadow-hard ${
                                n.read 
                                  ? 'bg-gray-100 border-gray-300 opacity-70' 
                                  : 'bg-white border-black hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                  {!n.read && <span className="w-3 h-3 bg-[#8B0000] rounded-none border border-black animate-pulse" />}
                                  <h4 className={`text-xl font-anton uppercase ${n.read ? 'text-gray-600' : 'text-black'}`}>
                                    {n.title}
                                  </h4>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-500 whitespace-nowrap bg-white border-2 border-gray-300 px-2 py-1">
                                  {n.createdAt.toDate().toLocaleDateString()}
                                </span>
                              </div>
                              <p className={`text-sm font-bold uppercase tracking-wider leading-relaxed ${n.read ? 'text-gray-500' : 'text-black'}`}>
                                {n.message}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-20 border-4 border-black border-dashed">
                             <span className="material-symbols-outlined text-[64px] text-gray-300 font-bold block mb-6">notifications_off</span>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">NO NEW NOTIFICATIONS.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Profile Tab */}
                  {activeTab === 'profile' && (
                    <div className="max-w-2xl">
                      <h2 className="font-anton text-3xl md:text-4xl text-black mb-4 md:mb-6 uppercase border-b-4 border-black pb-3 md:pb-4">EDIT PROFILE</h2>
                      
                      <form onSubmit={handleUpdateProfile} className="space-y-8 bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2">EMAIL ADDRESS</label>
                          <input
                            type="email"
                            disabled
                            value={currentUser?.email || ''}
                            className="w-full bg-gray-200 border-2 border-gray-300 px-4 py-4 text-sm font-bold text-gray-500 outline-none cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2">USERNAME</label>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-surface-dim border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2">PHONE NUMBER</label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-surface-dim border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                            placeholder="ENTER PHONE NUMBER"
                          />
                        </div>

                        <div className="pt-8 border-t-4 border-black">
                          <h3 className="text-2xl font-anton uppercase text-black mb-6">SHIPPING ADDRESS</h3>
                          
                          <div className="space-y-6">
                            <div>
                              <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2">STREET ADDRESS</label>
                              <input
                                type="text"
                                value={street}
                                onChange={(e) => setStreet(e.target.value)}
                                className="w-full bg-surface-dim border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                                placeholder="ENTER STREET ADDRESS"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                              <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2">CITY</label>
                                <input
                                  type="text"
                                  value={city}
                                  onChange={(e) => setCity(e.target.value)}
                                  className="w-full bg-surface-dim border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                                  placeholder="CITY"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2">STATE</label>
                                <input
                                  type="text"
                                  value={stateName}
                                  onChange={(e) => setStateName(e.target.value)}
                                  className="w-full bg-surface-dim border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                                  placeholder="STATE"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-black block mb-2">ZIP CODE</label>
                                <input
                                  type="text"
                                  value={pincode}
                                  onChange={(e) => setPincode(e.target.value)}
                                  className="w-full bg-surface-dim border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                                  placeholder="ZIP"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-6">
                          <button
                            type="submit"
                            disabled={updatingProfile}
                            className="w-full bg-black text-white py-5 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors cursor-pointer border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] disabled:opacity-50"
                          >
                            {updatingProfile ? 'SAVING...' : 'SAVE CHANGES'}
                          </button>
                        </div>

                      </form>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
