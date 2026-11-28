"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header/page";
import Footer from "@/components/Footer/page";
import Maintenance from "@/components/Maintenance/page";
import SmoothScroll from "@/components/SmoothScroll";
import { Toaster } from "react-hot-toast";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import DraggableTimerBadge from "@/components/DraggableTimerBadge";

export default function ClientLayout({ children, maintenanceMode, showLoader }) {
  const [liveMaintenanceMode, setLiveMaintenanceMode] = useState(maintenanceMode);
  const [showMaintenance, setShowMaintenance] = useState(Boolean(maintenanceMode));
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(showLoader);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  // Poll live maintenance status every 3 seconds to instantly switch mode without page refresh
  useEffect(() => {
    let ignore = false;
    const pollMaintenance = async () => {
      try {
        const res = await fetch("/api/settings/maintenance", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            const isEnabled = Boolean(data.isEnabled);
            setLiveMaintenanceMode(isEnabled);
            if (!isEnabled) {
              setShowMaintenance(false);
              setTimeLeft("");
            } else {
              const bypassExpiry = localStorage.getItem("maintenance_bypass_expiry");
              if (bypassExpiry && parseInt(bypassExpiry, 10) > Date.now()) {
                setShowMaintenance(false);
              } else {
                setShowMaintenance(true);
              }
            }
          }
        }
      } catch (err) {
        // Suppress overlay popup during dev-server hot reloads or temporary offline
        if (process.env.NODE_ENV === "development") {
          console.warn("Could not poll maintenance mode (server may be restarting)");
        }
      }
    };

    pollMaintenance();
    const interval = setInterval(pollMaintenance, 3000);
    window.addEventListener("focus", pollMaintenance);
    return () => {
      ignore = true;
      clearInterval(interval);
      window.removeEventListener("focus", pollMaintenance);
    };
  }, []);

  useEffect(() => {
    if (!showLoader) return;

    let timer;
    const handleLoad = () => {
      timer = setTimeout(() => {
        setLoading(false);
      }, 300);
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
      const fallback = setTimeout(() => setLoading(false), 5000);
      return () => {
        window.removeEventListener("load", handleLoad);
        clearTimeout(fallback);
        clearTimeout(timer);
      };
    }
    return () => clearTimeout(timer);
  }, [showLoader]);

  useEffect(() => {
    if (!showLoader) return;
    if (prevPathname.current !== pathname) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 450);
      prevPathname.current = pathname;
      return () => clearTimeout(timer);
    }
  }, [pathname, showLoader]);

  useEffect(() => {
    if (!liveMaintenanceMode) return;

    const checkBypass = () => {
      const bypassExpiry = localStorage.getItem("maintenance_bypass_expiry");
      if (bypassExpiry) {
        const expiryTime = parseInt(bypassExpiry, 10);
        const difference = expiryTime - Date.now();
        if (difference > 0) {
          setShowMaintenance(false);
          // Sync cookie so server SSR matches client bypass on reload
          document.cookie = `maintenance_bypass_expiry=${expiryTime}; path=/; max-age=${Math.max(0, Math.floor(difference / 1000))}; SameSite=Lax`;
          const hours = Math.floor(difference / (1000 * 60 * 60));
          const mins = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((difference % (1000 * 60)) / 1000);
          if (hours > 0) {
            setTimeLeft(`${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
          } else {
            setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
          }
          return;
        } else {
          localStorage.removeItem("maintenance_bypass_expiry");
          document.cookie = "maintenance_bypass_expiry=; path=/; max-age=0";
        }
      }
      setShowMaintenance(true);
      setTimeLeft("");
    };

    checkBypass();
    const interval = setInterval(checkBypass, 1000);
    return () => clearInterval(interval);
  }, [liveMaintenanceMode]);

  const handleLogout = () => {
    localStorage.removeItem("maintenance_bypass_expiry");
    document.cookie = "maintenance_bypass_expiry=; path=/; max-age=0";
    setShowMaintenance(true);
    setTimeLeft("");
  };

  const hasBypass = liveMaintenanceMode && !showMaintenance && timeLeft;

  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      <ServiceWorkerRegister />
      <Toaster position="top-right" containerStyle={{ zIndex: 9999999 }} />
      {/* {!isAdmin && <SmoothScroll />} */}
      {loading && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <img src="/loader.gif" alt="Loading..." className="w-30 h-30 object-contain bg-white/60 p-2 rounded-full" />
        </div>
      )}
      {liveMaintenanceMode && showMaintenance && !isAdmin ? (
        <Maintenance />
      ) : (
        <>
          {hasBypass && !isAdmin && (
            <DraggableTimerBadge timeLeft={timeLeft} onLogout={handleLogout} />
          )}
          {!isAdmin && <Header />}
          {children}
          {!isAdmin && <Footer />}
        </>
      )}
    </>
  );
}
