"use client";

import Link from "next/link";
import {
  createContext,
  type ComponentProps,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type PropsWithChildren
} from "react";
import { usePathname } from "next/navigation";

type NavigationProgressContextValue = {
  isNavigating: boolean;
  startNavigation: () => void;
  stopNavigation: () => void;
};

const NavigationProgressContext = createContext<NavigationProgressContextValue | null>(null);

export function NavigationProgressProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const timeoutRef = useRef<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  function clearPendingTimeout() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }

  function startNavigation() {
    clearPendingTimeout();
    setIsNavigating(true);
  }

  function stopNavigation() {
    clearPendingTimeout();
    setIsNavigating(false);
  }

  useEffect(() => {
    if (!isNavigating) {
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsNavigating(false);
      timeoutRef.current = null;
    }, 12000);

    return clearPendingTimeout;
  }, [isNavigating]);

  useEffect(() => {
    stopNavigation();
  }, [pathname]);

  const value = useMemo(
    () => ({
      isNavigating,
      startNavigation,
      stopNavigation
    }),
    [isNavigating]
  );

  return (
    <NavigationProgressContext.Provider value={value}>
      {children}
      <ImmediateNavigationIndicator />
    </NavigationProgressContext.Provider>
  );
}

function ImmediateNavigationIndicator() {
  const context = useNavigationProgress();

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[80] h-1 overflow-hidden transition-opacity duration-150 ${
          context.isNavigating ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="vexor-progress-bar h-full w-full" />
      </div>

      <div
        className={`pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/10 backdrop-blur-[1px] transition duration-150 ${
          context.isNavigating ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 rounded-full border border-white/60 bg-white/92 px-4 py-3 shadow-card">
          <div className="vexor-spinner h-6 w-6" />
          <p className="text-sm font-medium text-slate-700">Carregando proxima tela...</p>
        </div>
      </div>
    </>
  );
}

export function useNavigationProgress() {
  const context = useContext(NavigationProgressContext);

  if (!context) {
    throw new Error("useNavigationProgress must be used within NavigationProgressProvider.");
  }

  return context;
}

type AppLinkProps = ComponentProps<typeof Link> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    immediate?: boolean;
  };

export function AppLink({ immediate = true, onClick, ...props }: AppLinkProps) {
  const { startNavigation } = useNavigationProgress();
  const pathname = usePathname();
  const targetHref = typeof props.href === "string" ? props.href : props.href.pathname;

  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);

        if (
          immediate &&
          !event.defaultPrevented &&
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          targetHref &&
          targetHref !== pathname
        ) {
          startNavigation();
        }
      }}
    />
  );
}
