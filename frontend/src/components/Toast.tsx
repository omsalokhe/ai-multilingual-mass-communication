import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastCtx {
  toast: (type: ToastType, message: string) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(Ctx);
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />;
      case "error":
        return <AlertCircle size={18} className="text-red-500 shrink-0" />;
      default:
        return <Info size={18} className="text-blue-500 shrink-0" />;
    }
  };

  const bg = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-emerald-200 bg-emerald-50";
      case "error":
        return "border-red-200 bg-red-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  return (
    <Ctx.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-lg text-sm animate-slide-in ${bg(
              t.type
            )}`}
          >
            {icon(t.type)}
            <span className="text-slate-700 flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
