"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./style.module.css";
import LoginPage from "./LoginPage";
import AdminLoading from "./loading";
import NotificationDrawer from "@/components/admin/NotificationDrawer";
import PasswordModal from "@/components/admin/PasswordModal";
import { canViewPage, SYSTEM_ROLES } from "@/lib/permissions";
import {
  LuShieldAlert,
  LuCompass,
  LuLogOut,
  LuLock,
  LuEye,
  LuEyeOff,
  LuBriefcaseBusiness,
  LuLayoutDashboard,
  LuShip,
  LuFolderOpen,
  LuMessageCircleQuestion,
  LuMail,
  LuSettings,
  LuBellDot,
  LuChevronRight,
  LuMenu,
  LuX,
  LuDatabase,
  LuCircleGauge,
  LuLayers,
  LuFileText,
  LuUsers,
  LuKey,
} from "react-icons/lu";
import { RiLockPasswordLine } from "react-icons/ri";
import { TbBrandGoogleBigQuery } from "react-icons/tb";

import logo from "../../../public/assets/images/logo.png";
import image1 from "../../../public/assets/images/about-image-1.jpg";
import image2 from "../../../public/assets/images/about-image-2.jpg";
import image3 from "../../../public/assets/images/about-image-3.jpg";

const sliderImages = [image1, image2, image3];

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const AUTH_LOADER_DELAY = 100;
const DEFAULT_LAUNCH_PAGE = "/admin/dashboard";

// Navigation structure
const NAV_ITEMS = [
  {
    type: "item",
    key: "dashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LuLayoutDashboard,
  },
  {
    type: "group",
    key: "cms",
    label: "CMS",
    icon: LuLayers,
    children: [
      { key: "services", label: "Services", href: "/admin/services", icon: LuShip },
      { key: "projects", label: "Projects", href: "/admin/projects", icon: LuFolderOpen },
      { key: "careers", label: "Careers", href: "/admin/careers", icon: LuBriefcaseBusiness },
      { key: "faqs", label: "FAQs", href: "/admin/faqs", icon: LuMessageCircleQuestion },
    ],
  },
  {
    type: "group",
    key: "forms",
    label: "Forms",
    icon: LuFileText,
    children: [
      { key: "contact", label: "Contact Us", href: "/admin/contact", icon: LuMail },
      { key: "queries", label: "General Queries", href: "/admin/queries", icon: TbBrandGoogleBigQuery },
    ],
  },
  {
    type: "item",
    key: "notifications",
    label: "Notifications",
    href: "/admin/notifications",
    icon: LuBellDot,
  },
  {
    type: "group",
    key: "roles",
    label: "Settings",
    icon: LuShieldAlert,
    superAdminOnly: true,
    children: [
      { key: "master", label: "Master", href: "/admin/master", icon: LuKey },
      { key: "users", label: "User Management", href: "/admin/users", icon: LuUsers },
      { key: "sessions", label: "Sessions", href: "/admin/sessions", icon: LuCircleGauge },
    ],
  },
];

// Page titles for header
const PAGE_TITLES = {
  dashboard: "Dashboard",
  services: "Services",
  projects: "Projects",
  careers: "Careers",
  faqs: "FAQs",
  contact: "Contact",
  queries: "General Queries",
  notifications: "Activity Center",
  users: "User Management",
  sessions: "Sessions",
  master: "Master Settings",
};

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [isCurrentlyLocked, setIsCurrentlyLocked] = useState(false);
  const [minsLeft, setMinsLeft] = useState(0);
  const [loginError, setLoginError] = useState("");

  // Modals & UI States
  const [sliderIndex, setSliderIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [remoteTerminatedModal, setRemoteTerminatedModal] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);



  // Live clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Intercept window.fetch to automatically append X-Performed-By header for write requests
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
      const method = (options.method || "GET").toUpperCase();
      if (typeof url === "string" && url.startsWith("/api/") && ["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
        const sessionStr = localStorage.getItem("pmv_admin_session");
        if (sessionStr) {
          try {
            const parsed = JSON.parse(sessionStr);
            const user = parsed.user;
            const performedBy = user ? (user.fullName || user.username) : "Admin";
            options.headers = {
              ...options.headers,
              "X-Performed-By": encodeURIComponent(performedBy),
            };
          } catch (e) {
            console.error("Error setting X-Performed-By header:", e);
          }
        }
      }
      return originalFetch(url, options);
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Fetch unread notifications count for sidebar badge
  const fetchUnreadNotificationsCount = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUnreadNotificationsCount(data.totalUnread || 0);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUnreadNotificationsCount();
      const interval = setInterval(fetchUnreadNotificationsCount, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, pathname, fetchUnreadNotificationsCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSliderIndex((prev) => (prev + 1) % sliderImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 1024) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    }

    const activeGroupKeys = NAV_ITEMS.filter(
      (item) =>
        item.type === "group" &&
        item.children &&
        item.children.some((child) => child.href === pathname)
    ).map((item) => item.key);

    if (activeGroupKeys.length > 0) {
      setExpandedGroups(activeGroupKeys);
    }
  }, [pathname]);

  // Check initial session
  useEffect(() => {
    const sessionStr = localStorage.getItem("pmv_admin_session");
    let authenticated = false;
    let parsedSession = null;

    if (sessionStr) {
      try {
        parsedSession = JSON.parse(sessionStr);
        if (parsedSession.loggedIn && Date.now() < new Date(parsedSession.expiresAt).getTime()) {
          authenticated = true;
        } else {
          localStorage.removeItem("pmv_admin_session");
        }
      } catch (e) {
        localStorage.removeItem("pmv_admin_session");
      }
    }

    setTimeout(() => {
      if (authenticated) {
        setIsLoggedIn(true);
        setSessionData(parsedSession);
      } else {
        setIsLoggedIn(false);
        setSessionData(null);
      }
      setIsCheckingAuth(false);
    }, AUTH_LOADER_DELAY);
  }, []);

  // Periodic active session verification (Detect Super Admin remote termination)
  const verifyRemoteSession = useCallback(async () => {
    if (!isLoggedIn || !sessionData?.sessionToken) return;

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: sessionData.sessionToken }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.valid) {
          // Session was remotely terminated or expired
          setIsLoggedIn(false);
          setSessionData(null);
          localStorage.removeItem("pmv_admin_session");
          setRemoteTerminatedModal(true);
          router.replace("/admin");
        } else if (data.user) {
          // Sync fresh user role and permissions from MongoDB
          const updatedSession = { ...sessionData, user: data.user };
          setSessionData(updatedSession);
          localStorage.setItem("pmv_admin_session", JSON.stringify(updatedSession));
        }
      }
    } catch (err) {
      console.error("Session check error:", err);
    }
  }, [isLoggedIn, sessionData, router]);

  useEffect(() => {
    if (isLoggedIn) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      verifyRemoteSession();
      const interval = setInterval(verifyRemoteSession, 5000); // Check every 5s
      window.addEventListener("focus", verifyRemoteSession);
      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", verifyRemoteSession);
      };
    }
  }, [isLoggedIn, pathname, verifyRemoteSession]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setLoginError("Please enter both email address and password.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: usernameInput.trim(),
          username: usernameInput.trim(),
          password: passwordInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Invalid login credentials.");
      } else {
        setIsLoggedIn(true);
        setSessionData(data.session);
        localStorage.setItem("pmv_admin_session", JSON.stringify(data.session));
        setUsernameInput("");
        setPasswordInput("");
        router.push(DEFAULT_LAUNCH_PAGE);
      }
    } catch (err) {
      setLoginError("Login request failed. Check connection.");
    }
  };

  const confirmLogout = async () => {
    if (sessionData?.sessionToken) {
      try {
        await fetch("/api/sessions/terminate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken: sessionData.sessionToken,
            isSelfLogout: true,
          }),
        });
      } catch (err) {
        console.error("Error logging out session:", err);
      }
    }

    setIsLoggedIn(false);
    setSessionData(null);
    setSidebarOpen(false);
    setShowLogoutModal(false);
    localStorage.removeItem("pmv_admin_session");
    router.replace("/admin");
  };

  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) =>
      prev.includes(groupKey) ? prev.filter((k) => k !== groupKey) : [...prev, groupKey]
    );
  };

  const getActiveKey = () => {
    const segment = pathname.replace("/admin/", "").split("/")[0];
    return segment || "dashboard";
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const activeKey = getActiveKey();
  const isSuperAdmin = sessionData?.user?.role === SYSTEM_ROLES.SUPER_ADMIN;

  // Filter NAV_ITEMS based on user permissions safely after hydration
  const filteredNavItems = useMemo(() => {
    if (!mounted) return NAV_ITEMS;

    return NAV_ITEMS.map((item) => {
      if (item.superAdminOnly && !isSuperAdmin) return null;

      if (item.type === "group") {
        const allowedChildren = item.children.filter((child) =>
          canViewPage(sessionData?.user, child.key)
        );
        if (allowedChildren.length === 0) return null;
        return { ...item, children: allowedChildren };
      }

      if (item.type === "item") {
        if (!canViewPage(sessionData?.user, item.key)) return null;
      }

      return item;
    }).filter(Boolean);
  }, [mounted, isSuperAdmin, sessionData]);

  // 1. INITIAL AUTHENTICATION CHECK LOADER
  if (isCheckingAuth) {
    return <AdminLoading />;
  }

  // 2. UNAUTHENTICATED LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <LoginPage
        usernameInput={usernameInput}
        setUsernameInput={setUsernameInput}
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        isCurrentlyLocked={isCurrentlyLocked}
        minsLeft={minsLeft}
        loginError={loginError}
        handleLogin={handleLogin}
        sliderIndex={sliderIndex}
        setSliderIndex={setSliderIndex}
      />
    );
  }

  // 3. AUTHENTICATED WEB APP SHELL
  return (
    <div className="min-h-screen bg-slate-50 font-sans relative">

      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarVisible : styles.sidebarHidden}`}
      >
        {/* Logo Section */}
        <div className="p-5 pb-4 border-b bg-white border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src={logo} width={45} height={45} alt="PMV Logo" />
            <div className="flex flex-col gap-1">
              <h1 className="font-oswald text-[22px] font-bold text-secondary tracking-wide leading-5">
                PMV Maritime<span className="text-primary">.</span>
              </h1>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                {sessionData?.user?.role || "Admin Panel"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-primary transition-colors"
          >
            <LuX className="text-lg" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 relative">
          <div className={styles.bachgroundAnchor}></div>
          {filteredNavItems.map((item) => {
            if (item.type === "item") {
              const isActive = activeKey === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""} justify-between`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="text-base flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.key === "notifications" && unreadNotificationsCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-red-600 text-white rounded-full leading-none shadow-xs">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </Link>
              );
            }

            if (item.type === "group") {
              const isExpanded = expandedGroups.includes(item.key);
              const GroupIcon = item.icon;

              return (
                <div key={item.key}>
                  <button
                    onClick={() => toggleGroup(item.key)}
                    className={`${styles.groupLabel} w-full text-left`}
                  >
                    <div className="flex items-center gap-2.5">
                      {GroupIcon && <GroupIcon className="text-base flex-shrink-0" />}
                      <span>{item.label}</span>
                    </div>
                    <LuChevronRight
                      className={`${styles.groupChevron} ${isExpanded ? styles.groupChevronOpen : ""}`}
                    />
                  </button>

                  <div
                    className="overflow-hidden transition-all duration-250 ease-in-out bg-white/5"
                    style={{
                      maxHeight: isExpanded ? `${item.children.length * 50 + 16}px` : "0px",
                      opacity: isExpanded ? 1 : 0,
                    }}
                  >
                    {item.children.map((child) => {
                      const isChildActive = activeKey === child.key;
                      return (
                        <Link
                          key={child.key}
                          href={child.href}
                          className={`${styles.navSubItem} ${isChildActive ? styles.navSubItemActive : ""}`}
                        >
                          <child.icon className="text-lg pb-1 flex-shrink-0" />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </nav>

        {/* Premium User Profile Card & Integrated Logout */}
        <div className="p-3.5 bg-slate-900 text-white border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            {/* Avatar Circle with Online Dot */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 bg-secondary border border-white/20 text-white font-black text-sm uppercase flex items-center justify-center shadow-xs">
                {(sessionData?.user?.fullName || "A").charAt(0)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>

            {/* User Meta */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-white truncate leading-snug">
                  {sessionData?.user?.fullName || "Administrator"}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono truncate">
                {sessionData?.user?.email || "admin@pmvmaritime.com"}
              </p>
              <div className="leading-4">
                <span className="text-[9px] font-black uppercase tracking-wider text-white inline-block">
                  {sessionData?.user?.role || "ADMIN"}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Action Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500 hover:border-red-600 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LuLogOut className="text-sm" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className={`${styles.content} ${sidebarOpen ? "" : styles.contentFull}`}>
        {/* Sticky Top Header */}
        <div className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 px-3 md:px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-2 bg-slate-50 border border-gray-200 text-secondary hover:bg-slate-100 transition-all flex items-center justify-center"
              title="Toggle Sidebar"
            >
              <LuMenu className="text-xl" />
            </button>
            <h1 className="font-oswald text-xl md:text-2xl font-bold text-secondary tracking-wide">
              {PAGE_TITLES[activeKey] || "Dashboard"}
            </h1>
          </div>

          {/* Header Controls: Maintenance Mode & Change Password Trigger */}
          <div className="flex items-center gap-3">


            <button
              onClick={() => setShowPassModal(true)}
              className=" cursor-pointer"
              title="Change Password"
            >
              <RiLockPasswordLine className="text-2xl text-secondary" />
            </button>

            <div className="hidden md:flex flex-col items-end border-l border-gray-200 pl-3">
              <span className="text-xl font-bold leading-5 text-primary font-mono">
                {mounted
                  ? currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
                  : "--:--:--"}
              </span>
              <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                {mounted
                  ? currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
                  : "Loading..."}
              </span>
            </div>
          </div>
        </div>

        {/* Route Level Permission Check */}
        {(() => {
          const checkPathPermission = () => {
            if (isSuperAdmin) return true;
            if (pathname === "/admin/dashboard" || pathname === "/admin") return true;
            if (pathname.startsWith("/admin/services")) return canViewPage(sessionData?.user, "services");
            if (pathname.startsWith("/admin/projects")) return canViewPage(sessionData?.user, "projects");
            if (pathname.startsWith("/admin/careers")) return canViewPage(sessionData?.user, "careers");
            if (pathname.startsWith("/admin/faqs")) return canViewPage(sessionData?.user, "faqs");
            if (pathname.startsWith("/admin/contact")) return canViewPage(sessionData?.user, "contact");
            if (pathname.startsWith("/admin/users") || pathname.startsWith("/admin/sessions")) return isSuperAdmin;
            return true;
          };

          if (!checkPathPermission()) {
            return (
              <div className="p-8 text-center bg-white border border-gray-200 m-6 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 bg-red-50 text-red-600 border border-red-200 flex items-center justify-center text-3xl mb-4">
                  <LuShieldAlert />
                </div>
                <h2 className="font-oswald text-2xl font-bold text-secondary uppercase tracking-wider">
                  403 - Access Restricted
                </h2>
                <p className="text-sm text-gray-500 max-w-md mt-1">
                  You do not have permission to access this section ({PAGE_TITLES[activeKey] || pathname}). Please contact your Super Administrator to request access.
                </p>
                <Link
                  href="/admin/dashboard"
                  className="mt-6 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider transition-colors inline-block"
                >
                  Return to Dashboard
                </Link>
              </div>
            );
          }

          return children;
        })()}
      </main>

      {/* Change Password Modal */}
      <PasswordModal
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
        userSession={sessionData}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-gray-200 shadow-2xl p-6 md:p-8 relative">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 border border-red-100 text-primary flex items-center justify-center flex-shrink-0">
                <LuShieldAlert className="text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-oswald text-xl font-bold text-secondary uppercase tracking-wide">
                  Logout Confirmation<span className="text-primary">.</span>
                </h3>
                <p className="text-sm text-gray-600 font-medium mt-1 leading-relaxed">
                  Are you sure you want to log out from the PMV Admin Portal?
                </p>
              </div>
            </div>

            <div className="mt-3 sm:mt-8 flex flex-col-reverse sm:flex-row items-center justify-end gap-1 sm:gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full sm:w-fit px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="w-full sm:w-fit px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex justify-center sm:justify-start items-center gap-2"
              >
                <LuLogOut className="text-sm" />
                <span>Yes, Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remote Session Terminated / Expired Modal */}
      {remoteTerminatedModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-gray-200 shadow-2xl p-6 md:p-8 relative">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 border border-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <LuShieldAlert className="text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-oswald text-xl font-bold text-secondary uppercase tracking-wide">
                  Session Terminated<span className="text-primary">.</span>
                </h3>
                <p className="text-sm text-gray-600 font-medium mt-1 leading-relaxed">
                  Your active session has been remotely terminated by the Super Administrator or has expired.
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setRemoteTerminatedModal(false);
                  router.push("/admin");
                }}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

