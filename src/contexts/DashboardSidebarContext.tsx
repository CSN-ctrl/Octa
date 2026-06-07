import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DashboardSidebarContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
};

const DashboardSidebarContext = createContext<DashboardSidebarContextValue | null>(null);

function getDefaultOpen(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(min-width: 1024px)").matches;
}

export function DashboardSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(getDefaultOpen);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setIsOpen(true);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo(
    () => ({ isOpen, setIsOpen, toggle }),
    [isOpen, toggle],
  );

  return (
    <DashboardSidebarContext.Provider value={value}>
      {children}
    </DashboardSidebarContext.Provider>
  );
}

export function useDashboardSidebar(): DashboardSidebarContextValue {
  const ctx = useContext(DashboardSidebarContext);
  if (!ctx) {
    return {
      isOpen: false,
      setIsOpen: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
