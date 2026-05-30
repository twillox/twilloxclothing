import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import FilmGrain from './FilmGrain';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { currentUser, userProfile, loading, isAdmin, logout } = useAuth();
  const router = useRouter();

  // Route security gate: Redirect to admin login if authenticated user is not an admin
  useEffect(() => {
    if (!loading) {
      if (!currentUser || !userProfile || !isAdmin) {
        router.push('/admin/login');
      }
    }
  }, [currentUser, userProfile, loading, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center font-mono text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-[48px] text-danger-red animate-spin mb-4">hourglass_bottom</span>
        <p className="uppercase">VERIFYING ADMINISTRATIVE LEVEL SECURITY CLEARANCE...</p>
      </div>
    );
  }

  if (!currentUser || !userProfile || !isAdmin) {
    // Return empty guard screen while redirecting
    return (
      <div className="min-h-screen bg-matte-black text-danger-red font-mono text-xs flex flex-col justify-center items-center uppercase p-margin-safe text-center">
        <span className="material-symbols-outlined text-[64px] animate-bounce block mb-4">warning</span>
        <h2 className="font-anton text-display-xl-mobile leading-none mb-2">SECURITY BREACH DETECTED</h2>
        <p className="max-w-md">ACCESS DENIED. THIS TERMINAL DISPATCH PORTAL IS SECURED FOR HIGH-LEVEL COMMAND OPERATORS ONLY.</p>
      </div>
    );
  }

  const menuItems = [
    { label: 'ANALYTICS_DECK', href: '/admin/dashboard', icon: 'monitoring' },
    { label: 'PRODUCT_CRUD', href: '/admin/products', icon: 'inventory' },
    { label: 'ZONES_CRUD (CAT)', href: '/admin/categories', icon: 'warehouse' },
    { label: 'SHIPMENT_LOGS', href: '/admin/orders', icon: 'local_shipping' },
    { label: 'CLIENTS_ROSTER', href: '/admin/customers', icon: 'group' },
    { label: 'VOUCHER_CMD', href: '/admin/coupons', icon: 'confirmation_number' },
    { label: 'MEDIA_SLIDERS', href: '/admin/banners', icon: 'slideshow' },
    { label: 'STOREFRONT BUILDER', href: '/admin/homepage', icon: 'view_quilt' },
    { label: 'STORE CONFIG', href: '/admin/settings', icon: 'settings' },
  ];

  const handleLogOutAdmin = async () => {
    await logout();
    router.push('/admin/login');
  };

  const isCurrentPage = (href: string) => {
    return router.pathname === href;
  };

  return (
    <div className="bg-background text-on-surface font-hanken min-h-screen relative overflow-x-hidden flex flex-col md:flex-row">
      {/* Visual CRT noise overlays */}
      <FilmGrain />

      {/* Left Sidebar Menu */}
      <aside className="w-full md:w-64 bg-surface-container-highest border-b-4 md:border-b-0 md:border-r-4 border-outline flex flex-col p-margin-safe shrink-0 md:sticky md:top-0 md:h-screen overflow-y-auto z-40">
        <div className="border-b-4 border-danger-red pb-4 mb-6">
          <h2 className="font-anton text-headline-lg text-danger-red uppercase leading-none">COMMANDER</h2>
          <p className="text-label-mono font-mono text-[9px] text-on-surface-variant tracking-widest mt-1">SECURE ROOT GRIDS</p>
        </div>

        <nav className="flex flex-col space-y-2.5 flex-1">
          {menuItems.map((item) => {
            const active = isCurrentPage(item.href);
            return (
              <Link key={item.label} href={item.href}>
                <button
                  className={`text-xs font-mono uppercase text-left p-3.5 flex items-center gap-3 border-2 select-none w-full transition-all cursor-pointer ${
                    active
                      ? 'bg-danger-red text-dirty-white border-matte-black translate-x-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold'
                      : 'text-on-surface border-transparent hover:border-concrete-gray hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  {item.label}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Action control buttons */}
        <div className="mt-8 pt-6 border-t border-dashed border-outline-variant space-y-3">
          <Link href="/">
            <button className="text-xs font-mono uppercase text-left p-2.5 flex items-center gap-3 text-secondary hover:text-warning-yellow border border-concrete-gray hover:border-outline w-full cursor-pointer select-none">
              <span className="material-symbols-outlined text-[16px]">storefront</span>
              VIEW_STOREFRONT
            </button>
          </Link>
          <button
            onClick={handleLogOutAdmin}
            className="text-xs font-mono uppercase text-left p-2.5 flex items-center gap-3 text-on-surface-variant hover:text-danger-red border border-transparent hover:bg-danger-red/10 w-full cursor-pointer select-none font-bold"
          >
            <span className="material-symbols-outlined text-[16px]">power_settings_new</span>
            TERMINATE_ROOT
          </button>
          
          <div className="bg-stripes h-3 w-full border-y border-outline mt-2"></div>
        </div>
      </aside>

      {/* Main Command Dashboard Content Canvas */}
      <main className="flex-1 min-h-screen p-gutter md:p-margin-safe bg-surface-dim relative md:overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
