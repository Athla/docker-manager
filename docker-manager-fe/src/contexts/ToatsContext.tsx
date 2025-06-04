import { createContext, useCallback, useContext, useState } from "react";
import { Toast, ToastType } from "../components/Toast";


interface ToastContextType {
  showToast: (props: { type: ToastType; message: string }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)

  const showToast = useCallback(({ type, message }: { type: ToastType; message: string }) => {
    setToast({ type, message })
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return context
}
