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
import { Banner } from '../../types';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import CrateButton from '../../components/CrateButton';

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editBanner, setEditBanner] = useState<Banner | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [type, setType] = useState<'home' | 'collection' | 'promo'>('home');

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'banners'));
      const list: Banner[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Banner);
      });
      setBanners(list);
    } catch (e) {
      console.error("Firestore loading error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openAddModal = () => {
    setEditBanner(null);
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setLink('');
    setType('home');
    setShowModal(true);
  };

  const openEditModal = (ban: Banner) => {
    setEditBanner(ban);
    setTitle(ban.title);
    setSubtitle(ban.subtitle);
    setImageUrl(ban.imageUrl);
    setLink(ban.link);
    setType(ban.type);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl || !link) {
      toast.warning("Fields missing: Complete banner credentials.");
      return;
    }

    const docPayload = {
      title,
      subtitle,
      imageUrl,
      link,
      type,
      createdAt: editBanner ? editBanner.createdAt : Timestamp.now()
    };

    try {
      const bannerId = editBanner ? editBanner.id : `ban-${type}-${Math.floor(Math.random() * 10000)}`;
      const docRef = doc(db, 'banners', bannerId);
      
      await setDoc(docRef, {
        ...docPayload,
        id: bannerId
      });

      toast.success(`Banner synced successfully: ${title}.`);
      setShowModal(false);
      await fetchBanners();
    } catch (e: any) {
      toast.error(`Transaction compile failed: ${e.message}`);
    }
  };

  const handleDelete = async (bannerId: string, bannerTitle: string) => {
    const confirm = window.confirm(`FORCE DELETE BANNER: Purge banner slot "${bannerTitle}"? active slides will automatically unmap.`);
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'banners', bannerId));
      toast.success("Media banner successfully purged from database.");
      await fetchBanners();
    } catch (e: any) {
      toast.error(`Purging failed: ${e.message}`);
    }
  };

  return (
    <>
      <Head>
        <title>SLIDERS COMMAND // SYSTEM ROOT</title>
      </Head>

      <div className="space-y-6">
        
        {/* Header */}
        <div className="mb-margin-safe border-b-4 border-concrete-gray pb-unit flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-headline-lg font-anton uppercase text-on-surface">SLIDERS COMMAND // PROMO HERO SETTINGS</h2>
            <p className="text-label-mono font-mono text-xs text-danger-red mt-1">SECURITY ACCESS: ADMIN CRUD OVERRIDE</p>
          </div>
          <CrateButton onClick={openAddModal} variant="primary" className="py-2 px-6 text-xs shrink-0 select-none">
            ADD_NEW_SLIDE
          </CrateButton>
        </div>

        {/* Banners Table list */}
        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-on-surface-variant animate-pulse uppercase">
            RESOLVING MEDIA CORES...
          </div>
        ) : banners.length > 0 ? (
          <div className="border-2 border-concrete-gray bg-surface-container overflow-x-auto relative">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-matte-black border-b-2 border-concrete-gray text-secondary select-none">
                  <th className="p-3">IMAGE</th>
                  <th className="p-3">SLIDE TITLE</th>
                  <th className="p-3">TYPE</th>
                  <th className="p-3">LINK PATH</th>
                  <th className="p-3 text-right">COMMANDS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-concrete-gray bg-surface-container">
                {banners.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-container-high transition-colors">
                    <td className="p-3">
                      <div className="w-16 h-10 border border-concrete-gray bg-matte-black overflow-hidden select-none">
                        <img alt={b.title} src={b.imageUrl} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="p-3 leading-tight max-w-[200px] truncate uppercase font-bold text-on-surface">
                      <span className="block font-bold">{b.title}</span>
                      <span className="text-[10px] text-on-surface-variant font-normal tracking-wide lowercase truncate block">{b.subtitle}</span>
                    </td>
                    <td className="p-3 uppercase text-secondary font-bold">
                      {b.type}
                    </td>
                    <td className="p-3 font-bold text-on-surface-variant font-mono truncate max-w-[120px]" title={b.link}>
                      {b.link}
                    </td>
                    <td className="p-3 text-right space-x-3 shrink-0">
                      <button
                        onClick={() => openEditModal(b)}
                        className="text-secondary hover:text-warning-yellow-dark font-bold font-mono"
                      >
                        [EDIT]
                      </button>
                      <button
                        onClick={() => handleDelete(b.id, b.title)}
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
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 block mb-4">slideshow</span>
            <h3 className="font-anton text-headline-lg uppercase text-on-surface mb-2">NO BANNER SLIDES ACTIVE</h3>
            <p className="font-mono text-xs text-on-surface-variant leading-relaxed max-w-sm mx-auto mb-8">
              No promotional slider links registered in active database. Banners drive storefront hero visuals.
            </p>
            <CrateButton onClick={openAddModal} variant="primary" className="mx-auto text-xs py-2 px-8">
              ADD_NEW_SLIDE
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
                    {editBanner ? 'EDIT_BANNER_SLIDE' : 'CREATE_NEW_SLIDE'}
                  </h3>
                  <p className="text-label-mono font-mono text-[9px] text-on-surface-variant tracking-wider uppercase mt-1">
                    Firestore banner slider configurations compiler
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
                  <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">SLIDE TITLE</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                    placeholder="e.g. NO RULES. STREET ISSUE 01..."
                  />
                </div>

                <div>
                  <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">SLIDE SUBTITLE</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                    placeholder="e.g. SECURITY CLEARANCE REQUIRED..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">SLIDER TYPE</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'home' | 'collection' | 'promo')}
                      className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none"
                    >
                      <option value="home">HOMEPAGE HERO</option>
                      <option value="collection">COLLECTION BANNER</option>
                      <option value="promo">PROMOTIONAL ACCENT</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">REDIRECTION LINK</label>
                    <input
                      type="text"
                      required
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                      placeholder="e.g. /catalog or /catalog?category=..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">IMAGE URL SLOT</label>
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-surface border-2 border-concrete-gray focus:border-warning-yellow p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0"
                    placeholder="https://example.com/slide-image.jpg"
                  />
                </div>

                <div className="pt-4 border-t border-dashed border-concrete-gray">
                  <CrateButton
                    type="submit"
                    className="w-full py-3 text-xs font-mono tracking-normal leading-none font-bold"
                  >
                    {editBanner ? 'COMMIT_SLIDE_SYNCS' : 'COMPILE_SLIDE'}
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

AdminBanners.getLayout = (page: React.ReactElement) => <AdminLayout>{page}</AdminLayout>;
