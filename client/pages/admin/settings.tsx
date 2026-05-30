import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { StoreSettings } from '../../types';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import CrateButton from '../../components/CrateButton';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [codEnabled, setCodEnabled] = useState(true);
  const [onlineEnabled, setOnlineEnabled] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'settings', 'global');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as StoreSettings;
        setDeliveryFee(data.deliveryFee || 0);
        setTaxRate(data.taxRate || 0);
        setCodEnabled(data.paymentMethods?.cod ?? true);
        setOnlineEnabled(data.paymentMethods?.online ?? false);
      }
    } catch (e) {
      console.error("Firestore loading error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'settings', 'global');
      const payload: StoreSettings = {
        deliveryFee,
        taxRate,
        paymentMethods: {
          cod: codEnabled,
          online: onlineEnabled
        }
      };
      await setDoc(docRef, payload);
      toast.success("Global store settings updated successfully.");
    } catch (e: any) {
      toast.error(`Settings update failed: ${e.message}`);
    }
  };

  return (
    <>
      <Head>
        <title>STORE CONFIG // SYSTEM ROOT</title>
      </Head>

      <div className="space-y-6">
        
        <div className="mb-margin-safe border-b-4 border-concrete-gray pb-unit flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-headline-lg font-anton uppercase text-on-surface">STORE CONFIG // GLOBAL SETTINGS</h2>
            <p className="text-label-mono font-mono text-xs text-danger-red mt-1">SECURITY ACCESS: ADMIN CRUD OVERRIDE</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-on-surface-variant animate-pulse uppercase">
            SYNCHRONIZING CONFIGURATION DATA...
          </div>
        ) : (
          <div className="max-w-2xl bg-surface-container border-4 border-concrete-gray p-6 md:p-10 shadow-hard">
            <form onSubmit={handleSave} className="space-y-8 font-mono">
              
              {/* Financials */}
              <div className="space-y-6">
                <h3 className="font-anton text-2xl uppercase text-secondary border-b-2 border-concrete-gray pb-2">FINANCIAL RULES</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant block mb-2 uppercase tracking-widest">FLAT DELIVERY FEE ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                      className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-sm font-bold text-on-surface rounded-none outline-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-on-surface-variant block mb-2 uppercase tracking-widest">TAX RATE PERCENTAGE (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-sm font-bold text-on-surface rounded-none outline-none focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-6 pt-6 border-t-2 border-dashed border-concrete-gray">
                <h3 className="font-anton text-2xl uppercase text-secondary border-b-2 border-concrete-gray pb-2">PAYMENT GATEWAYS</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-4 p-4 border-2 border-concrete-gray cursor-pointer hover:bg-surface-container-high transition-colors">
                    <input 
                      type="checkbox" 
                      checked={codEnabled} 
                      onChange={(e) => setCodEnabled(e.target.checked)}
                      className="w-5 h-5 border-2 border-concrete-gray checked:bg-black focus:ring-0"
                    />
                    <div>
                      <span className="font-bold text-sm uppercase block text-on-surface">CASH ON DELIVERY (COD)</span>
                      <span className="text-[10px] text-on-surface-variant block mt-1 uppercase tracking-widest">Allow customers to pay upon receiving the package.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-4 p-4 border-2 border-concrete-gray cursor-pointer hover:bg-surface-container-high transition-colors">
                    <input 
                      type="checkbox" 
                      checked={onlineEnabled} 
                      onChange={(e) => setOnlineEnabled(e.target.checked)}
                      className="w-5 h-5 border-2 border-concrete-gray checked:bg-black focus:ring-0"
                    />
                    <div>
                      <span className="font-bold text-sm uppercase block text-on-surface">ONLINE PAYMENTS</span>
                      <span className="text-[10px] text-on-surface-variant block mt-1 uppercase tracking-widest">Enable digital payment processing (e.g. Credit Card, PayPal).</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-8 border-t-4 border-concrete-gray">
                <CrateButton type="submit" variant="primary" className="w-full py-4 text-sm tracking-widest">
                  COMMIT SYSTEM CONFIGURATION
                </CrateButton>
              </div>

            </form>
          </div>
        )}

      </div>
    </>
  );
}

AdminSettings.getLayout = (page: React.ReactElement) => <AdminLayout>{page}</AdminLayout>;
