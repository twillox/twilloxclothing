import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import CrateButton from '../../components/CrateButton';


export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { currentUser, userProfile, login, logout, isAdmin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Route to admin deck if verified admin session is detected
  useEffect(() => {
    if (currentUser && userProfile && !submitting) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        toast.error("Access blocked: Security clearances insufficient.");
        logout();
      }
    }
  }, [currentUser, userProfile, isAdmin]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("Fields missing: Input admin credentials.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
    } catch (e: any) {
      console.error("Admin credentials decryption failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>ADMIN GATE // OVERRIDE ACCESS</title>
      </Head>

      <div className="max-w-7xl mx-auto px-gutter py-24 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm bg-surface-container-high border-4 border-danger-red p-margin-safe relative shadow-[6px_6px_0px_0px_rgba(10,10,10,1)]">
          
          {/* Diagnostic alert caution strip */}
          <div className="bg-stripes h-4 w-full border-b-2 border-matte-black absolute top-0 left-0"></div>

          <div className="text-center pt-6 border-b border-concrete-gray pb-4 mb-6">
            <span className="material-symbols-outlined text-[42px] text-danger-red leading-none mb-2 animate-pulse">shield</span>
            <h1 className="font-anton text-headline-lg uppercase text-on-surface leading-none">SYSTEM_OVERRIDE</h1>
            <p className="text-label-mono font-mono text-[9px] text-danger-red font-bold tracking-widest uppercase mt-1">
              ADMINISTRATIVE CONTROL ACCESS PORT
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 font-mono text-xs">
            <div>
              <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">ADMIN EMAIL ROUTE</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface border-2 border-danger-red/40 focus:border-danger-red p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0 placeholder:text-on-surface-variant/40"
                placeholder="ENTER ADMIN EMAIL..."
              />
            </div>

            <div>
              <label className="text-label-mono font-mono text-[9px] text-on-surface-variant block mb-1 uppercase">ADMIN KEYPASS SYMBOLS</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface border-2 border-danger-red/40 focus:border-danger-red p-3 text-xs text-on-surface rounded-none outline-none focus:ring-0 placeholder:text-on-surface-variant/40"
                placeholder="ENTER SECURE PASSWORD..."
              />
            </div>

            <div className="pt-2">
              <CrateButton
                type="submit"
                disabled={submitting}
                variant="danger"
                className="w-full py-3.5 text-sm"
              >
                {submitting ? 'DECRYPTING ACCESS...' : 'FORCE_OVERRIDE_LOGIN'}
              </CrateButton>
            </div>

            <div className="text-center pt-2">
              <Link href="/" className="text-[9px] text-on-surface-variant hover:text-warning-yellow uppercase font-bold transition-colors">
                [RETURN TO CUSTOMER STOREFRONT]
              </Link>
            </div>

          </form>

        </div>
      </div>
    </>
  );
}

// Override customer layout wrapper by disabling standard getLayout
AdminLogin.getLayout = (page: React.ReactElement) => page;
