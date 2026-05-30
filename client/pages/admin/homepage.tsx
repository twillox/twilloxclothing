import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  Timestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { HomepageSection, SectionType } from '../../types';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import CrateButton from '../../components/CrateButton';

export default function AdminHomepage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editSection, setEditSection] = useState<HomepageSection | null>(null);

  // Form Fields
  const [type, setType] = useState<SectionType>('hero');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [height, setHeight] = useState('');
  const [reversed, setReversed] = useState(false);
  const [categorySlug, setCategorySlug] = useState('');
  const [limit, setLimit] = useState(4);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'homepage_sections'), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      const list: HomepageSection[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as HomepageSection);
      });
      setSections(list);
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
    setEditSection(null);
    setType('hero');
    setTitle('');
    setSubtitle('');
    setText('');
    setImageUrl('');
    setImageAlt('');
    setButtonText('');
    setButtonLink('');
    setBackgroundColor('');
    setTextColor('');
    setHeight('');
    setReversed(false);
    setCategorySlug('');
    setLimit(4);
    setShowModal(true);
  };

  const openEditModal = (s: HomepageSection) => {
    setEditSection(s);
    setType(s.type);
    setTitle(s.content.title || '');
    setSubtitle(s.content.subtitle || '');
    setText(s.content.text || '');
    setImageUrl(s.content.imageUrl || '');
    setImageAlt(s.content.imageAlt || '');
    setButtonText(s.content.buttonText || '');
    setButtonLink(s.content.buttonLink || '');
    setBackgroundColor(s.content.backgroundColor || '');
    setTextColor(s.content.textColor || '');
    setHeight(s.content.height || '');
    setReversed(s.content.reversed || false);
    setCategorySlug(s.content.categorySlug || '');
    setLimit(s.content.limit || 4);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const docId = editSection ? editSection.id : `section_${Date.now()}`;
    const order = editSection ? editSection.order : sections.length;

    const docPayload: Omit<HomepageSection, 'id'> = {
      type,
      order,
      content: {
        title,
        subtitle,
        text,
        imageUrl,
        imageAlt,
        buttonText,
        buttonLink,
        backgroundColor,
        textColor,
        height,
        reversed,
        categorySlug,
        limit
      },
      createdAt: editSection ? editSection.createdAt : Timestamp.now()
    };

    try {
      await setDoc(doc(db, 'homepage_sections', docId), docPayload);
      toast.success("Section layout compiled successfully.");
      setShowModal(false);
      await fetchData();
    } catch (e: any) {
      toast.error(`Compile failed: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm("PURGE SECTION? This will remove it from the live storefront.");
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'homepage_sections', id));
      toast.success("Section purged.");
      await fetchData();
    } catch (e: any) {
      toast.error(`Purge failed: ${e.message}`);
    }
  };

  const moveSection = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sections.length - 1) return;

    const newSections = [...sections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap orders
    const tempOrder = newSections[index].order;
    newSections[index].order = newSections[swapIndex].order;
    newSections[swapIndex].order = tempOrder;

    try {
      await setDoc(doc(db, 'homepage_sections', newSections[index].id), { order: newSections[index].order }, { merge: true });
      await setDoc(doc(db, 'homepage_sections', newSections[swapIndex].id), { order: newSections[swapIndex].order }, { merge: true });
      await fetchData();
    } catch (e: any) {
      toast.error("Reorder failed.");
    }
  };

  const handleSeedDefault = async () => {
    try {
      const defaultSections: Omit<HomepageSection, 'id'>[] = [
        {
          type: 'hero',
          order: 0,
          content: {
            title: 'NEW RULES.\nNO LIMITS.',
            subtitle: 'LATEST DROP // AW26',
            text: 'THE HIGH STREET STANDARD. HEAVYWEIGHT FABRICS. OVERSIZED SILHOUETTES.',
            buttonText: 'SHOP THE DROP',
            buttonLink: '/catalog',
            imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=2000'
          },
          createdAt: Timestamp.now()
        },
        {
          type: 'product_carousel',
          order: 1,
          content: {
            title: 'LATEST RELEASES',
            buttonText: 'VIEW ALL',
            buttonLink: '/catalog?sort=newest',
            limit: 8
          },
          createdAt: Timestamp.now()
        },
        {
          type: 'banner_grid',
          order: 2,
          content: {
            limit: 4
          },
          createdAt: Timestamp.now()
        },
        {
          type: 'manifesto',
          order: 3,
          content: {
            title: 'BUILT FOR\nTHE CONCRETE.',
            subtitle: 'Manifesto',
            text: 'We reject mass production. Every piece is developed from scratch using heavyweight, custom-milled fabrics. Oversized, aggressive silhouettes that command attention. This is not fashion. This is uniform.',
            buttonText: 'COP THE LOOK',
            buttonLink: '/catalog',
            imageUrl: 'https://images.unsplash.com/photo-1523398002811-999aa8d9512e?q=80&w=800&auto=format&fit=crop',
            reversed: false
          },
          createdAt: Timestamp.now()
        }
      ];

      for (let i = 0; i < defaultSections.length; i++) {
        await setDoc(doc(db, 'homepage_sections', `section_${Date.now()}_${i}`), defaultSections[i]);
      }
      toast.success("Default layout seeded successfully.");
      await fetchData();
    } catch (e: any) {
      toast.error(`Seed failed: ${e.message}`);
    }
  };

  return (
    <>
      <Head>
        <title>STOREFRONT COMMAND // SYSTEM ROOT</title>
      </Head>

      <div className="space-y-6">
        
        <div className="mb-margin-safe border-b-4 border-concrete-gray pb-unit flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-headline-lg font-anton uppercase text-on-surface">STOREFRONT CONTROL // HOMEPAGE BUILDER</h2>
            <p className="text-label-mono font-mono text-xs text-danger-red mt-1">SECURITY ACCESS: ADMIN CRUD OVERRIDE</p>
          </div>
          <CrateButton onClick={openAddModal} variant="primary" className="py-2 px-6 text-xs shrink-0 select-none">
            ADD_NEW_SECTION
          </CrateButton>
        </div>

        {loading ? (
          <div className="text-center py-20 font-mono text-xs text-on-surface-variant animate-pulse uppercase">
            SYNCHRONIZING LAYOUT DATA...
          </div>
        ) : sections.length > 0 ? (
          <div className="space-y-4">
            {sections.map((s, index) => (
              <div key={s.id} className="border-4 border-black bg-surface-container shadow-hard p-4 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1 border-r-2 border-concrete-gray pr-4">
                    <button 
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-1 border border-black hover:bg-black hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                    </button>
                    <button 
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === sections.length - 1}
                      className="p-1 border border-black hover:bg-black hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                    </button>
                  </div>
                  <div>
                    <span className="px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest">{s.type}</span>
                    <h4 className="font-anton text-2xl uppercase mt-2">{s.content.title || '(NO TITLE)'}</h4>
                    {s.content.subtitle && <p className="text-xs font-mono uppercase text-gray-500 mt-1">{s.content.subtitle}</p>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openEditModal(s)}
                    className="border-2 border-black px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="border-2 border-red-700 text-red-700 px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-red-700 hover:text-white transition-colors"
                  >
                    PURGE
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-4 border-dashed border-outline-variant p-20 text-center bg-surface-container max-w-xl mx-auto">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/30 block mb-4">view_quilt</span>
            <h3 className="font-anton text-headline-lg uppercase text-on-surface mb-2">LAYOUT EMPTY</h3>
            <p className="font-mono text-xs text-on-surface-variant leading-relaxed max-w-sm mx-auto mb-8">
              No sections exist on the storefront.
            </p>
            <div className="flex justify-center gap-4">
              <CrateButton onClick={handleSeedDefault} variant="secondary" className="text-xs py-2 px-8">
                SEED_DEFAULT_LAYOUT
              </CrateButton>
              <CrateButton onClick={openAddModal} variant="primary" className="text-xs py-2 px-8">
                ADD_NEW_SECTION
              </CrateButton>
            </div>
          </div>
        )}

        {/* Modal Overlay */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-matte-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-3xl bg-surface-container-high border-4 border-concrete-gray p-6 relative shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] my-10 max-h-[90vh] overflow-y-auto scrollbar-thin">
              
              <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-6 sticky top-0 bg-surface-container-high z-10 pt-2">
                <div>
                  <h3 className="font-anton text-headline-md uppercase text-black">
                    {editSection ? 'EDIT SECTION BLOCK' : 'CREATE SECTION BLOCK'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="border-2 border-black px-2 hover:bg-black hover:text-white font-bold"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div>
                  <label className="font-bold text-xs uppercase tracking-widest block mb-2">SECTION TYPE</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value as SectionType)}
                    className="w-full border-2 border-black p-3 font-bold uppercase"
                  >
                    <option value="hero">HERO BANNER</option>
                    <option value="manifesto">MANIFESTO / TEXT SPLIT</option>
                    <option value="product_carousel">PRODUCT CAROUSEL</option>
                    <option value="banner_grid">BANNER GRID</option>
                    <option value="spacer">SPACER</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-gray-200 pt-6">
                  
                  {type !== 'spacer' && (
                    <>
                      <div>
                        <label className="font-bold text-[10px] uppercase tracking-widest block mb-2 text-gray-500">HEADLINE</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border-2 border-black p-3 font-bold" />
                      </div>
                      <div>
                        <label className="font-bold text-[10px] uppercase tracking-widest block mb-2 text-gray-500">SUBTITLE</label>
                        <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full border-2 border-black p-3 font-bold" />
                      </div>
                    </>
                  )}

                  {(type === 'hero' || type === 'manifesto') && (
                    <div className="md:col-span-2">
                      <label className="font-bold text-[10px] uppercase tracking-widest block mb-2 text-gray-500">PARAGRAPH TEXT</label>
                      <textarea rows={4} value={text} onChange={e => setText(e.target.value)} className="w-full border-2 border-black p-3 font-bold" />
                    </div>
                  )}

                  {(type === 'hero' || type === 'manifesto' || type === 'banner_grid') && (
                    <>
                      <div className="md:col-span-2">
                        <label className="font-bold text-[10px] uppercase tracking-widest block mb-2 text-gray-500">IMAGE URL</label>
                        <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full border-2 border-black p-3 font-bold" />
                      </div>
                    </>
                  )}

                  {(type === 'hero' || type === 'manifesto') && (
                    <>
                      <div>
                        <label className="font-bold text-[10px] uppercase tracking-widest block mb-2 text-gray-500">BUTTON TEXT</label>
                        <input type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} className="w-full border-2 border-black p-3 font-bold" />
                      </div>
                      <div>
                        <label className="font-bold text-[10px] uppercase tracking-widest block mb-2 text-gray-500">BUTTON LINK ROUTE</label>
                        <input type="text" value={buttonLink} onChange={e => setButtonLink(e.target.value)} className="w-full border-2 border-black p-3 font-bold" />
                      </div>
                    </>
                  )}

                  {type === 'product_carousel' && (
                    <>
                      <div>
                        <label className="font-bold text-[10px] uppercase tracking-widest block mb-2 text-gray-500">CATEGORY SLUG FILTER (Empty for all)</label>
                        <input type="text" value={categorySlug} onChange={e => setCategorySlug(e.target.value)} className="w-full border-2 border-black p-3 font-bold" />
                      </div>
                      <div>
                        <label className="font-bold text-[10px] uppercase tracking-widest block mb-2 text-gray-500">MAX ITEMS</label>
                        <input type="number" value={limit} onChange={e => setLimit(Number(e.target.value))} className="w-full border-2 border-black p-3 font-bold" />
                      </div>
                    </>
                  )}

                  {type === 'manifesto' && (
                    <div className="md:col-span-2 flex items-center gap-4 p-4 border-2 border-black bg-gray-50">
                      <input type="checkbox" checked={reversed} onChange={e => setReversed(e.target.checked)} className="w-5 h-5 border-2 border-black" />
                      <label className="font-bold text-xs uppercase tracking-widest">REVERSE LAYOUT (IMAGE ON LEFT)</label>
                    </div>
                  )}

                </div>

                <div className="pt-6 border-t-4 border-black">
                  <button type="submit" className="w-full bg-black text-white py-4 font-bold uppercase tracking-widest shadow-hard hover:bg-white hover:text-black hover:border-black border-2 border-black transition-colors">
                    {editSection ? 'COMMIT CHANGES' : 'CREATE SECTION'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

AdminHomepage.getLayout = (page: React.ReactElement) => <AdminLayout>{page}</AdminLayout>;
