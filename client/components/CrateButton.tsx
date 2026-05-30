import React, { ReactNode } from 'react';

interface CrateButtonProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}

export default function CrateButton({
  children,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
  variant = 'primary'
}: CrateButtonProps) {
  
  let baseStyle = "crate-button font-anton uppercase text-headline-md tracking-wider px-6 py-3 cursor-pointer flex items-center justify-center gap-2 select-none active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";
  let variantStyle = "";

  switch (variant) {
    case 'primary': // Warning Yellow Accent
      variantStyle = "bg-warning-yellow text-matte-black border-2 border-matte-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:bg-warning-yellow-dark";
      break;
    case 'secondary': // Industrial Grey
      variantStyle = "bg-surface-container-high text-on-surface border-2 border-concrete-gray shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:bg-surface-container-highest";
      break;
    case 'danger': // Warning Hot Red
      variantStyle = "bg-danger-red text-dirty-white border-2 border-matte-black shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] hover:bg-red-700";
      break;
    case 'outline': // Wireframe borders
      variantStyle = "bg-transparent text-on-surface border-2 border-concrete-gray shadow-[3px_3px_0px_0px_rgba(38,38,38,1)] hover:border-warning-yellow hover:text-warning-yellow";
      break;
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variantStyle} ${className}`}
    >
      {children}
    </button>
  );
}
