import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPortal() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { currentUser, login, register, forgotPassword } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Redirect to homepage if user is already logged in
  useEffect(() => {
    if (currentUser) {
      router.push('/profile');
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning("FILL IN THE BLANKS.");
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
        router.push('/profile');
      } else {
        if (!displayName) {
          toast.warning("USERNAME REQUIRED.");
          setSubmitting(false);
          return;
        }
        await register(email, password, displayName);
        router.push('/profile');
      }
    } catch (e: any) {
      console.error("Auth process failed:", e);
      toast.error("WRONG EMAIL OR PASSWORD.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.warning("EMAIL REQUIRED.");
      return;
    }
    try {
      await forgotPassword(forgotEmail);
      toast.success("RESET LINK SENT.");
      setShowForgot(false);
      setForgotEmail('');
    } catch (e) {
      console.error(e);
      toast.error("SOMETHING WENT WRONG.");
    }
  };

  return (
    <>
      <Head>
        <title>AUTHENTICATION — TWILLOX</title>
      </Head>

      <div className="bg-white min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 border-b-8 border-black">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6 md:mb-8 mx-4">
          <h2 className="font-anton text-4xl md:text-5xl lg:text-6xl text-black uppercase">
            {showForgot ? 'RESET PASSWORD' : isLogin ? 'SIGN IN' : 'JOIN THE CLUB'}
          </h2>
          <p className="mt-4 text-sm text-gray-500 font-bold uppercase tracking-widest">
            {showForgot ? 'DROP YOUR EMAIL TO RESET' : isLogin ? 'WELCOME BACK' : 'CREATE AN ACCOUNT TO START COPPING'}
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:px-10">
            {!showForgot ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {!isLogin && (
                  <div>
                    <label className="text-sm font-bold uppercase tracking-widest text-black block mb-2">USERNAME</label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-surface-dim border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                      placeholder="ENTER USERNAME"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-bold uppercase tracking-widest text-black block mb-2">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-dim border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                    placeholder="ENTER EMAIL"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold uppercase tracking-widest text-black block">PASSWORD</label>
                    {isLogin && (
                      <div className="text-sm">
                        <button
                          type="button"
                          onClick={() => setShowForgot(true)}
                          className="font-bold text-xs uppercase tracking-widest text-gray-500 hover:text-black hover:underline transition-colors cursor-pointer"
                        >
                          FORGOT PASSWORD?
                        </button>
                      </div>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-dim border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-black text-white py-3 md:py-5 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors cursor-pointer disabled:opacity-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
                  >
                    {submitting ? 'LOADING...' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t-4 border-black text-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    {isLogin ? "DON'T HAVE AN ACCOUNT? " : "ALREADY GOT AN ACCOUNT? "}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-xs font-bold uppercase tracking-widest text-black hover:text-gray-600 underline transition-colors cursor-pointer ml-2"
                  >
                    {isLogin ? "SIGN UP" : "SIGN IN"}
                  </button>
                </div>
              </form>
            ) : (
              // Forgot Password Form
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="text-sm font-bold uppercase tracking-widest text-black block mb-2">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-surface-dim border-2 border-black focus:outline-none focus:ring-0 px-4 py-4 text-sm font-bold uppercase text-black transition-colors"
                    placeholder="ENTER EMAIL"
                  />
                </div>

                <div className="flex flex-col gap-4 pt-2">
                  <button
                    type="submit"
                    className="w-full bg-black text-white py-3 md:py-5 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors cursor-pointer border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
                  >
                    SEND RESET LINK
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="w-full bg-white border-2 border-black text-black py-3 md:py-5 font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
