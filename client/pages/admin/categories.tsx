import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Category } from '../../types';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import CrateButton from '../../components/CrateButton';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const catSnap = await getDocs(collection(db, 'categories'));
      const catList: Category[] = [];
      catSnap.forEach((doc) => {
        catList.push(doc.data() as Category);
      });
      setCategories(catList);
    } catch (e) {
      console.error("Firestore loading error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (cat: Category) => {
    setEditCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setShowModal(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editCategory) {
      // Auto-generate slug from name in add mode
      setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !description) {
      toast.warning("Fields missing: Complete category credentials.");
      return;
    }

    const docPayload = {
      name,
      slug: slug.trim().toLowerCase(),
      description,
      createdAt: editCategory ? editCategory.createdAt : Timestamp.now()
    };

    try {
      // Write/Edit to Firestore
      const docRef = doc(db, 'categories', docPayload.slug);
      await setDoc(docRef, docPayload);

      toast.success(`Category zone synced successfully: ${name}.`);
      setShowModal(false);
      await fetchData();
    } catch (e: any) {
      toast.error(`Transaction compile failed: ${e.message}`);
    }
  };

  const handleDelete = async (catSlug: string, catName: string) => {
    const confirm = window.confirm(`FORCE DELETE TRIGGER: Purge category zone "${catName}"? This action resets product mapping indices.`);
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'categories', catSlug));
      toast.success("Category zone successfully purged from database.");
      await fetchData();
    } catch (e: any) {
      toast.error(`Purging failed: ${e.message}`);
    }
  };

  return (
    <>
      <Head>
        <title>ZONES COMMAND // SYSTEM ROOT</title>
      </Head>

      <div className="space-y-6">
        
        {/* Header */}
        <div className="mb-margin-safe border-b-4 border-concrete-gray pb-unit flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-headline-lg font-anton uppercase text-on-surface">ZONES CONTROL // CATEGORY SPECIFICATIONS</h2>
            <p className="text-label-mono font-mono text-xs text-danger-red mt-1">SECURITY ACCESS: ADMIN CRUD OVERRIDE</p>
          </div>
          <CrateButton onClick={openAddModal} variant="primary" className="py-2 px-6 text-xs shrink-0 select-none">
            ADD_NEW_ZONE
          </CrateButton>
        </div>

        {/* Categories Table list */}
        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-on-surface-variant animate-pulse uppercase">
            SYNCHRONIZING ZONES DATA STREAM...
          </div>
        ) : categories.length > 0 ? (
          <div className="border-2 border-concrete-gray bg-surface-container overflow-x-auto relative">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-matte-black border-b-2 border-concrete-gray text-secondary select-none">
                  <th className="p-3">ZONE SLUG</th>
                  <th className="p-3">EDITORIAL NAME</th>
                  <th className="p-3">DESCRIPTION SPECIFICATIONS</th>
                  <th className="p-3 text-right">COMMANDS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete-gray bg-surface-container">
                {categories.map((c) => (
                  <tr key={c.slug} className="hover:bg-surface-container-high transition-colors">
                    <td className="p-3 font-bold text-secondary">
                      {c.slug.toUpperCase()}
                    </td>
                    <td className="p-3 font-bold uppercase text-on-surface">
                      {c.name}
                    </td>
                    <td className="p-3 text-on-surface-variant text-sm pr-12 leading-relaxed max-w-sm truncate" title={c.description}>
                      {c.description}
                    </td>
                    <td className="p-3 text-right space-x-3 shrink-0">
                      <button
                        onClick={() => openEditModal(c)}
                        className="text-secondary hover:text-warning-yellow-dark font-bold font-mono"
                      >
                        [EDIT]
                      </button>
                      <button
                        onClick={() => handleDelete(c.slug, c.name)}
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
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 block mb-4">warehouse</span>
            <h3 className="font-anton text-headline-lg uppercase text-on-surface mb-2">CATEGORY ZONES EMPTY</h3>
            <p className="font-mono text-xs text-on-surface-variant leading-relaxed max-w-sm mx-auto mb-8">
              No category zone segments registered in active database. Launch seed scripts or create custom zones.
            </p>
            <CrateButton onClick={openAddModal} variant="primary" className="mx-auto text-xs py-2 px-8">
              ADD_NEW_ZONE
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
                    {editCategory ? `EDIT_ZONE: ${editCategory.name}` : 'CREATE_NEW_ZONE_NODE'}
                  </h3>
                  <p className="text-label-mono font-mono text-[9px] text-on-surface-variant tracking-wider uppercase mt-1">
                    Firestore category database segment compiler
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
                  <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">ZONE NAME (EDITORIAL)</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                    placeholder="e.g. OUTERWEAR..."
                  />
                </div>

                <div>
                  <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">ZONE SLUG (ROUTING KEY)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editCategory}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-surface disabled:bg-background/50 border-2 border-concrete-gray disabled:cursor-not-allowed focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                    placeholder="e.g. outerwear..."
                  />
                </div>

                <div>
                  <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">ZONE DESCRIPTION SPECIFICATION</label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0 placeholder:text-on-surface-variant/40"
                    placeholder="ENTER ZONE DETAILS..."
                  />
                </div>

                <div className="pt-4 border-t border-dashed border-concrete-gray">
                  <CrateButton
                    type="submit"
                    className="w-full py-3 text-xs font-mono tracking-normal leading-none font-bold"
                  >
                    {editCategory ? 'COMMIT_ZONE_SYNCS' : 'COMPILE_NEW_ZONE'}
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

AdminCategories.getLayout = (page: React.ReactElement) => <AdminLayout>{page}</AdminLayout>;
