import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc,
  Timestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Order } from '../../types';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import CrateButton from '../../components/CrateButton';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const { toast } = useToast();

  // Inspect detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersSnap = await getDocs(
        query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      );
      const ordersList: Order[] = [];
      ordersSnap.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(ordersList);
      setFilteredOrders(ordersList);
    } catch (e) {
      console.error("Firestore loading error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter Logic
  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((o) => o.status === statusFilter));
    }
  }, [orders, statusFilter]);

  const orderStatuses: Order['status'][] = [
    'Pending', 
    'Confirmed', 
    'Processing', 
    'Packed', 
    'Shipped', 
    'Delivered', 
    'Cancelled'
  ];

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    setUpdating(true);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });

      // Update state
      setOrders((prev) => 
        prev.map((o) => o.id === orderId ? { ...o, status: newStatus, updatedAt: Timestamp.now() } : o)
      );
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus, updatedAt: Timestamp.now() } : null);
      }

      // Dispatch dynamic notification log to customer
      const targetOrder = orders.find(o => o.id === orderId);
      if (targetOrder && targetOrder.customerId !== 'guest-session') {
        await addDoc(collection(db, 'notifications'), {
          userId: targetOrder.customerId,
          title: `SHIPMENT UPDATE: ${newStatus.toUpperCase()}`,
          message: `Your acquisition manifest ${orderId.substring(0, 10).toUpperCase()} has been advanced to: ${newStatus}.`,
          type: 'order_update',
          read: false,
          createdAt: Timestamp.now()
        });
      }

      toast.success(`Shipment advanced successfully: ${newStatus}.`);
    } catch (e: any) {
      toast.error(`Logistics update failure: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Head>
        <title>LOGISTICS CONTROL // SYSTEM ROOT</title>
      </Head>

      <div className="space-y-6">
        
        {/* Header */}
        <div className="mb-margin-safe border-b-4 border-concrete-gray pb-unit flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-headline-lg font-anton uppercase text-on-surface">SHIPMENT COMMAND // COURIER LOGISTICS</h2>
            <p className="text-label-mono font-mono text-xs text-danger-red mt-1">SECURITY ACCESS: ADMIN STATUS OVERRIDE</p>
          </div>
          
          {/* Status Filter deck */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full font-mono text-[10px]">
            {['ALL', ...orderStatuses].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 border font-bold uppercase select-none ${
                  statusFilter === status
                    ? 'bg-danger-red text-dirty-white border-matte-black font-black'
                    : 'bg-surface-container text-on-surface border-concrete-gray hover:border-outline'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table manifest list */}
        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-on-surface-variant animate-pulse uppercase">
            RESOLVING COURIER SHIFT LOGS...
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="border-2 border-concrete-gray bg-surface-container overflow-x-auto relative">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-matte-black border-b-2 border-concrete-gray text-secondary select-none">
                  <th className="p-3">MANIFEST ID</th>
                  <th className="p-3">CLIENT INFO</th>
                  <th className="p-3">TIMESTAMP</th>
                  <th className="p-3">ITEMS</th>
                  <th className="p-3">TOTAL</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3 text-right">COMMANDS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete-gray bg-surface-container">
                {filteredOrders.map((o) => {
                  const itemsCount = o.items.reduce((acc, item) => acc + item.quantity, 0);
                  const isCancelled = o.status === 'Cancelled';
                  
                  return (
                    <tr key={o.id} className="hover:bg-surface-container-high transition-colors">
                      <td className="p-3 font-bold text-secondary uppercase truncate max-w-[120px]" title={o.id}>
                        {o.id.substring(0, 12).toUpperCase()}
                      </td>
                      <td className="p-3 text-xs leading-relaxed max-w-[180px] truncate">
                        <span className="font-bold text-on-surface block uppercase">{o.customerName}</span>
                        <span className="text-[10px] text-on-surface-variant/70 block truncate">{o.customerEmail}</span>
                      </td>
                      <td className="p-3 text-[10px] text-on-surface-variant">
                        {o.createdAt.toDate().toLocaleDateString()} {o.createdAt.toDate().toLocaleTimeString()}
                      </td>
                      <td className="p-3 font-bold text-on-surface">
                        {itemsCount} ARTICLES
                      </td>
                      <td className="p-3 font-bold text-on-surface font-mono">
                        ${o.total}
                      </td>
                      <td className={`p-3 font-black uppercase ${
                        isCancelled ? 'text-danger-red' : 'text-warning-yellow'
                      }`}>
                        {o.status}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="text-secondary hover:text-warning-yellow-dark font-bold font-mono"
                        >
                          [INSPECT_MANIFEST]
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-4 border-dashed border-outline-variant p-20 text-center bg-surface-container max-w-xl mx-auto">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 block mb-4">local_shipping</span>
            <h3 className="font-anton text-headline-lg uppercase text-on-surface mb-2">NO DISPATCH MANIFESTS</h3>
            <p className="font-mono text-xs text-on-surface-variant leading-relaxed max-w-sm mx-auto">
              No orders registered matching the active status filter segments in the database stack.
            </p>
          </div>
        )}

        {/* Detailed Manifest inspector modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-matte-black/85 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl bg-surface-container-high border-4 border-concrete-gray p-margin-safe relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] my-10 max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-start border-b border-concrete-gray pb-3 mb-6">
                <div>
                  <h3 className="font-anton text-headline-md uppercase text-secondary">
                    INSPECT_MANIFEST: {selectedOrder.id.toUpperCase()}
                  </h3>
                  <p className="text-label-mono font-mono text-[9px] text-on-surface-variant tracking-wider uppercase mt-1">
                    Courier logistics delivery diagnostic log
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-on-surface-variant hover:text-danger-red font-mono text-sm uppercase px-1 border border-concrete-gray"
                >
                  [CLOSE]
                </button>
              </div>

              <div className="space-y-6 font-mono text-xs">
                
                {/* Status Command controls */}
                <div className="bg-background border border-concrete-gray p-4">
                  <span className="text-[9px] text-danger-red font-bold block mb-3 uppercase tracking-wider">COURIER DISPATCH CONTROL OVERRIDE</span>
                  <div className="flex flex-wrap gap-2">
                    {orderStatuses.map((st) => {
                      const active = selectedOrder.status === st;
                      return (
                        <button
                          key={st}
                          disabled={updating || active}
                          onClick={() => handleUpdateStatus(selectedOrder.id, st)}
                          className={`px-3 py-1.5 border font-bold uppercase select-none transition-all text-[10px] ${
                            active
                              ? 'bg-secondary text-matte-black border-matte-black cursor-not-allowed shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                              : 'bg-surface hover:bg-surface-container-highest text-on-surface border-concrete-gray hover:text-warning-yellow disabled:opacity-40'
                          }`}
                        >
                          {st.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Client & Dispatch Terminals Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y-2 border-concrete-gray py-4">
                  <div className="space-y-2">
                    <span className="text-[9px] text-on-surface-variant block uppercase font-bold">RECIPIENT OPERATOR</span>
                    <p className="font-bold text-on-surface uppercase text-sm leading-tight">{selectedOrder.customerName}</p>
                    <p className="text-on-surface-variant text-[10px] truncate">{selectedOrder.customerEmail}</p>
                    <p className="text-on-surface-variant text-[10px]">PHONE: {selectedOrder.phone}</p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] text-on-surface-variant block uppercase font-bold">DISPATCH SHIPPING TERMINAL</span>
                    <p className="text-on-surface leading-relaxed uppercase">
                      {selectedOrder.shippingAddress.address}<br />
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}<br />
                      PIN: {selectedOrder.shippingAddress.pincode}
                    </p>
                  </div>
                </div>

                {/* Item List */}
                <div>
                  <span className="text-[9px] text-on-surface-variant block uppercase font-bold mb-3">MANIFEST LOADOUT CONTENTS</span>
                  <div className="divide-y divide-concrete-gray bg-background border border-concrete-gray">
                    {selectedOrder.items.map((item) => (
                      <div key={`${item.productId}-${item.size}-${item.color}`} className="p-3 flex items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-10 h-10 border border-concrete-gray overflow-hidden shrink-0">
                            <img alt={item.name} src={item.imageUrl} className="w-full h-full object-cover" />
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-on-surface uppercase truncate block">{item.name}</span>
                            <span className="text-[9px] text-on-surface-variant block uppercase mt-0.5">
                              SZ: {item.size} // CLR: {item.color} // QTY: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <span className="font-bold text-secondary">${item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing tallies */}
                <div className="border-t border-dashed border-concrete-gray pt-4 space-y-2 text-right">
                  <p className="text-on-surface-variant">SUBTOTAL COST: <strong className="text-on-surface">${selectedOrder.subtotal}</strong></p>
                  {selectedOrder.couponCode && (
                    <p className="text-warning-yellow font-bold">VOUCHER DISCOUNT ({selectedOrder.couponCode}): -${selectedOrder.discount}</p>
                  )}
                  <p className="text-headline-md font-anton text-on-surface">TOTAL DISPATCH CHARGE: ${selectedOrder.total}</p>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}

AdminOrders.getLayout = (page: React.ReactElement) => <AdminLayout>{page}</AdminLayout>;
