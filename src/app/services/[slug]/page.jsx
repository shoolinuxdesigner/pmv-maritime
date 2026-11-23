"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import SubBanner from "@/components/Sub Banner/page";
import SubHeading from "@/design/sub-heading/page";
import { renderIconById } from "@/lib/maritimeIcons";

// Images
import bannerBg from "../../../../public/assets/images/map-bg.png";
import colorLogo from "../../../../public/assets/images/banner-anchor-color.png";

// SVG
import stepArrow from "../../../../public/assets/svg/step.svg";
import stepArrowActive from "../../../../public/assets/svg/step-active.svg";

// Icons
import { IoMdCall } from "react-icons/io";
import { PiDownloadSimpleBold } from "react-icons/pi";
import {
  TbCheck,
  TbSearch,
  TbChartBar,
  TbCalendar,
  TbUsers,
  TbShieldCheck,
  TbActivity,
  TbCompass,
  TbUserCheck,
  TbShip,
  TbEye,
  TbTrendingUp,
  TbAward,
  TbUserShield,
} from "react-icons/tb";
import {
  LuHandshake,
  LuShipWheel,
  LuLoader,
  LuX,
  LuMail,
  LuPhone,
  LuUser,
  LuFileText,
  LuArrowRight,
  LuClock,
  LuRefreshCw,
  LuCircleAlert,
} from "react-icons/lu";
import { MdOutlineAnchor } from "react-icons/md";
import ContactUs from "@/components/Contact Us/page";
import toast from "react-hot-toast";
import { getDirectDownloadUrl } from "@/lib/utils";

// ─── STATIC SECTIONS (same for every service) ────────────────────────────────

const deliverySteps = [
  { step: "1", title: "Discover", description: "We define project scope, timelines, and expected outcomes.", icon: TbSearch },
  { step: "2", title: "Assess", description: "We assess requirements and identify technical priorities.", icon: TbChartBar },
  { step: "3", title: "Plan", description: "We create a delivery plan with milestones and risk controls.", icon: TbCalendar },
  { step: "4", title: "Execute", description: "We execute with experienced teams and strong coordination.", icon: TbUsers },
  { step: "5", title: "Verify", description: "We monitor quality, compliance, progress, and performance.", icon: TbShieldCheck },
  { step: "6", title: "Report & Improve", description: "We report results and improve through continuous feedback.", icon: TbActivity },
];

const serviceStandards = [
  { title: "Quality", description: "Professional, technical, and operational standards applied to every assignment.", icon: TbCompass },
  { title: "Safety", description: "Protection of people, vessels, cargo, assets, and the environment.", icon: TbShieldCheck },
  { title: "Compliance", description: "Support for statutory, regulatory, classification, and industry requirements.", icon: TbUserCheck },
  { title: "Accountability", description: "Clear responsibilities and ownership at every stage.", icon: TbShip },
  { title: "Transparency", description: "Open communication and accurate reporting.", icon: TbEye },
  { title: "Commercial Value", description: "Solutions that reduce risk, improve efficiency, control costs, and performance.", icon: TbTrendingUp },
  { title: "Timely Execution", description: "Careful planning and a strong focus on agreed deadlines.", icon: LuShipWheel },
  { title: "Reliability", description: "Consistent support and dependable delivery.", icon: TbAward },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  // ── Brochure Download & OTP State ──────────────────────────────────────────
  const [isBrochureModalOpen, setIsBrochureModalOpen] = useState(false);
  const [brochureStep, setBrochureStep] = useState("form"); // "form" | "otp" | "success"
  const [leadForm, setLeadForm] = useState({ fullName: "", phone: "", email: "" });
  const [formErrors, setFormErrors] = useState({ fullName: "", phone: "", email: "" });
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedDownloadUrl, setVerifiedDownloadUrl] = useState("");

  useEffect(() => {
    async function fetchService() {
      setLoading(true);
      try {
        const res = await fetch(`/api/services?slug=${slug}`, { cache: "no-store" });
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        if (data?.error) { setNotFound(true); return; }
        setService(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchService();
  }, [slug]);

  // Animated delivery steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStepIdx((prev) => (prev + 1) % deliverySteps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Cooldown countdown timer for Resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDownloadBrochure = (url) => {
    const rawTarget = (url || verifiedDownloadUrl || service?.brochureUrl || "").trim();
    const safeFileName = `${(service?.name || "PMV-Maritime-Service")
      .replace(/[^a-zA-Z0-9_\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_")}-Brochure.pdf`;

    // 1. If it's a local static or uploaded file (e.g. /docs/services.pdf)
    if (rawTarget.startsWith("/") && !rawTarget.startsWith("//")) {
      const link = document.createElement("a");
      link.href = rawTarget;
      link.setAttribute("download", safeFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Brochure download started!");
      return;
    }

    // 2. Direct download endpoint via backend proxy to ensure the browser downloads the PDF directly
    // without opening any new tab or navigating away from the current page
    const downloadEndpoint = `/api/brochure/download?slug=${encodeURIComponent(slug)}${rawTarget ? `&url=${encodeURIComponent(rawTarget)}` : ""
      }`;

    try {
      const link = document.createElement("a");
      link.href = downloadEndpoint;
      link.setAttribute("download", safeFileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      let dlIframe = document.getElementById("hidden-brochure-downloader");
      if (!dlIframe) {
        dlIframe = document.createElement("iframe");
        dlIframe.id = "hidden-brochure-downloader";
        dlIframe.style.display = "none";
        document.body.appendChild(dlIframe);
      }
      dlIframe.src = downloadEndpoint;
    }
    toast.success("Brochure download started!");
  };

  const validateField = (field, value) => {
    const val = (value || "").trim();
    if (field === "fullName") {
      if (!val) return "Full Name is required.";
      if (val.length < 2) return "Name must be at least 2 characters long.";
      if (!/^[a-zA-Z\s.'-]+$/.test(val)) return "Please enter a valid name (letters only).";
      return "";
    }
    if (field === "phone") {
      if (!val) return "Mobile / WhatsApp number is required.";
      if (!/^[+0-9\s\-()]{7,18}$/.test(val)) return "Please enter a valid phone number (min 7 digits).";
      return "";
    }
    if (field === "email") {
      if (!val) return "Email address is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Please enter a valid email address (e.g. name@company.com).";
      return "";
    }
    return "";
  };

  const handleInputChange = (field, value) => {
    setLeadForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleInputBlur = (field) => {
    const err = validateField(field, leadForm[field]);
    setFormErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();

    const nameErr = validateField("fullName", leadForm.fullName);
    const phoneErr = validateField("phone", leadForm.phone);
    const emailErr = validateField("email", leadForm.email);

    if (nameErr || phoneErr || emailErr) {
      setFormErrors({ fullName: nameErr, phone: phoneErr, email: emailErr });
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/brochure/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send-otp",
          fullName: leadForm.fullName.trim(),
          phone: leadForm.phone.trim(),
          email: leadForm.email.trim(),
          serviceName: service?.name || "PMV Maritime Service",
          serviceSlug: slug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      toast.success("Verification code sent to your email!");
      setResendCooldown(60);
      setBrochureStep("otp");
      setOtpError("");
    } catch (err) {
      toast.error(err.message || "Failed to send verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();

    const cleanOtp = otpValue.trim();
    if (!cleanOtp) {
      setOtpError("Please enter the 6-digit verification code.");
      return;
    }
    if (cleanOtp.length !== 6) {
      setOtpError("Verification code must be exactly 6 digits.");
      return;
    }

    setOtpError("");
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/brochure/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify-otp",
          email: leadForm.email.trim(),
          otp: cleanOtp,
          serviceSlug: slug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Incorrect or expired verification code.");
      }

      toast.success("Verification successful!");
      setIsVerified(true);
      const dlUrl = data.downloadUrl || service?.brochureUrl || "/docs/services.pdf";
      setVerifiedDownloadUrl(dlUrl);

      // Transition loader step
      setBrochureStep("success");
      setIsConverting(true);

      // After 1.2s loader, automatically trigger downloading the PDF directly
      setTimeout(() => {
        setIsConverting(false);
        handleDownloadBrochure(dlUrl);
      }, 1200);
    } catch (err) {
      setOtpError(err.message || "Verification failed. Please check the code.");
      toast.error(err.message || "Verification failed. Please check the code.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <SubBanner
          Heading="Loading..."
          breadcrumbItems={[{ label: "Our Services", href: "/services" }, { label: "...", href: "#" }]}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <LuLoader className="text-4xl animate-spin text-primary" />
            <p className="text-sm font-medium">Loading service details...</p>
          </div>
        </div>
      </>
    );
  }

  // ── Not Found ─────────────────────────────────────────────────────────────
  if (notFound || !service) {
    return (
      <>
        <SubBanner
          Heading="Service Not Found"
          breadcrumbItems={[{ label: "Our Services", href: "/services" }, { label: "Not Found", href: "#" }]}
        />
        <div className="container max-w-7xl mx-auto py-16 px-4 text-center">
          <MdOutlineAnchor className="text-5xl text-gray-300 mx-auto mb-4" />
          <h2 className="font-oswald text-2xl font-bold text-secondary-dark mb-2">Service Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">The service you are looking for does not exist or has been removed.</p>
          <Link href="/services" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold text-sm uppercase tracking-wider hover:bg-primary-hover transition-all">
            View All Services
          </Link>
        </div>
      </>
    );
  }

  const highlights = Array.isArray(service.highlights) ? service.highlights : [];
  const deliverables = Array.isArray(service.deliverables) ? service.deliverables : [];

  return (
    <>
      {/* ── Sub Banner ──────────────────────────────────────────────────────── */}
      <SubBanner
        Heading={service.name}
        breadcrumbItems={[
          { label: "Our Services", href: "/services" },
          { label: service.name, href: `/services/${slug}` },
        ]}
      />

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row container max-w-7xl mx-auto items-stretch relative overflow-hidden">
        <Image src={bannerBg} alt="Banner Background" className="object-cover opacity-50 pointer-events-none z-0 absolute right-0" />
        <div className="w-full flex flex-col border border-t-0 border-gray-200 bg-[#f7f5f8]">
          <div className="flex flex-col md:flex-row py-8 px-4 md:px-8 border-b border-gray-200">
            <div className="flex flex-col w-full md:w-7/12">
              <h1 className="font-oswald text-4xl md:text-5xl text-secondary-dark font-bold mb-2 md:mb-3">
                {service.name}
              </h1>
              <p className="text-sm md:text-[15px] max-w-full md:max-w-[90%] text-gray-600 font-medium">
                {service.shortDesc}
              </p>
            </div>
            <div className="relative z-5 w-full md:w-5/12 flex flex-col justify-end items-end mt-6 md:mt-0">
              <div className="w-full md:w-fit">
                <a
                  href="tel:+971505342726"
                  className="group w-full text-[16px] md:text-[14px] flex gap-3 justify-center items-center mb-2 pl-3 md:pl-4 pr-2 md:pr-3 py-1.5 md:py-2 bg-primary hover:bg-primary-hover text-white font-bold tracking-wider shadow-lg"
                >
                  <IoMdCall />
                  Talk to an Expert
                </a>
                {isVerified ? (
                  <button
                    type="button"
                    onClick={() => handleDownloadBrochure(verifiedDownloadUrl || service?.brochureUrl)}
                    className="group w-full md:w-fit justify-center text-[16px] md:text-[14px] flex gap-3 items-center pl-3 md:pl-4 pr-2 md:pr-3 py-1.5 md:py-2 bg-white hover:bg-primary-hover text-primary hover:text-white font-bold tracking-wider shadow-lg cursor-pointer transition-all"
                    title="Download Service Brochure"
                  >
                    <PiDownloadSimpleBold className="text-lg" />
                    Download Again
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setBrochureStep("form");
                      setIsBrochureModalOpen(true);
                    }}
                    className="group w-full md:w-fit justify-center text-[16px] md:text-[14px] flex gap-3 items-center pl-3 md:pl-4 pr-2 md:pr-3 py-1.5 md:py-2 bg-white hover:bg-primary-hover text-primary hover:text-white font-bold tracking-wider shadow-lg cursor-pointer transition-all"
                    title="Download Service Brochure"
                  >
                    <PiDownloadSimpleBold />
                    Download Brochure
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3 Highlight Cards (dynamic from DB) ─────────────────────────────── */}
      {highlights.length > 0 && (
        <section className="container max-w-7xl mx-auto">
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(highlights.length, 3)} border-x border-b border-gray-200 bg-white divide-y md:divide-y-0 md:divide-x divide-gray-200`}>
            {highlights.map((pillar) => (
              <div key={pillar.title} className="flex items-start gap-4 p-5 md:p-6 bg-white">
                <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 bg-secondary-dark/5 text-secondary-dark flex items-center justify-center">
                  {renderIconById(pillar.icon, "w-6 h-6 md:w-7 md:h-7")}
                </div>
                <div>
                  <h3 className="font-bold text-secondary-dark text-base md:text-[17px]">{pillar.title}</h3>
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed mt-1 font-medium">
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── About The Service heading ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row container max-w-7xl mx-auto items-stretch relative overflow-hidden">
        <Image src={bannerBg} alt="Banner Background" className="object-cover opacity-40 pointer-events-none z-0 absolute right-0 -top-1/2" />
        <div className="w-full flex flex-col border border-t-0 border-gray-200">
          <div className="flex flex-col md:flex-row py-6 px-4 md:px-8">
            <div className="flex flex-row w-full items-center justify-between">
              <SubHeading title="About The Service" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Long Desc + Deliverables + Promise ──────────────────────────────── */}
      <section className="container max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-stretch border border-t-0 border-gray-200 bg-white overflow-hidden">
          <div className="flex flex-1 min-w-0 flex-col">
            {/* Icon + Long Description */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 p-5 md:p-6">
              <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 bg-[#ffedf1] flex items-center justify-center">
                {renderIconById(service.icon, "h-6 w-6 md:h-7 md:w-7 text-primary")}
              </div>
              <p className="max-w-[799px] text-base md:text-[17px] leading-relaxed md:leading-[26px] text-gray-800 font-medium">
                {service.longDesc || service.shortDesc}
              </p>
            </div>

            {/* What We Deliver */}
            {deliverables.length > 0 && (
              <>
                <div className="flex items-center border-y border-gray-200 flex-col md:flex-row py-3 px-4 md:px-8">
                  <h2 className="text-lg md:text-xl font-bold font-oswald text-secondary uppercase tracking-wide">
                    What <span className="text-secondary-dark">We Deliver</span>
                  </h2>
                </div>

                <div className="flex flex-row flex-wrap gap-y-3.5 gap-x-8 px-4 md:px-8 py-5">
                  {deliverables.map((item) => (
                    <div key={item} className="flex items-center gap-3 w-full md:w-[calc(50%-1rem)]">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <TbCheck className="h-3 w-3 text-white stroke-[2]" />
                      </span>
                      <p className="min-w-0 text-sm md:text-[15px] leading-snug font-medium text-gray-700">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Our Promise sidebar */}
          {service.promise && (
            <aside className="relative shrink-0 overflow-hidden bg-secondary-dark/5 border-t lg:border-t-0 lg:border-l border-[rgba(173,29,65,0.12)] shadow-[0_4px_16px_rgba(0,0,0,0.03)] lg:w-[320px] p-6 md:p-8 flex flex-col justify-center">
              <Image src={colorLogo} alt="Colored Logo" className="absolute top-0 right-0 opacity-5" />
              <div className="relative z-[1]">
                <LuHandshake className="mb-4 h-11 w-11 md:h-12 md:w-12 text-secondary-dark" />
                <div className="flex flex-col gap-2">
                  <h3 className="font-oswald text-xl md:text-2xl font-bold text-secondary-dark">
                    Our Promise
                  </h3>
                  <p className="text-sm md:text-[15px] leading-relaxed text-gray-700">
                    {service.promise}
                  </p>
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* ── HOW WE DELIVER (static) ──────────────────────────────────────────── */}
      <section className="container max-w-7xl mx-auto">
        <div className="bg-white md:border-x md:border-b border-gray-200">
          <div className="flex items-center py-3 px-4 md:px-8">
            <h2 className="text-lg md:text-xl font-bold font-oswald text-secondary uppercase tracking-wide">
              How <span className="text-secondary-dark">We Deliver</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 bg-white border-t border-gray-200">
            {deliverySteps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === activeStepIdx;
              return (
                <article
                  key={step.title}
                  onClick={() => setActiveStepIdx(idx)}
                  className={`relative flex flex-row md:flex-col items-center overflow-hidden border-b sm:border-b-0 lg:border-b-0 lg:border-r border-gray-200 last:border-r-0 pt-0 md:pt-6 cursor-pointer transition-all duration-300 ${isActive ? "bg-primary text-white" : "bg-white text-secondary-dark"
                    }`}
                >
                  <div className="w-0 md:w-full pointer-events-none overflow-hidden">
                    <Image
                      src={stepArrow}
                      alt="Arrow"
                      priority
                      className={`absolute inset-0 w-full object-cover transition-opacity duration-500 ease-in-out ${isActive ? "opacity-0" : "opacity-100"}`}
                    />
                    <Image
                      src={stepArrowActive}
                      alt="Arrow"
                      priority
                      className={`absolute inset-0 w-full object-cover transition-opacity duration-500 ease-in-out ${isActive ? "opacity-100" : "opacity-0"}`}
                    />
                  </div>
                  <div className="relative md:min-h-[80px] z-2 shrink-0 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                    <StepIcon className={`absolute h-6 w-6 md:h-12 md:w-12 transition-all duration-500 ease-in-out ${isActive ? "opacity-0 scale-90 pointer-events-none text-white" : "opacity-100 scale-100 text-secondary-dark"}`} />
                    <p className={`absolute text-4xl font-semibold font-oswald flex justify-center items-center w-10 transition-all duration-500 ease-in-out ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}`}>{step.step}</p>
                  </div>
                  <div className={`relative z-[1] mt-0 md:mt-5 flex w-full flex-1 flex-col items-center gap-1.5 border-l md:border-l-0 md:border-t border-gray-200 px-3.5 pb-5 pt-3 text-center transition-colors duration-500 ease-in-out ${isActive ? "bg-[#fff3f6]" : "bg-[#f8fafc]"}`}>
                    <h3 className={`w-full text-base md:text-[17px] font-bold transition-colors duration-500 ${isActive ? "text-primary" : "text-secondary-dark"}`}>{step.title}</h3>
                    <p className="w-full text-xs md:text-[13px] px-0 md:px-2 text-gray-600 font-medium leading-relaxed">{step.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* ── OUR SERVICE STANDARDS (static) ──────────────────────────────────── */}
        <div className="bg-white border-x border-b border-gray-200">
          <div className="flex items-center border-b border-gray-200 py-3 px-4 md:px-8">
            <h2 className="text-lg md:text-xl font-bold font-oswald text-secondary uppercase tracking-wide">
              Our Service <span className="text-secondary-dark">Standards</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            {serviceStandards.map((standard) => {
              const StandardIcon = standard.icon;
              return (
                <article
                  key={standard.title}
                  className="flex min-h-[140px] items-start gap-4 border-r border-b border-gray-200 bg-white p-5 md:p-6"
                >
                  <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 bg-primary/5 text-primary flex items-center justify-center">
                    <StandardIcon className="h-6 w-6 md:h-7 md:w-7" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h3 className="w-full text-base md:text-[17px] font-bold text-gray-900">{standard.title}</h3>
                    <p className="w-full text-sm md:text-[14px] leading-relaxed text-gray-600 font-medium">{standard.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BROCHURE LEAD & OTP VERIFICATION MODAL ───────────────────────── */}
      {isBrochureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          {/* Backdrop click to close */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => {
              if (!isSendingOtp && !isVerifyingOtp) {
                setIsBrochureModalOpen(false);
              }
            }}
          />

          <div className="relative w-full max-w-lg bg-white border border-gray-200 z-10 overflow-hidden flex flex-col">
            {/* Header Accent Bar */}
            <div className="h-1.5 w-full bg-secondary-dark mb-1" />

            {/* Modal Header */}
            <div className="flex items-start justify-between p-3 md:px-6 md:py-4 border-b border-gray-200 bg-[#f7f5f8]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                  <LuFileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-oswald text-xl font-bold text-secondary-dark uppercase tracking-wide leading-tight">
                    {brochureStep === "otp"
                      ? "Verify Email"
                      : brochureStep === "success"
                        ? "Brochure Ready"
                        : "Download Brochure"}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium truncate max-w-[260px] sm:max-w-[340px]">
                    {service?.name || "PMV Maritime Service"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBrochureModalOpen(false)}
                disabled={isSendingOtp || isVerifyingOtp}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-40"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 md:px-6 md:pt-4 md:pb-3">
              {/* ── PHASE 1: LEAD FORM ───────────────────────────────────────── */}
              {brochureStep === "form" && (
                <form onSubmit={handleSendOtp} noValidate className="space-y-4">

                  {/* Full Name */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                      Full Name <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <LuUser className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-sm ${formErrors.fullName ? "text-red-500" : "text-gray-400"}`} />
                      <input
                        type="text"
                        value={leadForm.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        onBlur={() => handleInputBlur("fullName")}
                        placeholder="e.g. Captain David Miller"
                        className={`w-full bg-slate-50 border outline-none pl-10 pr-4 py-2.5 text-xs md:text-sm text-gray-900 placeholder-gray-400 font-medium transition-all ${formErrors.fullName
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20"
                          : "border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                          }`}
                      />
                    </div>
                    {formErrors.fullName && (
                      <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                        <LuCircleAlert className="text-xs shrink-0" />
                        <span>{formErrors.fullName}</span>
                      </p>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                      Mobile / WhatsApp Number <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <LuPhone className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-sm ${formErrors.phone ? "text-red-500" : "text-gray-400"}`} />
                      <input
                        type="tel"
                        value={leadForm.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        onBlur={() => handleInputBlur("phone")}
                        placeholder="e.g. +971 50 123 4567"
                        className={`w-full bg-slate-50 border outline-none pl-10 pr-4 py-2.5 text-xs md:text-sm text-gray-900 placeholder-gray-400 font-medium transition-all ${formErrors.phone
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20"
                          : "border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                          }`}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                        <LuCircleAlert className="text-xs shrink-0" />
                        <span>{formErrors.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                      Business Email Address <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <LuMail className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-sm ${formErrors.email ? "text-red-500" : "text-gray-400"}`} />
                      <input
                        type="email"
                        value={leadForm.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        onBlur={() => handleInputBlur("email")}
                        placeholder="e.g. david.miller@shippingco.com"
                        className={`w-full bg-slate-50 border outline-none pl-10 pr-4 py-2.5 text-xs md:text-sm text-gray-900 placeholder-gray-400 font-medium transition-all ${formErrors.email
                          ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/20"
                          : "border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary"
                          }`}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-red-500 text-[11px] font-semibold mt-1 flex items-center gap-1 animate-fadeIn">
                        <LuCircleAlert className="text-xs shrink-0" />
                        <span>{formErrors.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 mb-2">
                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                    >
                      {isSendingOtp ? (
                        <>
                          <LuLoader className="text-base animate-spin" />
                          <span>Sending Verification Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <LuArrowRight className="text-sm" />
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[10px] text-gray-400 text-center">
                    Your information is protected under PMV Maritime privacy guidelines.
                  </p>
                </form>
              )}

              {/* ── PHASE 2: OTP VERIFICATION ───────────────────────────────── */}
              {brochureStep === "otp" && (
                <form onSubmit={handleVerifyOtp} noValidate className="space-y-5 text-center">
                  <div className="bg-slate-50 p-4 border border-gray-200 text-left">
                    <p className="text-xs text-gray-600 font-medium">
                      We have dispatched a 6-digit verification code to:
                    </p>
                    <p className="text-sm font-bold text-secondary-dark mt-0.5 break-all">
                      {leadForm.email}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpValue}
                      onChange={(e) => {
                        setOtpValue(e.target.value.replace(/\D/g, ""));
                        if (otpError) setOtpError("");
                      }}
                      placeholder="• • • • • •"
                      autoFocus
                      required
                      className={`w-full max-w-[260px] mx-auto text-center tracking-[10px] text-2xl font-mono font-bold bg-slate-50 border-2 outline-none px-4 py-3 text-secondary-dark transition-all ${otpError
                        ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/20"
                        : "border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        }`}
                    />
                    {otpError && (
                      <p className="text-red-500 text-xs font-semibold mt-2 flex items-center justify-center gap-1 animate-fadeIn">
                        <LuCircleAlert className="text-xs shrink-0" />
                        <span>{otpError}</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpValue.length < 6}
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-98"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <LuLoader className="text-base animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <span>Verify & Download Brochure</span>
                    )}
                  </button>

                  {/* Resend button with visible countdown timer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setBrochureStep("form");
                        setOtpError("");
                      }}
                      className="text-xs font-semibold text-gray-500 hover:text-secondary-dark transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>←</span>
                      <span>Change Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={resendCooldown > 0 || isSendingOtp}
                      className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border ${resendCooldown > 0 || isSendingOtp
                        ? "bg-slate-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white text-primary border-primary hover:bg-primary hover:text-white shadow-xs cursor-pointer active:scale-95"
                        }`}
                    >
                      {isSendingOtp ? (
                        <>
                          <LuLoader className="text-xs animate-spin" />
                          <span>Resending...</span>
                        </>
                      ) : resendCooldown > 0 ? (
                        <>
                          <LuClock className="text-xs text-gray-400 animate-pulse" />
                          <span>
                            Resend Code ({String(Math.floor(resendCooldown / 60)).padStart(2, "0")}:{String(resendCooldown % 60).padStart(2, "0")})
                          </span>
                        </>
                      ) : (
                        <>
                          <LuRefreshCw className="text-xs" />
                          <span>Resend OTP</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* ── PHASE 3: VERIFICATION SUCCESS & CONVERTED DOWNLOAD BUTTON ── */}
              {brochureStep === "success" && (
                <div className="text-center space-y-5">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-3xl">
                    <TbCheck className="stroke-[3]" />
                  </div>

                  <div>
                    <h4 className="font-oswald text-xl font-bold text-secondary-dark uppercase tracking-wide">
                      Verification Successful!
                    </h4>
                    <p className="text-xs text-gray-600 font-medium mt-1">
                      Thank you, <strong className="text-gray-900">{leadForm.fullName}</strong>. Your brochure is ready.
                    </p>
                  </div>

                  {/* Dynamic Loader converting into Download PDF button */}
                  {isConverting ? (
                    <div className="w-full py-3.5 bg-slate-100 text-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 border border-gray-200">
                      <LuLoader className="text-base animate-spin" />
                      <span>Preparing Brochure Download...</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDownloadBrochure(verifiedDownloadUrl)}
                      className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PiDownloadSimpleBold className="text-lg" />
                      <span>Download PDF</span>
                    </button>
                  )}

                  <p className="text-[11px] text-gray-400">
                    If your download does not start automatically, click the button above.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ContactUs />
    </>
  );
}
