import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

let nextId = 0;

const TOAST_CONFIG: Record<ToastType, { icon: typeof CheckCircle; bg: string; border: string }> = {
  success: { icon: CheckCircle, bg: "bg-green-50 dark:bg-green-950/50", border: "border-green-200 dark:border-green-800" },
  error: { icon: XCircle, bg: "bg-red-50 dark:bg-red-950/50", border: "border-red-200 dark:border-red-800" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50 dark:bg-amber-950/50", border: "border-amber-200 dark:border-amber-800" },
};

const TOAST_TEXT: Record<ToastType, string> = {
  success: "text-green-800 dark:text-green-200",
  error: "text-red-800 dark:text-red-200",
  warning: "text-amber-800 dark:text-amber-200",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => {
          const config = TOAST_CONFIG[t.type];
          const Icon = config.icon;
          return (
            <div
              key={t.id}
              className={`${config.bg} ${config.border} border rounded-xl px-4 py-3 shadow-lg animate-in slide-in-from-bottom-2 fade-in flex items-start gap-3`}
            >
              <Icon className={`size-5 shrink-0 mt-0.5 ${TOAST_TEXT[t.type]}`} />
              <p className={`text-sm font-medium flex-1 ${TOAST_TEXT[t.type]}`}>
                {t.message}
              </p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
