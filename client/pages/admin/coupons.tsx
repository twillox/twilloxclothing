import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Coupon } from '../../types';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import CrateButton from '../../components/CrateButton';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState(0);
  const [minPurchase, setMinPurchase] = useState(0);
  const [active, setActive] = useState(true);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      const list: Coupon[] = [];
      snap.forEach((doc) => {
        list.push({ code: doc.id, ...doc.data() } as Coupon);
      });
      setCoupons(list);
    } catch (e) {
      console.error("Firestore loading error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openAddModal = () => {
    setEditCoupon(null);
    setCode('');
    setType('percentage');
    setValue(0);
    setMinPurchase(0);
    setActive(true);
    setShowModal(true);
  };

  const openEditModal = (coup: Coupon) => {
    setEditCoupon(coup);
    setCode(coup.code);
    setType(coup.type);
    setValue(coup.value);
    setMinPurchase(coup.minPurchase);
    setActive(coup.active);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || value <= 0) {
      toast.warning("Fields missing: Complete coupon credentials.");
      return;
    }

    const docPayload = {
      type,
      value: Number(value),
      minPurchase: Number(minPurchase),
      active,
      createdAt: editCoupon ? editCoupon.createdAt : Timestamp.now()
    };

    try {
      const docRef = doc(db, 'coupons', code.trim().toUpperCase());
      await setDoc(docRef, docPayload);

      toast.success(`Coupon authenticated & synced successfully: ${code}.`);
      setShowModal(false);
      await fetchCoupons();
    } catch (e: any) {
      toast.error(`Transaction compile failed: ${e.message}`);
    }
  };

  const handleDelete = async (coupCode: string) => {
    const confirm = window.confirm(`FORCE PURGE VOUCHER: Delete code "${coupCode}"? Active checkouts will no longer authenticate this segment.`);
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'coupons', coupCode));
      toast.success("Coupon voucher successfully purged from database.");
      await fetchCoupons();
    } catch (e: any) {
      toast.error(`Purging failed: ${e.message}`);
    }
  };

  return (
    <>
      <Head>
        <title>VOUCHERS COMMAND // SYSTEM ROOT</title>
      </Head>

      <div className="space-y-6">
        
        {/* Header */}
        <div className="mb-margin-safe border-b-4 border-concrete-gray pb-unit flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-headline-lg font-anton uppercase text-on-surface">VOUCHERS COMMAND // SYSTEM REDUCTIONS</h2>
            <p className="text-label-mono font-mono text-xs text-danger-red mt-1">SECURITY ACCESS: ADMIN CRUD OVERRIDE</p>
          </div>
          <CrateButton onClick={openAddModal} variant="primary" className="py-2 px-6 text-xs shrink-0 select-none">
            ADD_NEW_VOUCHER
          </CrateButton>
        </div>

        {/* Coupons Table list */}
        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-on-surface-variant animate-pulse uppercase">
            RESOLVING PROMOTIONAL STACKS...
          </div>
        ) : coupons.length > 0 ? (
          <div className="border-2 border-concrete-gray bg-surface-container overflow-x-auto relative">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-matte-black border-b-2 border-concrete-gray text-secondary select-none">
                  <th className="p-3">VOUCHER CODE</th>
                  <th className="p-3">TYPE</th>
                  <th className="p-3">REDUCTION VALUE</th>
                  <th className="p-3">MINIMUM PURCHASE SEG</th>
                  <th className="p-3">STATE</th>
                  <th className="p-3 text-right">COMMANDS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete-gray bg-surface-container">
                {coupons.map((c) => (
                  <tr key={c.code} className="hover:bg-surface-container-high transition-colors">
                    <td className="p-3 font-bold text-secondary uppercase">
                      {c.code}
                    </td>
                    <td className="p-3 uppercase text-on-surface">
                      {c.type}
                    </td>
                    <td className="p-3 font-bold text-on-surface">
                      {c.type === 'percentage' ? `${c.value}%` : `$${c.value}`}
                    </td>
                    <td className="p-3 font-bold text-on-surface-variant">
                      ${c.minPurchase}
                    </td>
                    <td className="p-3">
                      <span className={`font-bold px-1.5 py-0.5 border text-[10px] leading-none uppercase ${
                        c.active ? 'bg-secondary text-matte-black border-matte-black' : 'bg-surface-container-high text-on-surface-variant/40 border-concrete-gray'
                      }`}>
                        {c.active ? 'ACTIVE' : 'EXPIRED'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-3 shrink-0">
                      <button
                        onClick={() => openEditModal(c)}
                        className="text-secondary hover:text-warning-yellow-dark font-bold font-mono"
                      >
                        [EDIT]
                      </button>
                      <button
                        onClick={() => handleDelete(c.code)}
                        className="text-danger-red hover:text-red-700 font-bold font-mono"
                      >
                        [PURGE]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-4 border-dashed border-outline-variant p-20 text-center bg-surface-container max-w-xl mx-auto">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 block mb-4">confirmation_number</span>
            <h3 className="font-anton text-headline-lg uppercase text-on-surface mb-2">NO DISCOUNTS ACTIVE</h3>
            <p className="font-mono text-xs text-on-surface-variant leading-relaxed max-w-sm mx-auto mb-8">
              No promotional voucher reduction systems registered in active database.
            </p>
            <CrateButton onClick={openAddModal} variant="primary" className="mx-auto text-xs py-2 px-8">
              ADD_NEW_VOUCHER
            </CrateButton>
          </div>
        )}

        {/* Dynamic Modal Overlay */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-matte-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-md bg-surface-container-high border-4 border-concrete-gray p-margin-safe relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] my-10">
              
              <div className="flex justify-between items-start border-b border-concrete-gray pb-3 mb-6">
                <div>
                  <h3 className="font-anton text-headline-md uppercase text-secondary">
                    {editCoupon ? `EDIT_VOUCHER: ${editCoupon.code}` : 'CREATE_NEW_VOUCHER'}
                  </h3>
                  <p className="text-label-mono font-mono text-[9px] text-on-surface-variant tracking-wider uppercase mt-1">
                    Firestore promo coupon voucher setup compiler
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-on-surface-variant hover:text-danger-red font-mono text-sm uppercase px-1 border border-concrete-gray"
                >
                  [CLOSE]
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                
                <div>
                  <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">VOUCHER CODE (UPPERCASE STENCIL)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editCoupon}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                    className="w-full bg-surface disabled:bg-background/50 border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                    placeholder="e.g. SECURE20..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">MULTIPLIER TYPE</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
                      className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none"
                    >
                      <option value="percentage">PERCENTAGE (%)</option>
                      <option value="fixed">FIXED VALUE ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">REDUCTION VALUE</label>
                    <input
                      type="number"
                      required
                      value={value || ''}
                      onChange={(e) => setValue(Number(e.target.value))}
                      className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                      placeholder="e.g. 20 or 50..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">MINIMUM DROPS COST (USD)</label>
                  <input
                    type="number"
                    required
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(Number(e.target.value))}
                    className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none font-mono text-xs">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => setActive(!active)}
                      className="w-4 h-4 rounded-none accent-warning-yellow border-concrete-gray cursor-pointer"
                    />
                    <span className={active ? 'text-secondary font-bold font-mono' : 'text-on-surface-variant font-mono'}>
                      VOUCHER NODE ACTIVE STATUS
                    </span>
                  </label>
                </div>

                <div className="pt-4 border-t border-dashed border-concrete-gray">
                  <CrateButton
                    type="submit"
                    className="w-full py-3 text-xs font-mono tracking-normal leading-none font-bold"
                  >
                    {editCoupon ? 'COMMIT_VOUCHER_SYNCS' : 'COMPILE_VOUCHER'}
                  </CrateButton>
                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </>
  );
}

AdminCoupons.getLayout = (page: React.ReactElement) => <AdminLayout>{page}</AdminLayout>;
