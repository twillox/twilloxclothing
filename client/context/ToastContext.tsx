import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextProps {
  showToast: (message: string, type?: ToastType) => void;
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    warning: (msg: string) => void;
    info: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically dismiss toast after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const toastHelpers = {
    success: (msg: string) => showToast(msg, 'success'),
    error: (msg: string) => showToast(msg, 'error'),
    warning: (msg: string) => showToast(msg, 'warning'),
    info: (msg: string) => showToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={{ showToast, toast: toastHelpers }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 md:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.15 } }}
              className="pointer-events-auto bg-surface-container-high border-2 border-matte-black p-4 shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] flex items-center justify-between gap-3 relative overflow-hidden"
            >
              {/* Color Accent bar */}
              <div className={`absolute top-0 left-0 w-2.5 h-full ${
                t.type === 'success' ? 'bg-warning-yellow' :
                t.type === 'error' ? 'bg-danger-red' :
                t.type === 'warning' ? 'bg-hazard-orange' : 'bg-steel-silver'
              }`} />
              
              <div className="pl-3 flex-1 font-mono text-xs text-on-surface">
                <span className={`font-black tracking-wider block mb-0.5 ${
                  t.type === 'success' ? 'text-warning-yellow' :
                  t.type === 'error' ? 'text-danger-red' :
                  t.type === 'warning' ? 'text-hazard-orange' : 'text-steel-silver'
                }`}>
                  {t.type === 'success' && 'SYSTEM_SUCCESS_OK'}
                  {t.type === 'error' && 'SYSTEM_FAILURE_ERR'}
                  {t.type === 'warning' && 'WARNING_LOG_WARN'}
                  {t.type === 'info' && 'MANIFEST_LOG_INFO'}
                </span>
                <span className="text-on-surface-variant font-medium leading-relaxed">
                  {t.message}
                </span>
              </div>
              
              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-on-surface-variant hover:text-warning-yellow p-1 font-bold font-mono text-xs transition-colors self-start"
              >
                [X]
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
