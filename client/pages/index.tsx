import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { seedDatabase } from '../utils/seed';
import { Product, Banner, Category, HomepageSection } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const { toggleWishlist, isInWishlist } = useCart();
  const { toast } = useToast();
  const sliderRef = useRef<HTMLDivElement>(null);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const prodRef = collection(db, 'products');
      const prodSnap = await getDocs(prodRef);
      const prodList: Product[] = [];
      prodSnap.forEach((doc) => prodList.push({ id: doc.id, ...doc.data() } as Product));
      prodList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setProducts(prodList);

      const bannerRef = collection(db, 'banners');
      const bannerSnap = await getDocs(query(bannerRef, where('type', '==', 'home')));
      const bannerList: Banner[] = [];
      bannerSnap.forEach((doc) => bannerList.push({ id: doc.id, ...doc.data() } as Banner));
      setBanners(bannerList);

      const catRef = collection(db, 'categories');
      const catSnap = await getDocs(query(catRef, orderBy('name', 'asc')));
      const catList: Category[] = [];
      catSnap.forEach((doc) => catList.push(doc.data() as Category));
      setCategories(catList);

      const secRef = collection(db, 'homepage_sections');
      const secSnap = await getDocs(query(secRef, orderBy('order', 'asc')));
      const secList: HomepageSection[] = [];
      secSnap.forEach((doc) => secList.push({ id: doc.id, ...doc.data() } as HomepageSection));
      setSections(secList);

    } catch (e) {
      console.error('Firestore loading error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDatabase();
      toast.success('Collection loaded successfully.');
      await fetchHomeData();
    } catch (e: any) {
      toast.error(`Error loading collection: ${e.message}`);
    } finally {
      setSeeding(false);
    }
  };

  // Show all products in the slider
  const newArrivals = products.slice(0, 8);

  return (
    <>
      <Head>
        <title>TWILLOX — GLOBAL DROP SYSTEM</title>
        <meta name="description" content="TWILLOX. Raw materials. Aggressive cuts. Designed for the streets, built to outlast them." />
      </Head>

      <div className="w-full bg-white text-black">
        {/* Empty Store Prompt */}
        {!loading && products.length === 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-white border-4 border-black p-8 max-w-sm mx-4 text-center shadow-hard">
              <h3 className="font-anton text-3xl uppercase mb-3">SOLD OUT</h3>
              <p className="font-bold text-gray-500 mb-6 uppercase tracking-widest text-xs">
                No pieces in the stash right now. Wanna load some up?
              </p>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer w-full border-2 border-black"
              >
                {seeding ? 'LOADING...' : 'ADD TO STASH'}
              </button>
            </div>
          </div>
        )}

        {/* ── DYNAMIC SECTIONS RENDERER ── */}
        {!loading && sections.length > 0 ? sections.map((section) => {
          
          if (section.type === 'hero') {
            return (
              <section key={section.id} className="relative w-full h-[85vh] min-h-[560px] overflow-hidden bg-black border-b-[6px] border-black">
                <motion.div
                  initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="absolute inset-0 bg-cover bg-center opacity-80"
                  style={{ 
                    backgroundImage: `url('${section.content.imageUrl || banners[0]?.imageUrl || 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=2000'}')`,
                    filter: 'contrast(1.2) grayscale(0.2)'
                  }}
                />
                <div className="absolute inset-0 bg-hero-gradient" />
                <div className="relative z-10 h-full flex flex-col justify-end pb-16 px-5 md:px-12 max-w-[1440px] mx-auto w-full">
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
                    {section.content.subtitle && (
                      <span className="bg-white text-black text-[9px] font-bold px-3 py-1 uppercase tracking-[0.3em] mb-4 inline-block">
                        {section.content.subtitle}
                      </span>
                    )}
                    <h1 className="font-anton text-4xl md:text-6xl lg:text-8xl text-white leading-none mb-4 md:mb-5 uppercase whitespace-pre-line">
                      {section.content.title || 'NEW RULES.\nNO LIMITS.'}
                    </h1>
                    {section.content.text && (
                      <p className="text-white text-sm md:text-base font-bold max-w-sm md:max-w-md leading-relaxed mb-8 uppercase tracking-widest opacity-90">
                        {section.content.text}
                      </p>
                    )}
                    {section.content.buttonText && (
                      <Link href={section.content.buttonLink || '/catalog'}>
                        <button className="bg-white text-black px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors cursor-pointer border-2 border-transparent shadow-hard">
                          {section.content.buttonText}
                        </button>
                      </Link>
                    )}
                  </motion.div>
                </div>
              </section>
            );
          }

          if (section.type === 'product_carousel') {
            const limit = section.content.limit || 8;
            let displayProducts = products;
            if (section.content.categorySlug) {
              displayProducts = products.filter(p => p.category === section.content.categorySlug);
            }
            displayProducts = displayProducts.slice(0, limit);

            return (
              <section key={section.id} className="py-14 bg-white" style={{ backgroundColor: section.content.backgroundColor || '#ffffff' }}>
                <div className="max-w-[1440px] mx-auto px-5 md:px-12">
                  <div className="flex justify-between items-end mb-8 border-b-4 border-black pb-4">
                    <h2 className="font-anton text-3xl md:text-5xl lg:text-6xl uppercase text-black leading-none whitespace-pre-line" style={{ color: section.content.textColor || '#000' }}>
                      {section.content.title || 'LATEST RELEASES'}
                    </h2>
                    {section.content.buttonText && (
                      <Link href={section.content.buttonLink || '/catalog'} className="font-bold uppercase tracking-widest hover:text-gray-500 transition-colors flex items-center gap-1 text-xs md:text-sm shrink-0 ml-4" style={{ color: section.content.textColor || '#000' }}>
                        {section.content.buttonText} <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </Link>
                    )}
                  </div>
                  {displayProducts.length > 0 && (
                    <div className="flex gap-4 md:gap-6 overflow-x-auto hide-scrollbar pb-4 snap-x snap-mandatory">
                      {displayProducts.map((product, idx) => (
                        <div key={product.id} className="group shrink-0 w-[44vw] sm:w-[220px] md:w-[200px] lg:w-[220px] snap-start">
                          <Link href={`/product/${product.id}`} className="block relative overflow-hidden aspect-[3/4] bg-gray-100 mb-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                            <img src={product.imageUrls[0]} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
                            {product.imageUrls[1] && <img src={product.imageUrls[1]} alt={product.name} className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
                            <button onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }} className="absolute top-2 right-2 w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black hover:text-white cursor-pointer z-10">
                              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: `'FILL' ${isInWishlist(product.id) ? 1 : 0}` }}>favorite</span>
                            </button>
                          </Link>
                          <div>
                            <h3 className="font-bold text-xs md:text-sm uppercase leading-tight mb-1 truncate" style={{ color: section.content.textColor || '#000' }}>{product.name}</h3>
                            <p className="font-bold text-gray-500 text-xs">${product.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          if (section.type === 'manifesto') {
            return (
              <section key={section.id} className="py-16 md:py-24 px-5 md:px-12 bg-gray-50" style={{ backgroundColor: section.content.backgroundColor || '#f9fafb' }}>
                <div className="max-w-[1440px] mx-auto">
                  <div className="mb-10 lg:mb-0 lg:grid lg:grid-cols-12 lg:gap-16 lg:items-center">
                    
                    <div className={`lg:col-span-7 mb-8 md:mb-10 lg:mb-0 ${section.content.reversed ? 'lg:order-2' : 'lg:order-1'}`}>
                      {section.content.subtitle && <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px] md:text-xs mb-2 md:mb-3 block">{section.content.subtitle}</span>}
                      {section.content.title && (
                        <h2 className="font-anton text-3xl md:text-5xl lg:text-7xl leading-none mb-3 md:mb-6 uppercase whitespace-pre-line" style={{ color: section.content.textColor || '#000' }}>
                          {section.content.title}
                        </h2>
                      )}
                      <div className="w-12 md:w-16 h-1 md:h-1.5 mb-5 md:mb-7" style={{ backgroundColor: section.content.textColor || '#000' }}></div>
                      {section.content.text && (
                        <p className="font-bold uppercase tracking-widest leading-relaxed text-xs md:text-sm lg:text-base mb-6 md:mb-10 max-w-xl" style={{ color: section.content.textColor || '#000' }}>
                          {section.content.text}
                        </p>
                      )}
                      {section.content.buttonText && (
                        <Link href={section.content.buttonLink || '/catalog'}>
                          <button className="btn-street border-2 border-black">
                            {section.content.buttonText}
                          </button>
                        </Link>
                      )}
                    </div>

                    <div className={`lg:col-span-5 relative mt-8 lg:mt-0 ${section.content.reversed ? 'lg:order-1' : 'lg:order-2'}`}>
                      {section.content.imageUrl && (
                        <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-1.5">
                          <img
                            src={section.content.imageUrl}
                            alt={section.content.imageAlt || "Campaign"}
                            className="w-full h-full object-cover"
                            style={{ minHeight: '350px', maxHeight: '480px' }}
                          />
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </section>
            );
          }

          if (section.type === 'banner_grid') {
            return (
              <section key={section.id} className="py-10 px-5 md:px-12 bg-black border-y-4 border-black" style={{ backgroundColor: section.content.backgroundColor || '#000' }}>
                <div className="max-w-[1440px] mx-auto">
                  {section.content.title && (
                    <h2 className="font-anton text-3xl md:text-4xl text-white uppercase mb-8" style={{ color: section.content.textColor || '#fff' }}>{section.content.title}</h2>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
                    {categories.slice(0, section.content.limit || 4).map((cat) => (
                      <Link key={cat.slug} href={`/catalog?category=${cat.slug}`}>
                        <div className="group relative overflow-hidden aspect-[4/3] cursor-pointer border-2 border-black">
                          <img
                            src={cat.imageUrl || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800'}
                            alt={cat.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/45 group-hover:bg-black/65 transition-colors duration-400" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                            <h3 className="text-white text-2xl md:text-4xl lg:text-5xl font-anton uppercase tracking-widest drop-shadow-lg">
                              {cat.name}
                            </h3>
                            <span className="mt-3 bg-white text-black font-bold text-[9px] px-3 py-1 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-y-3 group-hover:translate-y-0">
                              EXPLORE
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          if (section.type === 'spacer') {
            return (
              <div key={section.id} style={{ height: section.content.height || '100px', backgroundColor: section.content.backgroundColor || 'transparent' }}></div>
            );
          }

          return null;
        }) : (
          /* FALLBACK / DEFAULT HARDCODED LAYOUT (if no sections created yet) */
          <>
            {/* ── HERO SECTION ── */}
            <section className="relative w-full h-[85vh] min-h-[560px] overflow-hidden bg-black border-b-[6px] border-black">
              <motion.div
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="absolute inset-0 bg-cover bg-center opacity-80"
                style={{ 
                  backgroundImage: `url('${banners[0]?.imageUrl || 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=2000'}')`,
                  filter: 'contrast(1.2) grayscale(0.2)'
                }}
              />
              <div className="absolute inset-0 bg-hero-gradient" />
              <div className="relative z-10 h-full flex flex-col justify-end pb-16 px-5 md:px-12 max-w-[1440px] mx-auto w-full">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
                  <span className="bg-white text-black text-[9px] font-bold px-3 py-1 uppercase tracking-[0.3em] mb-4 inline-block">
                    LATEST DROP // AW26
                  </span>
                  <h1 className="font-anton text-4xl md:text-6xl lg:text-8xl text-white leading-none mb-4 md:mb-5 uppercase">
                    {banners[0]?.title || 'NEW RULES.\nNO LIMITS.'}
                  </h1>
                  <p className="text-white text-sm md:text-base font-bold max-w-sm md:max-w-md leading-relaxed mb-8 uppercase tracking-widest opacity-90">
                    {banners[0]?.subtitle || 'THE HIGH STREET STANDARD. HEAVYWEIGHT FABRICS. OVERSIZED SILHOUETTES.'}
                  </p>
                  <Link href="/catalog">
                    <button className="bg-white text-black px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors cursor-pointer border-2 border-transparent shadow-hard">
                      SHOP THE DROP
                    </button>
                  </Link>
                </motion.div>
              </div>
            </section>

            {/* ── LATEST RELEASES ── */}
            <section className="py-14 bg-white">
              <div className="max-w-[1440px] mx-auto px-5 md:px-12">
                <div className="flex justify-between items-end mb-8 border-b-4 border-black pb-4">
                  <h2 className="font-anton text-3xl md:text-5xl lg:text-6xl uppercase text-black leading-none">LATEST<br className="md:hidden"/>RELEASES</h2>
                  <Link href="/catalog?sort=newest" className="font-bold uppercase tracking-widest text-black hover:text-gray-500 transition-colors flex items-center gap-1 text-xs md:text-sm shrink-0 ml-4">
                    VIEW ALL <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </Link>
                </div>
                {loading ? (
                  <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse shrink-0 w-[44vw] sm:w-[220px] md:w-[200px] lg:w-[220px]">
                        <div className="aspect-[3/4] bg-gray-200 mb-3 border-2 border-gray-300" />
                        <div className="h-4 bg-gray-200 w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : newArrivals.length > 0 ? (
                  <div ref={sliderRef} className="flex gap-4 md:gap-6 overflow-x-auto hide-scrollbar pb-4 snap-x snap-mandatory">
                    {newArrivals.map((product, idx) => (
                      <div key={product.id} className="group shrink-0 w-[44vw] sm:w-[220px] md:w-[200px] lg:w-[220px] snap-start">
                        <Link href={`/product/${product.id}`} className="block relative overflow-hidden aspect-[3/4] bg-gray-100 mb-3 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all">
                          <img src={product.imageUrls[0]} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
                          {product.imageUrls[1] && <img src={product.imageUrls[1]} alt={product.name} className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
                          {idx === 0 && (
                            <div className="absolute top-2 left-2 z-10">
                              <span className="bg-black text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest">NEW</span>
                            </div>
                          )}
                          <button onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }} className="absolute top-2 right-2 w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black hover:text-white cursor-pointer z-10">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: `'FILL' ${isInWishlist(product.id) ? 1 : 0}` }}>favorite</span>
                          </button>
                        </Link>
                        <div>
                          <h3 className="font-bold text-black text-xs md:text-sm uppercase leading-tight mb-1 truncate">{product.name}</h3>
                          <p className="font-bold text-gray-500 text-xs">${product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            {/* ── DYNAMIC CATEGORIES ── */}
            {categories.length > 0 && (
              <section className="py-10 px-5 md:px-12 bg-black border-y-4 border-black">
                <div className="max-w-[1440px] mx-auto">
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
                    {categories.map((cat) => (
                      <Link key={cat.slug} href={`/catalog?category=${cat.slug}`}>
                        <div className="group relative overflow-hidden aspect-[4/3] cursor-pointer border-2 border-black">
                          <img
                            src={cat.imageUrl || 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800'}
                            alt={cat.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/45 group-hover:bg-black/65 transition-colors duration-400" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                            <h3 className="text-white text-2xl md:text-4xl lg:text-5xl font-anton uppercase tracking-widest drop-shadow-lg">
                              {cat.name}
                            </h3>
                            <span className="mt-3 bg-white text-black font-bold text-[9px] px-3 py-1 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity translate-y-3 group-hover:translate-y-0">
                              EXPLORE
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── EDITORIAL / MANIFESTO ── */}
            <section className="py-16 md:py-24 px-5 md:px-12 bg-gray-50">
              <div className="max-w-[1440px] mx-auto">
                <div className="mb-10 lg:mb-0 lg:grid lg:grid-cols-12 lg:gap-16 lg:items-center">
                  <div className="lg:col-span-7 lg:order-2 mb-8 md:mb-10 lg:mb-0">
                    <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px] md:text-xs mb-2 md:mb-3 block">Manifesto</span>
                    <h2 className="font-anton text-3xl md:text-5xl lg:text-7xl text-black leading-none mb-3 md:mb-6 uppercase">
                      BUILT FOR<br/>THE CONCRETE.
                    </h2>
                    <div className="w-12 md:w-16 h-1 md:h-1.5 bg-black mb-5 md:mb-7"></div>
                    <p className="text-black font-bold uppercase tracking-widest leading-relaxed text-xs md:text-sm lg:text-base mb-6 md:mb-10 max-w-xl">
                      We reject mass production. Every piece is developed from scratch using heavyweight, custom-milled fabrics. Oversized, aggressive silhouettes that command attention. This is not fashion. This is uniform.
                    </p>
                    <Link href="/catalog">
                      <button className="btn-street">
                        COP THE LOOK
                      </button>
                    </Link>
                  </div>
                  <div className="lg:col-span-5 lg:order-1 relative mt-8 lg:mt-0">
                    <div className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white p-1.5">
                      <img
                        src="https://images.unsplash.com/photo-1523398002811-999aa8d9512e?q=80&w=800&auto=format&fit=crop"
                        alt="Twillox campaign"
                        className="w-full h-full object-cover"
                        style={{ minHeight: '350px', maxHeight: '480px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

      </div>
    </>
  );
}
