"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { LuMail, LuPhone, LuAnchor, LuLock, LuEye, LuEyeOff } from "react-icons/lu";

import logo from "../../../public/assets/images/logo-light.png";
import bannerAnchor from "../../../public/assets/images/banner-anchor.png";

export default function Maintenance() {
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Ctrl + Alt + K
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowModal(true);
        setError("");
        setPassword("");
        setShowPassword(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    let matchedMinutes = 0;

    // First try fetching dynamic bypass passwords from API
    try {
      const res = await fetch("/api/settings/maintenance");
      if (res.ok) {
        const data = await res.json();
        const bypasses = data.bypassPasswords || [];
        const match = bypasses.find((item) => item.password === password);
        if (match) {
          matchedMinutes = parseInt(match.durationMinutes, 10) || 20;
        }
      }
    } catch (err) {
      console.error("Error fetching dynamic maintenance bypass:", err);
    }

    // Fallback preset checks if not matched dynamically
    if (!matchedMinutes) {
      if (password === "itspmv@2026") {
        matchedMinutes = 20; // 20 minutes
      } else if (password === "samir@2026" || password === "chandan@2026") {
        matchedMinutes = 1200; // 20 hours
      }
    }

    if (matchedMinutes > 0) {
      const expiry = Date.now() + matchedMinutes * 60 * 1000;
      localStorage.setItem("maintenance_bypass_expiry", expiry.toString());
      document.cookie = `maintenance_bypass_expiry=${expiry}; path=/; max-age=${matchedMinutes * 60}; SameSite=Lax`;
      setShowModal(false);
      window.location.reload();
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-sky-950 via-sky-900 to-sky-950 flex items-center justify-center overflow-hidden">

      {/* Anchor pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url(${bannerAnchor?.src || (typeof bannerAnchor === "string" ? bannerAnchor : "/assets/images/banner-anchor.png")})`,
          backgroundSize: "50px",
          backgroundRepeat: "repeat",
        }}
      ></div>

      {/* Animated wave bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden" aria-hidden="true">
        <svg className="w-full h-28 md:h-36 opacity-10" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z" fill="currentColor" className="text-sky-400">
            <animate attributeName="d" dur="8s" repeatCount="indefinite"
              values="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z;
                      M0,80 C240,20 480,100 720,40 C960,100 1200,20 1440,80 L1440,120 L0,120 Z;
                      M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"
            />
          </path>
        </svg>
        <svg className="absolute bottom-0 left-0 w-full h-20 md:h-28 opacity-[0.06]" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,80 C360,20 720,100 1080,40 C1260,20 1380,60 1440,80 L1440,120 L0,120 Z" fill="currentColor" className="text-sky-300">
            <animate attributeName="d" dur="6s" repeatCount="indefinite"
              values="M0,80 C360,20 720,100 1080,40 C1260,20 1380,60 1440,80 L1440,120 L0,120 Z;
                      M0,40 C360,100 720,20 1080,80 C1260,100 1380,40 1440,40 L1440,120 L0,120 Z;
                      M0,80 C360,20 720,100 1080,40 C1260,20 1380,60 1440,80 L1440,120 L0,120 Z"
            />
          </path>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <Image
            src={logo || "/assets/images/logo-light.png"}
            alt="PMV Maritime Solutions Logo"
            className="w-14 h-20 object-contain cursor-pointer"
            onClick={() => setShowModal(true)}
            title="Administrator Access"
          />
          <div className="flex flex-col text-left">
            <h3 className="font-oswald text-2xl md:text-3xl font-bold text-white tracking-wide leading-none">
              <span className="text-sky-100">PMV</span> Maritime <br />
              <span className="text-sky-100">Solutions</span><span className="text-primary">.</span>
            </h3>
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-oswald text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
          We&apos;re Under<br />Maintenance<span className="text-primary">.</span>
        </h1>

        {/* Description */}
        <p className="text-slate-300 text-sm md:text-base leading-relaxed mt-5 max-w-md">
          Our systems are currently undergoing scheduled maintenance to serve you better. We&apos;ll be back online shortly. Thank you for your patience.
        </p>

        {/* Divider line */}
        <div className="w-16 h-[2px] bg-primary my-8"></div>

        {/* Contact info */}
        <div className="flex flex-col sm:flex-row items-center gap-6 text-white/70 text-sm">
          <a
            href="mailto:info@pmvmaritime.com"
            className="flex items-center gap-2 hover:text-white transition-colors duration-300"
          >
            <LuMail className="text-white/50 text-base" />
            <span className="font-semibold">info@pmvmaritime.com</span>
          </a>
          <div className="hidden sm:block w-px h-4 bg-white/20"></div>
          <a
            href="tel:+971505342726"
            className="flex items-center gap-2 hover:text-white transition-colors duration-300"
          >
            <LuPhone className="text-white/50 text-base" />
            <span className="font-semibold">+97 15053 42726</span>
          </a>
        </div>

        {/* Bottom copyright */}
        <div className="text-white/30 text-xs mt-12 font-medium flex items-center justify-center gap-1.5">
          <span>&copy; {new Date().getFullYear()} PMV Maritime Solutions. All rights reserved.</span>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-white/20 hover:text-white/60 transition-colors p-1 cursor-pointer"
            title="Administrator Bypass (Ctrl + Alt + K)"
          >
            <LuLock className="text-xs" />
          </button>
        </div>
      </div>

      {/* Password Prompt Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-sky-950 border border-sky-850 rounded shadow-2xl p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold cursor-pointer"
            >
              &times;
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <LuLock className="text-2xl" />
              </div>
              <h3 className="font-oswald text-xl font-bold text-white mb-2">Administrator Access</h3>
              <p className="text-slate-400 text-xs mb-6">Enter the administrator password to temporarily bypass maintenance mode (20 minutes or 20 hours).</p>

              <form onSubmit={handlePasswordSubmit} className="w-full">
                <div className="relative mb-3">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter administrator password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-sky-900 border border-sky-800 rounded pl-4 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-primary"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none cursor-pointer flex items-center justify-center"
                  >
                    {showPassword ? <LuEyeOff className="text-lg" /> : <LuEye className="text-lg" />}
                  </button>
                </div>
                {error && (
                  <p className="text-primary text-xs font-semibold text-left mb-3">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-hover text-white text-sm font-semibold py-2.5 rounded transition-colors duration-200 cursor-pointer"
                >
                  Verify Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
