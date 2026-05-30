import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Category } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { userProfile, logout, isAdmin } = useAuth();
  const { cartItems } = useCart();
  const router = useRouter();

  // Pages where we want the hero to go behind the transparent header
  const heroPages = ['/'];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catSnap = await getDocs(query(collection(db, 'categories'), orderBy('name', 'asc')));
        const catList: Category[] = [];
        catSnap.forEach(doc => catList.push(doc.data() as Category));
        setCategories(catList);
      } catch (e) {
        console.error("Failed to fetch categories:", e);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [router.pathname]);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const handleNavClick = (href: string) => {
    setDrawerOpen(false);
    router.push(href);
  };

  const isHeroPage = heroPages.includes(router.pathname);

  return (
    <div className="bg-white text-black font-montserrat min-h-screen relative overflow-x-hidden selection:bg-black selection:text-white">

      {/* ─── Fixed Header ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isHeroPage && !scrolled
            ? 'bg-transparent border-b border-transparent'
            : 'bg-white border-b-2 border-black'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 flex justify-between items-center h-14 md:h-16">

          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => setDrawerOpen(true)}
              className={`transition-colors cursor-pointer ${isHeroPage && !scrolled ? 'text-white' : 'text-black hover:text-gray-500'}`}
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-[26px] font-bold block">menu</span>
            </button>

            <Link href="/">
              <span className={`text-2xl md:text-3xl font-anton uppercase cursor-pointer hover:opacity-70 transition-opacity leading-none ${isHeroPage && !scrolled ? 'text-white' : 'text-black'}`}>
                TWILLOX
              </span>
            </Link>
          </div>

          {/* Center: Desktop category links */}
          <div className="hidden lg:flex items-center gap-6 text-xs tracking-widest uppercase font-bold">
            {categories.slice(0, 5).map(cat => (
              <Link
                key={cat.slug}
                href={`/catalog?category=${cat.slug}`}
                className={`hover:opacity-60 transition-opacity ${isHeroPage && !scrolled ? 'text-white' : 'text-black'}`}
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/catalog"
              className={`border-b-2 hover:opacity-60 transition-opacity ${isHeroPage && !scrolled ? 'text-white border-white' : 'text-black border-black'}`}
            >
              ALL
            </Link>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-4 md:gap-5">
            {userProfile && isAdmin && (
              <Link href="/admin/dashboard" className="hidden sm:block">
                <span className={`text-xs uppercase font-bold tracking-widest hover:opacity-60 transition-opacity cursor-pointer text-secondary`}>
                  ADMIN
                </span>
              </Link>
            )}

            <Link href={userProfile ? '/profile' : '/auth'}>
              <span className={`material-symbols-outlined text-[26px] block cursor-pointer hover:opacity-60 transition-opacity ${isHeroPage && !scrolled ? 'text-white' : 'text-black'}`}>
                {userProfile ? 'person' : 'person_outline'}
              </span>
            </Link>

            <Link href="/cart">
              <div className={`relative cursor-pointer hover:opacity-60 transition-opacity ${isHeroPage && !scrolled ? 'text-white' : 'text-black'}`}>
                <span className="material-symbols-outlined text-[26px] block">shopping_bag</span>
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold leading-none">
                    {totalCartCount}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Spacer (only for non-hero pages) ─── */}
      {!isHeroPage && <div className="h-14 md:h-16" />}

      {/* ─── Nav Drawer ─── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Drawer Panel */}
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
              className="fixed top-0 left-0 h-full w-[85vw] max-w-[380px] bg-white border-r-4 border-black flex flex-col z-[51] overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b-4 border-black">
                <span className="text-3xl font-anton uppercase leading-none">TWILLOX</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="text-black hover:text-gray-500 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined font-bold text-[28px]">close</span>
                </button>
              </div>

              {/* Nav Links */}
              <div className="flex flex-col px-6 py-4 flex-1">
                <button
                  onClick={() => handleNavClick('/catalog')}
                  className="text-xl font-anton uppercase text-left py-4 border-b border-gray-100 hover:text-gray-500 transition-colors cursor-pointer"
                >
                  SHOP ALL
                </button>

                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleNavClick(`/catalog?category=${cat.slug}`)}
                    className="text-xl font-anton uppercase text-left py-4 border-b border-gray-100 text-gray-600 hover:text-black transition-colors cursor-pointer"
                  >
                    {cat.name}
                  </button>
                ))}

                {/* Account Section */}
                <div className="mt-8 pt-8 border-t-4 border-black">
                  <p className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-4">ACCOUNT</p>
                  {userProfile ? (
                    <>
                      <button
                        onClick={() => handleNavClick('/profile')}
                        className="text-lg font-bold uppercase text-left py-3 w-full text-black hover:text-gray-500 transition-colors cursor-pointer block"
                      >
                        Profile & Orders
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleNavClick('/admin/dashboard')}
                          className="text-lg font-bold uppercase text-left py-3 w-full text-secondary hover:opacity-70 transition-opacity cursor-pointer block"
                        >
                          Admin Panel
                        </button>
                      )}
                      <button
                        onClick={() => { logout(); setDrawerOpen(false); }}
                        className="text-sm font-bold uppercase text-left mt-6 py-2 text-gray-400 hover:text-black transition-colors cursor-pointer block"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleNavClick('/auth')}
                      className="text-lg font-bold uppercase text-left py-3 w-full text-black hover:text-gray-500 transition-colors cursor-pointer block"
                    >
                      Sign In / Register
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-6 pb-8 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">EST. 2026 — GLOBAL DROPS</p>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <main className="min-h-[calc(100vh-56px)]">
        {children}
      </main>

      {/* ─── Footer ─── */}
      <footer className="w-full bg-white border-t-4 border-black pt-10 md:pt-14 pb-6 md:pb-8">
        <div className="max-w-[1440px] mx-auto px-5 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-12 mb-8 md:mb-12">

            <div className="col-span-2 md:col-span-5">
              <h3 className="font-anton text-3xl md:text-5xl uppercase text-black mb-3 md:mb-4 leading-none">TWILLOX<br/>WORLDWIDE</h3>
              <p className="text-[10px] md:text-xs font-bold text-gray-400 leading-relaxed max-w-xs uppercase tracking-wider">
                Raw materials. Aggressive cuts. Designed for the streets, built to outlast them.
              </p>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-black mb-4">CATEGORIES</h4>
              <div className="flex flex-col gap-3">
                <Link href="/catalog" className="text-xs font-bold text-gray-500 hover:text-black transition-colors uppercase">All</Link>
                {categories.slice(0, 4).map(cat => (
                  <Link key={cat.slug} href={`/catalog?category=${cat.slug}`} className="text-xs font-bold text-gray-500 hover:text-black transition-colors uppercase">
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-black mb-4">Support</h4>
              <div className="flex flex-col gap-3">
                <Link href="/profile" className="text-xs font-bold text-gray-500 hover:text-black transition-colors uppercase">Account</Link>
                <Link href="/cart" className="text-xs font-bold text-gray-500 hover:text-black transition-colors uppercase">Cart</Link>
                <span className="text-xs font-bold text-gray-400 uppercase">Shipping</span>
                <span className="text-xs font-bold text-gray-400 uppercase">Returns</span>
              </div>
            </div>

            <div className="col-span-2 md:col-span-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-black mb-4">Join The List</h4>
              <p className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-wider">Early access to drops. No spam.</p>
              <div className="flex border-b-2 border-black pb-2 gap-2">
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  className="bg-transparent text-[10px] md:text-xs w-full outline-none placeholder:text-gray-400 font-bold uppercase"
                />
                <button className="text-black hover:text-gray-500 transition-colors cursor-pointer shrink-0">
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              &copy; {new Date().getFullYear()} TWILLOX. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-6">
              <span className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors cursor-pointer uppercase tracking-widest">Privacy</span>
              <span className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors cursor-pointer uppercase tracking-widest">Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
