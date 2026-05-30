import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { seedDatabase } from '../../utils/seed';
import { Order, Product, UserProfile } from '../../types';
import AdminLayout from '../../components/AdminLayout';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all orders
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const ordersList: Order[] = [];
      ordersSnap.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(ordersList);

      // 2. Fetch 5 most recent orders
      const recentSnap = await getDocs(
        query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5))
      );
      const recentList: Order[] = [];
      recentSnap.forEach((doc) => {
        recentList.push({ id: doc.id, ...doc.data() } as Order);
      });
      setRecentOrders(recentList);

      // 3. Fetch total products count
      const prodSnap = await getDocs(collection(db, 'products'));
      setTotalProducts(prodSnap.size);

      // 4. Fetch total customers count
      const usersSnap = await getDocs(collection(db, 'users'));
      let custCount = 0;
      usersSnap.forEach((doc) => {
        const u = doc.data() as UserProfile;
        if (u.role === 'customer') custCount++;
      });
      setTotalCustomers(custCount);

    } catch (e) {
      console.error("Error loading admin diagnostics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Compute Metrics
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((acc, o) => {
    if (o.status !== 'Cancelled') return acc + o.total;
    return acc;
  }, 0);

  // Group orders by status for chart/diagnostic representation
  const statusCounts = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, { Pending: 0, Confirmed: 0, Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 });

  if (loading) {
    return (
      <div className="text-center py-20 font-mono text-xs text-on-surface-variant animate-pulse uppercase">
        RESOLVING DATABASE NODES ANALYTICS...
      </div>
    );
  }

  const handleSeedDatabase = async () => {
    if (confirm("Are you sure you want to seed the luxury products database? This will overwrite categories, products, coupons, and banners.")) {
      setLoading(true);
      try {
        await seedDatabase();
        alert("Database seeded successfully!");
        await fetchAnalyticsData();
      } catch (err) {
        console.error("Failed to seed:", err);
        alert("Seed failed. Check console.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Head>
        <title>ANALYTICS DECK // SYSTEM ROOT</title>
      </Head>

      <div className="space-y-6">
        
        {/* Section Header */}
        <div className="mb-margin-safe border-b-4 border-concrete-gray pb-unit flex justify-between items-end">
          <div>
            <h2 className="text-headline-lg font-anton uppercase text-on-surface">ANALYTICS COMMAND DECK</h2>
            <p className="text-label-mono font-mono text-xs text-danger-red mt-1">SECURITY ACCESS: ROOT ENVELOPE HIGH</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSeedDatabase}
              className="px-3 py-1 bg-danger-red text-white text-xs font-mono font-bold hover:bg-red-700 transition-colors cursor-pointer border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              TRIGGER_SEED_SEQUENCE
            </button>
            <span className="text-label-mono font-mono text-on-surface-variant text-[10px] hidden sm:block uppercase">REAL-TIME TELEMETRY</span>
          </div>
        </div>

        {/* Statistic Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {[
            { label: 'TOTAL_REVENUE', value: `$${totalRevenue.toLocaleString()}`, color: 'text-warning-yellow', border: 'border-warning-yellow' },
            { label: 'DISPATCH_COMPLETED (ORDERS)', value: totalOrders, color: 'text-on-surface', border: 'border-concrete-gray' },
            { label: 'REGISTERED_OPERATORS (CUSTOMERS)', value: totalCustomers, color: 'text-on-surface', border: 'border-concrete-gray' },
            { label: 'INVENTORY_CATALOG (PRODUCTS)', value: totalProducts, color: 'text-on-surface', border: 'border-concrete-gray' }
          ].map((stat, idx) => (
            <div 
              key={stat.label} 
              className={`bg-surface-container border-2 ${stat.border} p-5 relative shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between h-32`}
            >
              <span className="text-label-mono font-mono text-[9px] text-on-surface-variant tracking-wider uppercase">
                {stat.label}
              </span>
              <span className={`text-headline-lg font-anton leading-none ${stat.color} mt-4 block select-none`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Diagnostic Status Charts & Recent Orders Bento Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          
          {/* Status distribution charts - col span 5 */}
          <div className="lg:col-span-5 bg-surface-container border-2 border-concrete-gray p-margin-safe relative">
            <h3 className="font-anton text-headline-md uppercase text-on-surface border-b border-concrete-gray pb-2 mb-4">LOGISTICS_DISTRIBUTION</h3>
            
            <div className="space-y-4 font-mono text-xs">
              {Object.entries(statusCounts).map(([status, count]) => {
                const percent = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-on-surface">{status.toUpperCase()}</span>
                      <span className="text-on-surface-variant text-[10px]">{count} LOGS ({percent.toFixed(0)}%)</span>
                    </div>
                    {/* Brutalist SVG line bar */}
                    <div className="h-4 bg-background border border-concrete-gray relative overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          status === 'Cancelled' ? 'bg-danger-red' :
                          status === 'Delivered' ? 'bg-green-600' : 'bg-warning-yellow'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Orders activity stream - col span 7 */}
          <div className="lg:col-span-7 bg-surface-container border-2 border-concrete-gray p-margin-safe relative flex flex-col justify-between">
            <div>
              <h3 className="font-anton text-headline-md uppercase text-secondary border-b border-concrete-gray pb-2 mb-4">RECENT_ACTIVITY_STREAM</h3>
              
              {recentOrders.length > 0 ? (
                <div className="divide-y divide-concrete-gray border border-concrete-gray bg-background">
                  {recentOrders.map((o) => (
                    <div key={o.id} className="p-3 flex items-center justify-between gap-4 font-mono text-xs">
                      <div className="truncate">
                        <span className="font-bold text-on-surface uppercase truncate block">ORDER: {o.id.substring(0, 10).toUpperCase()}...</span>
                        <span className="text-[9px] text-on-surface-variant block uppercase mt-0.5">
                          CLIENT: {o.customerName.toUpperCase()} // STATUS: <strong className="text-secondary">{o.status}</strong>
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-on-surface block font-mono">${o.total}</span>
                        <span className="text-[8px] text-on-surface-variant block font-mono">{o.createdAt.toDate().toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-outline-variant p-8 text-center text-on-surface-variant font-mono text-xs bg-background">
                  NO ACTIVE TRANSACTION FLOW STREAM DETECTED.
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-dashed border-concrete-gray text-right">
              <Link href="/admin/orders">
                <button className="text-xs font-mono text-secondary hover:text-warning-yellow uppercase font-bold select-none cursor-pointer">
                  VIEW_ALL_SHIPMENT_MANIFISTS →
                </button>
              </Link>
            </div>
          </div>

        </div>

      </div>
    </>
  );
}

AdminDashboard.getLayout = (page: React.ReactElement) => <AdminLayout>{page}</AdminLayout>;
