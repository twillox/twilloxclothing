import React from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import Layout from '../components/Layout';
import { NextPage } from 'next';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  // Use custom layouts (e.g. for Admin Dashboard views) or default to storefront Layout
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);

  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          {getLayout(<Component {...pageProps} />)}
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
