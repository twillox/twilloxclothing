import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        {/* Preconnect to external assets */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Import Anton and Montserrat */}
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700&display=swap" rel="stylesheet" />
        
        {/* Import Google Material Symbols Outlined */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        
        {/* Global meta tags */}
        <meta name="description" content="TWILLOX | Premium Modern Luxury Clothing." />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <body className="bg-background text-on-surface selection:bg-secondary selection:text-white antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
