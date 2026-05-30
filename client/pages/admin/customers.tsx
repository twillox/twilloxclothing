import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { UserProfile, Order } from '../../types';
import AdminLayout from '../../components/AdminLayout';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected customer transaction drawer states
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(
        query(collection(db, 'users'), orderBy('createdAt', 'desc'))
      );
      const custList: UserProfile[] = [];
      usersSnap.forEach((doc) => {
        const u = doc.data() as UserProfile;
        if (u.role === 'customer') {
          custList.push({ ...u, uid: doc.id } as UserProfile);
        }
      });
      setCustomers(custList);
      setFilteredCustomers(custList);
    } catch (e) {
      console.error("Firestore loading error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter Logic
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.displayName.toLowerCase().includes(term) ||
            c.email.toLowerCase().includes(term) ||
            c.uid.toLowerCase().includes(term)
        )
      );
    }
  }, [customers, searchTerm]);

  const handleInspectCustomer = async (cust: UserProfile) => {
    setSelectedCustomer(cust);
    setLoadingOrders(true);
    try {
      // Query customer orders ordered by date
      const ordersSnap = await getDocs(
        query(
          collection(db, 'orders'),
          where('customerId', '==', cust.uid),
          orderBy('createdAt', 'desc')
        )
      );
      const ordersList: Order[] = [];
      ordersSnap.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() } as Order);
      });
      setCustomerOrders(ordersList);
    } catch (e) {
      console.error("Error loading user transactions:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <>
      <Head>
        <title>CLIENT ROSTER // SYSTEM ROOT</title>
      </Head>

      <div className="space-y-6">
        
        {/* Header */}
        <div className="mb-margin-safe border-b-4 border-concrete-gray pb-unit flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-headline-lg font-anton uppercase text-on-surface">CLIENTS COMMAND // ACTIVE OPERATORS</h2>
            <p className="text-label-mono font-mono text-xs text-danger-red mt-1">SECURITY ACCESS: ADMIN ROSTER VISITOR</p>
          </div>
          
          {/* Search bar */}
          <input
            type="text"
            placeholder="SEARCH CLIENT KEYWORDS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 bg-surface border-2 border-concrete-gray focus:border-danger-red p-2.5 text-xs font-mono text-on-surface rounded-none outline-none focus:ring-0"
          />
        </div>

        {/* Customers Table list */}
        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-on-surface-variant animate-pulse uppercase">
            RESOLVING SUBSCRIBERS SECURITY STACKS...
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="border-2 border-concrete-gray bg-surface-container overflow-x-auto relative">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-matte-black border-b-2 border-concrete-gray text-secondary select-none">
                  <th className="p-3">OPERATOR UID</th>
                  <th className="p-3">DISPLAY NAME</th>
                  <th className="p-3">EMAIL SECURE ROUTE</th>
                  <th className="p-3">REGISTRATION TIMESTAMP</th>
                  <th className="p-3 text-right">COMMANDS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete-gray bg-surface-container">
                {filteredCustomers.map((c) => (
                  <tr key={c.uid} className="hover:bg-surface-container-high transition-colors">
                    <td className="p-3 font-bold text-on-surface-variant uppercase truncate max-w-[120px]" title={c.uid}>
                      {c.uid.toUpperCase()}
                    </td>
                    <td className="p-3 font-bold uppercase text-on-surface">
                      {c.displayName}
                    </td>
                    <td className="p-3 text-secondary truncate max-w-[180px]">
                      {c.email}
                    </td>
                    <td className="p-3 text-on-surface-variant text-[10px]">
                      {c.createdAt ? c.createdAt.toDate().toLocaleDateString() : 'N/A'} {c.createdAt ? c.createdAt.toDate().toLocaleTimeString() : ''}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleInspectCustomer(c)}
                        className="text-secondary hover:text-warning-yellow-dark font-bold font-mono"
                      >
                        [INSPECT_CLIENT_HISTORY]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-dashed border-outline-variant p-16 text-center font-mono text-xs text-on-surface-variant bg-surface-container">
            NO ACTIVE OPERATORS CORRESPONDING TO KEYWORDS FOUND.
          </div>
        )}

        {/* Selected Customer transaction history drawer */}
        {selectedCustomer && (
          <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-md bg-surface-container-high border-l-4 border-concrete-gray p-margin-safe relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between h-screen overflow-y-auto">
            
            <div>
              <div className="flex justify-between items-start border-b border-concrete-gray pb-3 mb-6">
                <div>
                  <h3 className="font-anton text-headline-md uppercase text-secondary">
                    INSPECT_CLIENT: {selectedCustomer.displayName.toUpperCase()}
                  </h3>
                  <p className="text-label-mono font-mono text-[9px] text-on-surface-variant tracking-wider uppercase mt-1">
                    Client transaction & shipping manifest history logs
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-on-surface-variant hover:text-danger-red font-mono text-sm uppercase px-1 border border-concrete-gray"
                >
                  [CLOSE]
                </button>
              </div>

              {/* Secure Details summary */}
              <div className="space-y-4 font-mono text-xs mb-6">
                <div className="bg-background border border-concrete-gray p-3 space-y-1">
                  <p className="text-on-surface-variant uppercase text-[10px]">CLIENT SECURE REGISTRY</p>
                  <p><strong className="text-on-surface">EMAIL:</strong> {selectedCustomer.email}</p>
                  <p><strong className="text-on-surface">CONTACT PHONE:</strong> {selectedCustomer.phone || 'UNSPECIFIED'}</p>
                  {selectedCustomer.address ? (
                    <p>
                      <strong className="text-on-surface block mt-1">SHIPPING PORT ADDRESS:</strong>
                      <span className="text-on-surface-variant">
                        {selectedCustomer.address.street}, {selectedCustomer.address.city}, {selectedCustomer.address.state} - PIN: {selectedCustomer.address.pincode}
                      </span>
                    </p>
                  ) : (
                    <p><strong className="text-on-surface">SHIPPING PORT ADDRESS:</strong> UNSPECIFIED</p>
                  )}
                </div>

                {/* Orders History list */}
                <div>
                  <span className="text-[9px] text-on-surface-variant block uppercase font-bold mb-3">CLIENT TRANSACTION FLOW</span>
                  
                  {loadingOrders ? (
                    <p className="text-center py-4 animate-pulse">QUERYING TRANSACTIONS...</p>
                  ) : customerOrders.length > 0 ? (
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                      {customerOrders.map((o) => (
                        <div key={o.id} className="bg-background border border-concrete-gray p-3 space-y-2">
                          <div className="flex justify-between items-baseline border-b border-dashed border-concrete-gray pb-1.5 font-mono text-[10px]">
                            <strong className="text-secondary uppercase">REF: {o.id.substring(0, 10).toUpperCase()}</strong>
                            <span className="text-on-surface-variant">{o.createdAt.toDate().toLocaleDateString()}</span>
                          </div>
                          
                          {/* Item names */}
                          <div className="text-[10px] text-on-surface-variant space-y-1">
                            {o.items.map((item) => (
                              <p key={`${item.productId}-${item.size}-${item.color}`} className="truncate">
                                • {item.name} x{item.quantity} [SZ: {item.size}]
                              </p>
                            ))}
                          </div>
                          
                          <div className="flex justify-between items-baseline pt-1 font-mono">
                            <span className="text-danger-red uppercase font-bold text-[9px]">{o.status}</span>
                            <span className="font-bold text-on-surface font-mono">${o.total}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-outline-variant p-6 text-center text-on-surface-variant text-[10px]">
                      ZERO ACQUISITIONS DETECTED ON THIS OPERATOR NODE.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Diagnostics tape */}
            <div className="bg-stripes h-4 w-full border-t border-concrete-gray mt-auto"></div>

          </div>
        )}

      </div>
    </>
  );
}

AdminCustomers.getLayout = (page: React.ReactElement) => <AdminLayout>{page}</AdminLayout>;
