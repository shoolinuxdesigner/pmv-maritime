"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  LuShip,
  LuFolderOpen,
  LuBriefcaseBusiness,
  LuMessageCircleQuestion,
  LuMail,
  LuPlus,
  LuArrowUpRight,
  LuClock,
  LuSparkles,
  LuExternalLink,
  LuChartBar,
  LuTrendingUp,
  LuCalendar,
  LuFilter,
  LuRefreshCw,
  LuChevronDown,
} from "react-icons/lu";
import { hasPermission, canViewPage } from "@/lib/permissions";

const BAR_CATEGORIES = [
  { key: "fleet", label: "Fleet", fullLabel: "Fleet Management", color: "#007BA7" },
  { key: "general", label: "General", fullLabel: "General Inquiry", color: "#00A3FF" },
  { key: "training", label: "Training", fullLabel: "Maritime Training", color: "#FEB019" },
  { key: "consultancy", label: "Consultancy", fullLabel: "Technical Consultancy", color: "#FF4560" },
  { key: "crew", label: "Crewing", fullLabel: "Crew Management", color: "#775DD0" },
  { key: "digital", label: "Digital", fullLabel: "Digital Solutions", color: "#c084fc" },
  { key: "others", label: "Others", fullLabel: "Other Inquiries", color: "#64748B" },
];

const ANNUAL_CONTACT_TYPES = [
  { key: "fleet", label: "Fleet Management", shortLabel: "Fleet", color: "#007BA7", dotShape: "circle" },
  { key: "general", label: "General Inquiries", shortLabel: "General", color: "#0284C7", dotShape: "diamond" },
  { key: "training", label: "Maritime Training", shortLabel: "Training", color: "#D97706", dotShape: "square" },
  { key: "consultancy", label: "Technical Consultancy", shortLabel: "Consultancy", color: "#DC2626", dotShape: "triangle" },
  { key: "crew", label: "Crew Management", shortLabel: "Crew", color: "#7C3AED", dotShape: "circle" },
  { key: "digital", label: "Digital Solutions", shortLabel: "Digital", color: "#DB2777", dotShape: "diamond" },
  { key: "others", label: "Other Inquiries", shortLabel: "Others", color: "#64748B", dotShape: "square" },
];

function resolveContactType(query) {
  const q = (query || "general").toLowerCase();
  for (const t of ANNUAL_CONTACT_TYPES) {
    if (t.key !== "others" && q.includes(t.key)) {
      return t.key;
    }
  }
  return "others";
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeChartTab, setActiveChartTab] = useState("bar"); // "bar" | "trend"

  // Date Filter State for Tab 1 (Bar Chart)
  const [datePreset, setDatePreset] = useState("all"); // "all" | "7days" | "30days" | "last3Months" | "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hoveredBarIndex, setHoveredBarIndex] = useState(null);

  // Year Dropdown & Contact Type Filter State for Tab 2 (Annual Trend Graph)
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all"); // "all" | contact type key
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(null);

  // Permission States (evaluates on mount)
  const [canViewSubmissions] = useState(() => canViewPage(null, "contact"));
  const [canCreateServices] = useState(() => hasPermission(null, "services:create"));
  const [canCreateProjects] = useState(() => hasPermission(null, "projects:create"));
  const [canCreateCareers] = useState(() => hasPermission(null, "careers:create"));
  const [canCreateFaqs] = useState(() => hasPermission(null, "faqs:create"));

  // Data state
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [careers, setCareers] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [servicesRes, projectsRes, careersRes, faqsRes, submissionsRes] =
        await Promise.all([
          fetch("/api/services?all=true", { cache: "no-store" }),
          fetch("/api/projects?all=true", { cache: "no-store" }),
          fetch("/api/careers", { cache: "no-store" }),
          fetch("/api/faqs", { cache: "no-store" }),
          fetch("/api/submissions", { cache: "no-store" }),
        ]);

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(Array.isArray(data) ? data : []);
      }
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(Array.isArray(data) ? data : []);
      }
      if (careersRes.ok) {
        const data = await careersRes.json();
        setCareers(Array.isArray(data) ? data : []);
      }
      if (faqsRes.ok) {
        const data = await faqsRes.json();
        setFaqs(Array.isArray(data) ? data : []);
      }
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setSubmissions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching dashboard analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) void fetchDashboardData();
    });
    return () => {
      ignore = true;
    };
  }, [fetchDashboardData]);

  // Derived metrics
  const activeServicesCount = services.filter((s) => !s.archived).length;
  const archivedServicesCount = services.filter((s) => s.archived).length;

  const activeProjectsCount = projects.filter((p) => !p.archived).length;
  const archivedProjectsCount = projects.filter((p) => p.archived).length;

  const seaJobsCount = careers.filter((c) => c.category === "sea").length;
  const shoreJobsCount = careers.filter((c) => c.category === "shore").length;

  // Compute available years from submissions
  const availableYears = useMemo(() => {
    const years = new Set(
      submissions
        .map((s) => new Date(s.createdAt).getFullYear())
        .filter((y) => !isNaN(y) && y > 2000)
    );
    const curr = new Date().getFullYear();
    years.add(curr);
    return Array.from(years).sort((a, b) => b - a);
  }, [submissions]);

  // Tab 1: Filter submissions by selected date range
  const filteredSubmissions = useMemo(() => {
    if (datePreset === "all") return submissions;

    const now = new Date();
    let from = null;
    let to = null;

    if (datePreset === "7days") {
      from = new Date();
      from.setDate(now.getDate() - 7);
      from.setHours(0, 0, 0, 0);
    } else if (datePreset === "30days") {
      from = new Date();
      from.setDate(now.getDate() - 30);
      from.setHours(0, 0, 0, 0);
    } else if (datePreset === "last3Months" || datePreset === "thisMonth") {
      from = new Date();
      from.setMonth(now.getMonth() - 3);
      from.setHours(0, 0, 0, 0);
    } else if (datePreset === "custom") {
      if (startDate) {
        from = new Date(startDate);
        from.setHours(0, 0, 0, 0);
      }
      if (endDate) {
        to = new Date(endDate);
        to.setHours(23, 59, 59, 999);
      }
    }

    return submissions.filter((s) => {
      const d = new Date(s.createdAt);
      if (isNaN(d.getTime())) return true;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [submissions, datePreset, startDate, endDate]);

  // Tab 1: Category counts for the Bar Chart
  const barChartData = useMemo(() => {
    const counts = {};
    BAR_CATEGORIES.forEach((c) => {
      counts[c.key] = 0;
    });

    filteredSubmissions.forEach((sub) => {
      const q = (sub.query || "general").toLowerCase();
      let matched = false;
      for (const cat of BAR_CATEGORIES) {
        if (cat.key !== "others" && q.includes(cat.key)) {
          counts[cat.key] += 1;
          matched = true;
          break;
        }
      }
      if (!matched) {
        counts.others += 1;
      }
    });

    const total = filteredSubmissions.length || 1;
    return BAR_CATEGORIES.map((cat) => ({
      ...cat,
      count: counts[cat.key] || 0,
      pct: Math.round(((counts[cat.key] || 0) / total) * 100),
    }));
  }, [filteredSubmissions]);

  const maxBarCount = Math.max(...barChartData.map((b) => b.count), 1);

  // Tab 2: 12-month Annual Aggregation of Contact Types Reached per Month
  const annualMonthlyTypeData = useMemo(() => {
    const targetYr = Number(selectedYear);
    const months = MONTH_NAMES.map((name, idx) => {
      const byType = {};
      ANNUAL_CONTACT_TYPES.forEach((t) => {
        byType[t.key] = 0;
      });
      return {
        month: name,
        monthIndex: idx,
        total: 0,
        byType,
      };
    });

    submissions.forEach((s) => {
      const d = new Date(s.createdAt);
      if (!isNaN(d.getTime()) && d.getFullYear() === targetYr) {
        const mIdx = d.getMonth();
        if (months[mIdx]) {
          const typeKey = resolveContactType(s.query);
          months[mIdx].byType[typeKey] = (months[mIdx].byType[typeKey] || 0) + 1;
          months[mIdx].total += 1;
        }
      }
    });

    return months;
  }, [submissions, selectedYear]);

  const yearlyTotalsByType = useMemo(() => {
    const totals = {};
    ANNUAL_CONTACT_TYPES.forEach((t) => {
      totals[t.key] = 0;
    });
    annualMonthlyTypeData.forEach((m) => {
      ANNUAL_CONTACT_TYPES.forEach((t) => {
        totals[t.key] += m.byType[t.key] || 0;
      });
    });
    return totals;
  }, [annualMonthlyTypeData]);

  const totalYearContacts = useMemo(
    () => Object.values(yearlyTotalsByType).reduce((acc, c) => acc + c, 0),
    [yearlyTotalsByType]
  );

  const maxTrendVal = useMemo(() => {
    const allCounts = annualMonthlyTypeData.flatMap((m) =>
      ANNUAL_CONTACT_TYPES.map((t) => m.byType[t.key] || 0)
    );
    const maxVal = Math.max(...allCounts, 1);
    if (maxVal <= 5) return 5;
    if (maxVal <= 10) return 10;
    return Math.ceil((maxVal + 2) / 5) * 5;
  }, [annualMonthlyTypeData]);

  const peakMonth = useMemo(() => {
    return (
      [...annualMonthlyTypeData].sort((a, b) => b.total - a.total)[0] || {
        month: "N/A",
        total: 0,
      }
    );
  }, [annualMonthlyTypeData]);

  return (
    <div className="p-3 md:p-6 space-y-6">

      {/* ── Executive Welcome Banner ────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#002B49] via-[#004B75] to-[#AD1D41] text-white p-6 shadow-md border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-center sm:text-left flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-1">
            Executive Overview & Operations Control
          </div>
          <h1 className="text-center sm:text-left font-oswald text-2xl md:text-3xl font-bold tracking-wide uppercase">
            PMV Maritime Management Hub
          </h1>
        </div>
        <div className="flex w-full sm:w-fit flex-col sm:flex-row items-center gap-3 shrink-0">
          <Link
            href="/"
            target="_blank"
            className="w-full sm:w-fit px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold uppercase tracking-wider transition-all flex justify-center sm:justify-start items-center gap-2"
          >
            <span>Live Site</span>
            <LuExternalLink className="text-sm" />
          </Link>
          {canViewSubmissions && (
            <Link
              href="/admin/contact"
              className="w-full sm:w-fit px-4 py-2 bg-secondary hover:bg-secondary-dark text-white text-xs font-bold uppercase tracking-wider transition-all flex justify-center sm:justify-start items-center gap-2 shadow-sm"
            >
              <LuMail className="text-sm" />
              <span>Inbox ({submissions.length})</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── 1. Top KPI Stat Cards Grid (4 Permission-Controlled Cards) ────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Services Engine */}
        <div className="bg-gradient-to-br from-[#003853] via-[#005978] to-[#007BA7] text-white p-4 pb-2 transition-all duration-200 relative overflow-hidden flex flex-col justify-between group border border-white/15">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-cyan-200">
                Services Engine
              </span>
              <div className="w-9 h-9 bg-white/15 border border-white/20 text-white flex items-center justify-center text-lg group-hover:bg-white group-hover:text-[#005978] transition-colors duration-200">
                <LuShip />
              </div>
            </div>

            <Link
              href="/admin/services"
              className="font-oswald text-5xl sm:text-6xl font-black text-white hover:text-cyan-200 transition-colors inline-block tracking-tight -mt-2"
            >
              {loading ? "..." : services.length}
            </Link>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 border border-white/20 text-xs font-bold text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {activeServicesCount} Active Services
              </span>
              {archivedServicesCount > 0 && (
                <span className="text-xs text-cyan-200/80 font-semibold">
                  {archivedServicesCount} Archived
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-white/15 flex items-center justify-between z-10">
            <Link
              href="/admin/services"
              className="text-xs font-extrabold uppercase tracking-wider text-cyan-100 hover:text-white flex items-center gap-1 group/btn"
            >
              <span>Manage</span>
              <LuArrowUpRight className="text-sm group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </Link>
            {canCreateServices && (
              <Link
                href="/admin/services/create"
                className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-white text-[#005978] hover:bg-cyan-50 transition-colors flex items-center gap-1"
              >
                <LuPlus className="text-sm" /> New
              </Link>
            )}
          </div>
        </div>

        {/* Card 2: Projects Hub */}
        <div className="bg-gradient-to-br from-[#4a0817] via-[#85132f] to-[#AD1D41] text-white p-4 pb-2 transition-all duration-200 relative overflow-hidden flex flex-col justify-between group border border-white/15">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-rose-200">
                Projects Hub
              </span>
              <div className="w-9 h-9 bg-white/15 border border-white/20 text-white flex items-center justify-center text-lg group-hover:bg-white group-hover:text-[#AD1D41] transition-colors duration-200">
                <LuFolderOpen />
              </div>
            </div>

            <Link
              href="/admin/projects"
              className="font-oswald text-5xl sm:text-6xl font-black text-white hover:text-rose-200 transition-colors inline-block tracking-tight -mt-2"
            >
              {loading ? "..." : projects.length}
            </Link>

            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 border border-white/20 text-xs font-bold text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {activeProjectsCount} Published
              </span>
              {archivedProjectsCount > 0 && (
                <span className="text-xs text-rose-200/80 font-semibold">
                  {archivedProjectsCount} Archived
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-white/15 flex items-center justify-between z-10">
            <Link
              href="/admin/projects"
              className="text-xs font-extrabold uppercase tracking-wider text-rose-100 hover:text-white flex items-center gap-1 group/btn"
            >
              <span>Manage</span>
              <LuArrowUpRight className="text-sm group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </Link>
            {canCreateProjects && (
              <Link
                href="/admin/projects/create"
                className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-white text-[#AD1D41] hover:bg-rose-50 transition-colors flex items-center gap-1"
              >
                <LuPlus className="text-sm" /> New
              </Link>
            )}
          </div>
        </div>

        {/* Card 3: Talent Pipeline */}
        <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] text-white p-4 pb-2 transition-all duration-200 relative overflow-hidden flex flex-col justify-between group border border-white/15">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                Talent Pipeline
              </span>
              <div className="w-9 h-9 bg-white/15 border border-white/20 text-white flex items-center justify-center text-lg group-hover:bg-white group-hover:text-slate-900 transition-colors duration-200">
                <LuBriefcaseBusiness />
              </div>
            </div>

            <Link
              href="/admin/careers"
              className="font-oswald text-5xl sm:text-6xl font-black text-white hover:text-slate-200 transition-colors inline-block tracking-tight -mt-2"
            >
              {loading ? "..." : careers.length}
            </Link>

            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/15 border border-white/20 text-xs font-bold text-white">
                Sea: {seaJobsCount}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/15 border border-white/20 text-xs font-bold text-white">
                Shore: {shoreJobsCount}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-white/15 flex items-center justify-between z-10">
            <Link
              href="/admin/careers"
              className="text-xs font-extrabold uppercase tracking-wider text-slate-200 hover:text-white flex items-center gap-1 group/btn"
            >
              <span>Manage</span>
              <LuArrowUpRight className="text-sm group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </Link>
            {canCreateCareers && (
              <Link
                href="/admin/careers"
                className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-white text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1"
              >
                <LuPlus className="text-sm" /> Add Job
              </Link>
            )}
          </div>
        </div>

        {/* Card 4: Knowledge Base */}
        <div className="bg-gradient-to-br from-[#044e54] via-[#0d6e6e] to-[#0f766e] text-white p-4 pb-2 transition-all duration-200 relative overflow-hidden flex flex-col justify-between group border border-white/15">
          <div>
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-teal-200">
                Knowledge Base
              </span>
              <div className="w-9 h-9 bg-white/15 border border-white/20 text-white flex items-center justify-center text-lg group-hover:bg-white group-hover:text-[#0f766e] transition-colors duration-200">
                <LuMessageCircleQuestion />
              </div>
            </div>

            <Link
              href="/admin/faqs"
              className="font-oswald text-5xl sm:text-6xl font-black text-white hover:text-teal-200 transition-colors inline-block tracking-tight -mt-2"
            >
              {loading ? "..." : faqs.length}
            </Link>

            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 border border-white/20 text-xs font-bold text-white">
                <span className="w-2 h-2 rounded-full bg-teal-300"></span>
                {faqs.length} Live FAQs
              </span>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-white/15 flex items-center justify-between z-10">
            <Link
              href="/admin/faqs"
              className="text-xs font-extrabold uppercase tracking-wider text-teal-100 hover:text-white flex items-center gap-1 group/btn"
            >
              <span>Manage</span>
              <LuArrowUpRight className="text-sm group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </Link>
            {canCreateFaqs && (
              <Link
                href="/admin/faqs"
                className="px-3 py-1 text-xs font-black uppercase tracking-wider bg-white text-[#0f766e] hover:bg-teal-50 transition-colors flex items-center gap-1"
              >
                <LuPlus className="text-sm" /> Add FAQ
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Form Submissions Section (Gated by Forms/Submissions Permission) ───────── */}
      {canViewSubmissions && (
        <div className="space-y-6">


          {/* Analytics Chart Container: 2 Distinct Visual Tabs with Filters & Responsive H-Scroll */}
          <div className="bg-white border border-gray-200 p-2 sm:p-5 shadow-xs space-y-4">
            {/* Header with 2 Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-sm bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center shrink-0">
                  {activeChartTab === "bar" ? (
                    <LuChartBar className="text-base" />
                  ) : (
                    <LuTrendingUp className="text-base" />
                  )}
                </div>
                <div>
                  <h3 className="font-oswald text-base font-bold text-secondary-dark uppercase tracking-wider">
                    {activeChartTab === "bar"
                      ? "Inquiry Category Breakdown"
                      : "Annual Monthly Reach"}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {activeChartTab === "bar"
                      ? "Filter by custom date range to analyze category lead volume"
                      : "12-month timeline analysis of contact types reached per month across the entire year"}
                  </p>
                </div>
              </div>

              {/* Working 2-Tab Navigation */}
              <div className="w-full sm:w-fit flex items-center gap-1 bg-slate-100 p-1 border border-gray-200 text-xs font-bold shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveChartTab("bar")}
                  className={`h-[stretch] self-stretch w-full sm:w-fit px-3 py-1.5 transition-all flex items-center gap-1.5 cursor-pointer ${activeChartTab === "bar"
                    ? "bg-white text-secondary shadow-xs font-black"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <LuChartBar className="hidden sm:inline-block text-sm" />
                  <span>Category Bar Chart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartTab("trend")}
                  className={`h-[stretch] self-stretch w-full sm:w-fit px-3 py-1.5 transition-all flex items-center gap-1.5 cursor-pointer ${activeChartTab === "trend"
                    ? "bg-white text-secondary shadow-xs font-black"
                    : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  <LuTrendingUp className="hidden sm:inline-block text-sm" />
                  <span>Annual Contact Types</span>
                </button>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════════════════
                TAB 1: BAR CHART (IMAGE 1 STYLE) WITH DATE FILTER
               ════════════════════════════════════════════════════════════════════════════ */}
            {activeChartTab === "bar" && (
              <div className="space-y-4">
                {/* Date Selection Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-gray-200 text-xs">
                  {/* Preset Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-gray-600 flex items-center gap-1 mr-1">
                      <LuFilter className="text-xs text-secondary" /> Date Filter:
                    </span>
                    {[
                      { key: "all", label: "All Time" },
                      { key: "7days", label: "Last 7 Days" },
                      { key: "30days", label: "Last 30 Days" },
                      { key: "last3Months", label: "Last 3 Months" },
                      { key: "custom", label: "Custom Range" },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setDatePreset(p.key)}
                        className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer border ${datePreset === p.key
                          ? "bg-secondary text-white border-secondary shadow-xs"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Inputs */}
                  {datePreset === "custom" && (
                    <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-200">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">From:</span>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="px-2 py-1 bg-white border border-gray-300 text-xs font-semibold text-gray-700 focus:outline-none focus:border-secondary"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">To:</span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="px-2 py-1 bg-white border border-gray-300 text-xs font-semibold text-gray-700 focus:outline-none focus:border-secondary"
                        />
                      </div>
                      {(startDate || endDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate("");
                            setEndDate("");
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                          title="Clear Dates"
                        >
                          <LuRefreshCw className="text-xs" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Active Count Readout */}
                  <div className="text-[11px] font-bold text-gray-500 font-mono ml-auto">
                    Active Results: <span className="text-secondary-dark font-black">{filteredSubmissions.length} Inquiries</span>
                  </div>
                </div>

                {/* White Chart Canvas Matching Image 1 (Responsive H-Scroll on Mobile) */}
                <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                  <div className="min-w-[680px] bg-white border border-gray-200 p-4 rounded-sm shadow-sm relative">
                    {/* Header info inside white canvas */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 mb-6 pb-2 border-b border-gray-100">
                      <span className="uppercase tracking-wider flex items-center gap-2 text-secondary-dark font-black">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary inline-block" />
                        Category Distribution Spectrum
                      </span>
                      <span className="font-mono text-gray-500">
                        Peak Category: <span className="text-secondary-dark font-black">{maxBarCount} inq</span>
                      </span>
                    </div>

                    {/* Chart Body with Horizontal Grid Lines */}
                    <div className="relative h-64 w-full flex items-end pt-6 pb-0">
                      {/* Horizontal Grid Lines */}
                      <div className="absolute inset-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none">
                        <div className="border-b border-gray-100 w-full text-[9px] font-mono text-gray-400 pr-1 text-right">
                          {maxBarCount}
                        </div>
                        <div className="border-b border-gray-100 w-full text-[9px] font-mono text-gray-400 pr-1 text-right">
                          {Math.round(maxBarCount * 0.75)}
                        </div>
                        <div className="border-b border-gray-100 w-full text-[9px] font-mono text-gray-400 pr-1 text-right">
                          {Math.round(maxBarCount * 0.5)}
                        </div>
                        <div className="border-b border-gray-100 w-full text-[9px] font-mono text-gray-400 pr-1 text-right">
                          {Math.round(maxBarCount * 0.25)}
                        </div>
                        <div className="border-b border-gray-200 w-full text-[9px] font-mono text-gray-400 pr-1 text-right">
                          0
                        </div>
                      </div>

                      {/* Bars Matching Reference Image 1 */}
                      <div className="relative z-10 w-full h-full flex items-end justify-between px-2 gap-2 sm:gap-3">
                        {barChartData.map((item, idx) => {
                          const heightPct = Math.max(
                            Math.round((item.count / maxBarCount) * 100),
                            item.count > 0 ? 8 : 2
                          );
                          const isHovered = hoveredBarIndex === idx;

                          return (
                            <div
                              key={item.key}
                              onMouseEnter={() => setHoveredBarIndex(idx)}
                              onMouseLeave={() => setHoveredBarIndex(null)}
                              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                            >
                              {/* Hover Floating Tooltip */}
                              <div
                                className={`absolute -top-11 transition-all duration-150 pointer-events-none z-30 ${isHovered ? "opacity-100 scale-100 -translate-y-1" : "opacity-0 scale-95"
                                  }`}
                              >
                                <div className="bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded shadow-xl border border-slate-700 whitespace-nowrap text-center">
                                  <div className="text-gray-200">{item.fullLabel}</div>
                                  <div className="text-cyan-300 font-mono font-black">
                                    {item.count} Inquiries ({item.pct}%)
                                  </div>
                                </div>
                              </div>

                              {/* Vertical Colored Bar (Image 1 style with rounded top) */}
                              <div className="w-full max-w-[42px] h-full flex items-end justify-center">
                                <div
                                  className={`w-full rounded-t-sm transition-all duration-500 ease-out ${isHovered ? "brightness-95 shadow-md scale-x-105" : "hover:brightness-95"
                                    }`}
                                  style={{
                                    height: `${heightPct}%`,
                                    backgroundColor: item.color,
                                  }}
                                />
                              </div>

                              {/* Bottom Labels */}
                              <div className="mt-2.5 text-center flex flex-col items-center">
                                <span className="font-mono text-[10px] font-black text-gray-900">
                                  {item.count}
                                </span>
                                <span
                                  className="text-[10px] font-bold text-gray-600 truncate max-w-[50px] sm:max-w-[65px] transition-colors group-hover:text-secondary-dark"
                                  title={item.fullLabel}
                                >
                                  {item.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════════════════
                TAB 2: ANNUAL MONTHLY REACH BY CONTACT TYPE (WHITE BG, YEAR DROPDOWN)
               ════════════════════════════════════════════════════════════════════════════ */}
            {activeChartTab === "trend" && (
              <div className="space-y-4">
                {/* Controls & Metrics Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-gray-200 text-xs">
                  {/* Year Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <LuCalendar className="text-secondary" /> Year:
                    </span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-gray-300 text-xs font-black text-secondary-dark rounded-sm focus:outline-none focus:border-secondary cursor-pointer shadow-xs"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          Year {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Contact Type Filter Pills (Legend) */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedTypeFilter("all")}
                      className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${selectedTypeFilter === "all"
                        ? "bg-secondary-dark text-white border-secondary-dark shadow-xs"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                      All Types ({totalYearContacts})
                    </button>
                    {ANNUAL_CONTACT_TYPES.map((t) => {
                      const isSelected = selectedTypeFilter === t.key;
                      const count = yearlyTotalsByType[t.key] || 0;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setSelectedTypeFilter(isSelected ? "all" : t.key)}
                          className={`px-2.5 py-1 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${isSelected
                            ? "text-white shadow-xs border-transparent font-black"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                            }`}
                          style={{
                            backgroundColor: isSelected ? t.color : undefined,
                          }}
                        >
                          <span
                            className="w-2.5 h-2.5 inline-block shrink-0 rounded-xs"
                            style={{ backgroundColor: isSelected ? "#ffffff" : t.color }}
                          />
                          <span>{t.shortLabel}</span>
                          <span className={`font-mono text-[10px] ${isSelected ? "text-white/90" : "text-gray-400 font-bold"}`}>
                            ({count})
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Peak Month Readout */}
                  <div className="text-[11px] text-gray-500 font-mono hidden xl:block ml-auto">
                    Peak Month: <span className="font-bold text-gray-900">{peakMonth.month} ({peakMonth.total} contacts)</span>
                  </div>
                </div>

                {/* White Canvas (Responsive H-Scroll on Mobile) */}
                <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                  <div className="min-w-[680px] bg-white border border-gray-200 p-4 rounded-sm shadow-sm relative">
                    {/* SVG Line Chart */}
                    <div className="relative w-full">
                      <svg viewBox="0 0 900 280" className="w-full h-auto overflow-visible select-none">
                        {/* Horizontal Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                          const y = 30 + (1 - pct) * 200;
                          const val = Math.round(pct * maxTrendVal);
                          return (
                            <g key={idx}>
                              <line
                                x1="45"
                                y1={y}
                                x2="865"
                                y2={y}
                                stroke="#e2e8f0"
                                strokeWidth="1"
                                strokeDasharray={pct > 0 && pct < 1 ? "4 4" : "0"}
                              />
                              {/* Left & Right Y Axis Labels */}
                              <text
                                x="35"
                                y={y + 4}
                                fill="#94a3b8"
                                fontSize="11"
                                fontFamily="monospace"
                                textAnchor="end"
                              >
                                {val}
                              </text>
                              <text
                                x="875"
                                y={y + 4}
                                fill="#94a3b8"
                                fontSize="11"
                                fontFamily="monospace"
                                textAnchor="start"
                              >
                                {val}
                              </text>
                            </g>
                          );
                        })}

                        {/* Vertical Grid Lines for the 12 Months */}
                        {annualMonthlyTypeData.map((item, i) => {
                          const x = 55 + (i / 11) * 800;
                          const isHovered = hoveredMonthIndex === i;
                          return (
                            <g key={i}>
                              <line
                                x1={x}
                                y1="30"
                                x2={x}
                                y2="230"
                                stroke={isHovered ? "#cbd5e1" : "#f1f5f9"}
                                strokeWidth="1"
                                strokeDasharray="3 3"
                              />
                              {/* Month Labels on X Axis */}
                              <text
                                x={x}
                                y="255"
                                fill={isHovered ? "#007BA7" : "#64748b"}
                                fontSize="11"
                                fontWeight={isHovered ? "bold" : "600"}
                                textAnchor="middle"
                              >
                                {item.month}
                              </text>
                            </g>
                          );
                        })}

                        {/* Trend Lines & Markers for Contact Types */}
                        {ANNUAL_CONTACT_TYPES.filter(
                          (t) => selectedTypeFilter === "all" || selectedTypeFilter === t.key
                        ).map((type) => {
                          const points = annualMonthlyTypeData.map((item, i) => {
                            const x = 55 + (i / 11) * 800;
                            const count = item.byType[type.key] || 0;
                            const y = 30 + (1 - count / maxTrendVal) * 200;
                            return { x, y, val: count };
                          });

                          const pathD = points
                            .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                            .join(" ");

                          const isSingleFocused = selectedTypeFilter === type.key;

                          return (
                            <g key={type.key}>
                              {/* Path Line */}
                              <path
                                d={pathD}
                                fill="none"
                                stroke={type.color}
                                strokeWidth={isSingleFocused ? "3.5" : "2.5"}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-all duration-300"
                              />

                              {/* Point Markers */}
                              {points.map((p, i) => {
                                const isMonthHovered = hoveredMonthIndex === i;
                                return (
                                  <g key={`pt-${type.key}-${i}`} className="pointer-events-none">
                                    {type.dotShape === "circle" && (
                                      <circle
                                        cx={p.x}
                                        cy={p.y}
                                        r={isMonthHovered ? 6 : 4.5}
                                        fill={type.color}
                                        stroke="#ffffff"
                                        strokeWidth="2"
                                      />
                                    )}
                                    {type.dotShape === "diamond" && (
                                      <polygon
                                        points={`${p.x},${p.y - (isMonthHovered ? 6 : 4.5)} ${p.x + (isMonthHovered ? 6 : 4.5)},${p.y} ${p.x},${p.y + (isMonthHovered ? 6 : 4.5)} ${p.x - (isMonthHovered ? 6 : 4.5)},${p.y}`}
                                        fill={type.color}
                                        stroke="#ffffff"
                                        strokeWidth="2"
                                      />
                                    )}
                                    {type.dotShape === "square" && (
                                      <rect
                                        x={p.x - (isMonthHovered ? 5 : 4)}
                                        y={p.y - (isMonthHovered ? 5 : 4)}
                                        width={isMonthHovered ? 10 : 8}
                                        height={isMonthHovered ? 10 : 8}
                                        fill={type.color}
                                        stroke="#ffffff"
                                        strokeWidth="2"
                                        rx="1"
                                      />
                                    )}
                                    {type.dotShape === "triangle" && (
                                      <polygon
                                        points={`${p.x},${p.y - (isMonthHovered ? 6 : 4.5)} ${p.x + (isMonthHovered ? 5.5 : 4)},${p.y + (isMonthHovered ? 4.5 : 3.5)} ${p.x - (isMonthHovered ? 5.5 : 4)},${p.y + (isMonthHovered ? 4.5 : 3.5)}`}
                                        fill={type.color}
                                        stroke="#ffffff"
                                        strokeWidth="2"
                                      />
                                    )}

                                    {/* Number readout if type is isolated and count > 0 */}
                                    {isSingleFocused && p.val > 0 && (
                                      <text
                                        x={p.x}
                                        y={p.y - 8}
                                        fill={type.color}
                                        fontSize="10"
                                        fontFamily="monospace"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                      >
                                        {p.val}
                                      </text>
                                    )}
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })}

                        {/* Interactive Vertical Guide Line on Hover */}
                        {hoveredMonthIndex !== null && (
                          <g pointerEvents="none">
                            <line
                              x1={55 + (hoveredMonthIndex / 11) * 800}
                              y1="30"
                              x2={55 + (hoveredMonthIndex / 11) * 800}
                              y2="230"
                              stroke="#007BA7"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                          </g>
                        )}

                        {/* Transparent Month Hitbox Columns for Seamless Interaction */}
                        {annualMonthlyTypeData.map((item, i) => {
                          const colWidth = 800 / 11;
                          const x = 55 + (i / 11) * 800 - colWidth / 2;
                          return (
                            <rect
                              key={`hitbox-${i}`}
                              x={Math.max(40, x)}
                              y="20"
                              width={colWidth}
                              height="220"
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredMonthIndex(i)}
                              onMouseLeave={() => setHoveredMonthIndex(null)}
                            />
                          );
                        })}
                      </svg>

                      {/* Interactive Float Readout for Hovered Month */}
                      {hoveredMonthIndex !== null && (
                        <div className="absolute top-2 right-4 bg-white/95 border border-gray-200 p-3 rounded-sm shadow-xl text-xs space-y-2 backdrop-blur-xs min-w-[210px] z-20 animate-in fade-in duration-150">
                          <div className="border-b border-gray-100 pb-1.5 flex items-center justify-between">
                            <span className="font-bold text-gray-900">
                              {annualMonthlyTypeData[hoveredMonthIndex].month} {selectedYear}
                            </span>
                            <span className="font-mono font-black text-secondary-dark text-[11px]">
                              {annualMonthlyTypeData[hoveredMonthIndex].total} Reached
                            </span>
                          </div>
                          <div className="space-y-1">
                            {ANNUAL_CONTACT_TYPES.map((t) => {
                              const count = annualMonthlyTypeData[hoveredMonthIndex].byType[t.key] || 0;
                              return (
                                <div
                                  key={t.key}
                                  className={`flex items-center justify-between text-[11px] ${count > 0 ? "font-bold text-gray-800" : "text-gray-400 font-normal"
                                    }`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="w-2 h-2 rounded-full inline-block shrink-0"
                                      style={{ backgroundColor: t.color }}
                                    />
                                    <span>{t.label}</span>
                                  </div>
                                  <span className="font-mono">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Annual Totals Breakdown by Contact Type */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Annual Contact Volume by Category ({selectedYear})
                      </div>
                      <div className="grid grid-cols-5 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                        {ANNUAL_CONTACT_TYPES.map((t) => {
                          const count = yearlyTotalsByType[t.key] || 0;
                          const pct = totalYearContacts > 0 ? Math.round((count / totalYearContacts) * 100) : 0;
                          const isFiltered = selectedTypeFilter === t.key;
                          return (
                            <button
                              type="button"
                              key={t.key}
                              onClick={() => setSelectedTypeFilter(isFiltered ? "all" : t.key)}
                              className={`p-2 border transition-all cursor-pointer text-left ${isFiltered
                                ? "bg-slate-50 border-secondary ring-1 ring-secondary shadow-xs"
                                : "bg-white border-gray-200 hover:bg-slate-50"
                                }`}
                            >
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 truncate">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                                <span className="truncate">{t.shortLabel}</span>
                              </div>
                              <div className="mt-1 flex items-baseline justify-between">
                                <span className="font-mono text-sm font-black text-gray-900">{count}</span>
                                <span className="text-[10px] font-mono text-gray-400 font-bold">{pct}%</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Table: Recent Customer & Vessel Inquiries Stream */}
          <div className="bg-white border border-gray-200 p-2 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center">
                  <LuMail className="text-lg" />
                </div>
                <div>
                  <h2 className="font-oswald text-lg font-bold text-secondary-dark uppercase tracking-wider">
                    Recent Inquiries
                  </h2>
                </div>
              </div>

              <Link
                href="/admin/contact"
                className="px-3.5 py-1.5 bg-secondary hover:bg-secondary-dark text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
              >
                <span>Full Inbox</span>
                <LuArrowUpRight className="text-sm" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400 text-xs animate-pulse">
                Loading inquiries stream...
              </div>
            ) : submissions.length === 0 ? (
              <div className="py-12 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
                <LuMail className="text-3xl text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">No Inquiries Found</p>
                <p className="text-xs text-gray-400 mt-0.5">There are no contact form submissions available at this time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-gray-200 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">
                      <th className="py-2.5 px-3">Contact Person</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Message Snippet</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {submissions.slice(0, 6).map((sub) => {
                      const queryType = (sub.query || "General").toUpperCase();
                      const initial = (sub.fullName || "C").charAt(0).toUpperCase();

                      let tagStyle = "bg-slate-100 text-slate-700 border-slate-200";
                      if (queryType.includes("FLEET")) {
                        tagStyle = "bg-sky-50 text-[#005978] border-sky-200";
                      } else if (queryType.includes("CREW")) {
                        tagStyle = "bg-amber-50 text-amber-800 border-amber-200";
                      } else if (queryType.includes("TRAIN")) {
                        tagStyle = "bg-indigo-50 text-indigo-800 border-indigo-200";
                      } else if (queryType.includes("DIGITAL")) {
                        tagStyle = "bg-purple-50 text-purple-800 border-purple-200";
                      }

                      return (
                        <tr key={sub._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div>
                                <h4 className="font-bold text-gray-900 leading-tight text-xs">{sub.fullName}</h4>
                                <span className="text-[10px] text-gray-400 block">{sub.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 border text-[10px] font-black uppercase tracking-wider inline-block ${tagStyle}`}>
                              {sub.query || "General"}
                            </span>
                          </td>

                          <td className="py-3 px-3 max-w-md">
                            <p className="text-gray-600 line-clamp-1 text-[12px] font-medium italic">
                              {sub.message}
                            </p>
                          </td>

                          <td className="py-3 px-3 whitespace-nowrap text-gray-400 font-semibold text-[11px]">
                            <div className="flex items-center gap-1">
                              <LuClock className="text-gray-400 text-xs" />
                              <span>{sub.dateTime || "Recent"}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>



        </div>
      )}

    </div>
  );
}
