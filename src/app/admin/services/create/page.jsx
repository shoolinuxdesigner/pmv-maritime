"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import {
  LuArrowLeft,
  LuSparkles,
  LuX,
  LuSearch,
  LuLayers3,
  LuLoader,
  LuFileText,
  LuExternalLink,
} from "react-icons/lu";

import { PRESET_ICONS, renderIconById } from "@/lib/maritimeIcons";
import { hasPermission } from "@/lib/permissions";

const DEFAULT_HIGHLIGHTS = [
  {
    icon: "LuCompass",
    title: "Strategic Advisory",
    description: "Helping you define vision, strategy, and roadmap for long-term maritime success.",
  },
  {
    icon: "LuShip",
    title: "Operational Excellence",
    description: "Improving efficiency, reducing costs, and optimizing processes across your operations.",
  },
  {
    icon: "LuUsers",
    title: "Risk & Compliance",
    description: "Ensuring adherence to international regulations, safety standards, and industry best practices.",
  },
];

export default function CreateServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const canCreate = hasPermission(null, "services:create");
  const canEdit = hasPermission(null, "services:edit");
  const isAllowed = editId ? canEdit : canCreate;

  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Maritime Consultancy");
  const [selectedIcon, setSelectedIcon] = useState("MdOutlineAnchor");
  const [shortDesc, setShortDesc] = useState("");
  const [longDesc, setLongDesc] = useState("");
  const [deliverablesText, setDeliverablesText] = useState("");
  const [promiseText, setPromiseText] = useState("");
  const [brochureUrl, setBrochureUrl] = useState("");
  const [highlights, setHighlights] = useState(DEFAULT_HIGHLIGHTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingEdit, setIsFetchingEdit] = useState(false);

  // Master Categories State
  const [masterCategories, setMasterCategories] = useState([]);

  // Fetch Services Master Categories from MongoDB
  useEffect(() => {
    async function fetchMasterCategories() {
      try {
        const res = await fetch("/api/master?module=services", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMasterCategories(data.filter((item) => item.status === "Active"));
          }
        }
      } catch (err) {
        console.error("Failed to load master services categories:", err);
      }
    }
    fetchMasterCategories();
  }, []);

  // Fetch service for edit mode
  useEffect(() => {
    if (!editId) return;

    async function fetchServiceForEdit() {
      setIsFetchingEdit(true);
      try {
        const res = await fetch(`/api/services?id=${editId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Service not found.");
        const data = await res.json();

        setName(data.name || "");
        setCategory(data.category || "Maritime Consultancy");
        setSelectedIcon(data.icon || "MdOutlineAnchor");
        setShortDesc(data.shortDesc || "");
        setLongDesc(data.longDesc || "");
        setDeliverablesText(
          Array.isArray(data.deliverables) ? data.deliverables.join("\n") : data.deliverables || ""
        );
        setPromiseText(data.promise || "");
        setBrochureUrl(data.brochureUrl || "");
        setHighlights(
          Array.isArray(data.highlights) && data.highlights.length === 3
            ? data.highlights
            : DEFAULT_HIGHLIGHTS
        );
      } catch (err) {
        toast.error("Could not load service for editing.");
      } finally {
        setIsFetchingEdit(false);
      }
    }

    fetchServiceForEdit();
  }, [editId]);

  const handleHighlightChange = (index, field, value) => {
    setHighlights((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Icon Modal Selector State: target can be "main" | 0 | 1 | 2
  const [iconModalTarget, setIconModalTarget] = useState(null);
  const [iconSearchQuery, setIconSearchQuery] = useState("");

  const openIconModal = (target) => {
    setIconModalTarget(target);
    setIconSearchQuery("");
  };

  const handleSelectIconFromModal = (iconId) => {
    if (iconModalTarget === "main") {
      setSelectedIcon(iconId);
    } else if (typeof iconModalTarget === "number") {
      handleHighlightChange(iconModalTarget, "icon", iconId);
    }
    setIconModalTarget(null);
    toast.success("Icon updated successfully!");
  };

  const filteredIcons = PRESET_ICONS.filter(
    (item) =>
      item.name.toLowerCase().includes(iconSearchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(iconSearchQuery.toLowerCase())
  );

  // ── Submit: POST (create) or PUT (edit) ──────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a Service Name.");
      return;
    }

    if (!category.trim()) {
      toast.error("Please select a Service Category.");
      return;
    }

    if (!selectedIcon) {
      toast.error("Please select a Main Service Icon.");
      return;
    }

    if (!shortDesc.trim()) {
      toast.error("Please enter a Short Description.");
      return;
    }

    if (!longDesc.trim()) {
      toast.error("Please enter a Long Description.");
      return;
    }

    for (let i = 0; i < highlights.length; i++) {
      const card = highlights[i];
      if (!card.title.trim()) {
        toast.error(`Please enter a Title for Feature Card #${i + 1}.`);
        return;
      }
      if (!card.description.trim()) {
        toast.error(`Please enter a Description for Feature Card #${i + 1}.`);
        return;
      }
      if (!card.icon) {
        toast.error(`Please select an Icon for Feature Card #${i + 1}.`);
        return;
      }
    }

    const deliverables = deliverablesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (deliverables.length === 0) {
      toast.error("Please enter at least one deliverable in What We Deliver.");
      return;
    }

    if (!promiseText.trim()) {
      toast.error("Please enter Our Promise.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      category,
      icon: selectedIcon,
      shortDesc,
      longDesc,
      highlights,
      deliverables,
      promise: promiseText,
      brochureUrl: brochureUrl.trim(),
    };

    try {
      let res;
      if (editId) {
        res = await fetch("/api/services", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        });
      } else {
        res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save service.");
      }

      toast.success(
        editId ? "Service updated successfully!" : "New service created and published!"
      );

      setTimeout(() => {
        router.push("/admin/services");
      }, 600);
    } catch (err) {
      toast.error(err.message || "Failed to save service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAllowed) {
    return (
      <div className="p-8 text-center bg-white border border-gray-200 m-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-red-50 text-red-600 border border-red-200 flex items-center justify-center text-3xl mb-4">
          <LuSparkles />
        </div>
        <h2 className="font-oswald text-2xl font-bold text-secondary uppercase tracking-wider">
          403 - Access Restricted
        </h2>
        <p className="text-sm text-gray-500 max-w-md mt-1">
          You do not have permission to {editId ? "edit" : "create"} service offerings. Please contact your Super Administrator.
        </p>
        <Link
          href="/admin/services"
          className="mt-6 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider transition-colors inline-block"
        >
          Back to Services Engine
        </Link>
      </div>
    );
  }

  if (isFetchingEdit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <LuLoader className="text-3xl animate-spin text-primary" />
          <p className="text-sm font-medium">Loading service data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-6 w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-gray-200 p-2.5 md:px-5 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/services"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 transition-colors"
            title="Back to Services"
          >
            <LuArrowLeft className="text-lg" />
          </Link>
          <div>
            <h1 className="font-oswald text-lg md:text-xl font-bold text-primary uppercase tracking-wide">
              {editId ? "Edit Service" : "Create New Service"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/admin/services"
            className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs uppercase tracking-wider text-center transition-all"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting
              ? editId
                ? "Updating..."
                : "Publishing..."
              : editId
                ? "Update"
                : "Publish"}
          </button>
        </div>
      </div>

      {/* Full-Width Multi-Section Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: General Service Details */}
        <div className="bg-white border border-gray-200 p-4 md:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-gray-200 pb-3.5">
            <span className="w-7 h-7 bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">
              1
            </span>
            <h2 className="font-oswald text-base md:text-lg font-bold text-secondary uppercase tracking-wide">
              General Service Details
            </h2>
          </div>

          {/* Grid: Service Name + Category + Main Icon */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
            <div className="lg:col-span-5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                Service Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marine Consultancy & Technical Advisory"
                className="w-full bg-slate-50 border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none px-4 py-2.5 text-sm transition-all text-gray-900 placeholder-gray-400 font-semibold"
                required
              />
            </div>

            <div className="lg:col-span-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                Service Category <span className="text-primary">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none px-3.5 py-2.5 text-sm transition-all text-gray-900 font-semibold cursor-pointer"
              >
                {masterCategories.length > 0 ? (
                  masterCategories.map((item) => (
                    <option key={item._id || item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Maritime Consultancy">Maritime Consultancy</option>
                    <option value="Maritime Training">Maritime Training</option>
                    <option value="Fleet Management">Fleet Management</option>
                    <option value="Port Operations">Port Operations</option>
                    <option value="Shipbuilding">Shipbuilding</option>
                    <option value="Digitisation">Digitisation</option>
                    <option value="Technical & Engineering">Technical & Engineering</option>
                    <option value="Safety & Environmental">Safety & Environmental</option>
                  </>
                )}
              </select>
            </div>

            {/* Visual Main Icon Selector Tile */}
            <div className="lg:col-span-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                Main Service Icon <span className="text-primary">*</span>
              </label>
              <button
                type="button"
                onClick={() => openIconModal("main")}
                className="w-full h-[42px] bg-slate-50 hover:bg-slate-100 border border-gray-200 px-3 flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 bg-primary text-white flex items-center justify-center shrink-0 font-bold">
                    {renderIconById(selectedIcon, "h-4 w-4")}
                  </div>
                  <span className="text-xs font-bold text-gray-800 truncate">
                    {PRESET_ICONS.find((i) => i.id === selectedIcon)?.name || "Select"}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-primary group-hover:underline shrink-0">
                  Change
                </span>
              </button>
            </div>
          </div>

          {/* Grid: Short Description + Long Description Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                Short Description <span className="text-primary">*</span>{" "}
                <span className="text-gray-400 font-normal">(Card Snippet)</span>
              </label>
              <textarea
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
                placeholder="Concise overview snippet displayed on service listing cards..."
                rows={4}
                required
                className="w-full bg-slate-50 border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none px-4 py-2.5 text-sm transition-all text-gray-900 placeholder-gray-400 font-medium resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                Long Description <span className="text-primary">*</span>{" "}
                <span className="text-gray-400 font-normal">(Detailed Overview)</span>
              </label>
              <textarea
                value={longDesc}
                onChange={(e) => setLongDesc(e.target.value)}
                placeholder="Full paragraph explaining the service scope and technical expertise..."
                rows={4}
                required
                className="w-full bg-slate-50 border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none px-4 py-2.5 text-sm transition-all text-gray-900 placeholder-gray-400 font-medium resize-none"
              />
            </div>
          </div>

          {/* Google Drive / Brochure PDF Link */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <LuFileText className="text-primary text-sm" />
                <span>Google Drive Link / Brochure PDF URL</span>
                <span className="text-gray-400 font-normal normal-case">(Public PDF link)</span>
              </label>
              {brochureUrl && (
                <a
                  href={brochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <LuExternalLink className="text-xs" />
                  <span>Preview PDF</span>
                </a>
              )}
            </div>
            <input
              type="url"
              value={brochureUrl}
              onChange={(e) => setBrochureUrl(e.target.value)}
              placeholder="e.g. https://drive.google.com/file/d/1A2B3C4D5E.../view?usp=sharing"
              className="w-full bg-slate-50 border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none px-4 py-2.5 text-sm transition-all text-gray-900 placeholder-gray-400 font-medium"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Provide a publicly accessible Google Drive or PDF link. This will be linked to the Admin Services Table PDF button and provided for download on the public service page after OTP verification.
            </p>
          </div>
        </div>

        {/* SECTION 2: 3 Key Feature Highlight Cards */}
        <div className="bg-white border border-gray-200 p-4 md:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-200 pb-3.5">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">
                2
              </span>
              <h2 className="font-oswald text-base md:text-lg font-bold text-secondary uppercase tracking-wide flex items-center gap-2">
                <span>3 Feature Highlight Cards</span>
              </h2>
            </div>
            <span className="text-xs font-semibold text-gray-400">Max 110 Chars Per Card</span>
          </div>

          {/* 3 Equal Grid Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {highlights.map((pillar, index) => (
              <div
                key={index}
                className="bg-slate-50/90 border border-gray-200 p-4 space-y-4 relative flex flex-col justify-between"
              >
                {/* Card Header & Icon Selector Button */}
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Feature Card #{index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => openIconModal(index)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-gray-200 flex items-center gap-2 transition-all cursor-pointer group"
                    title="Change Icon"
                  >
                    <div className="w-6 h-6 bg-secondary-dark text-white flex items-center justify-center shrink-0 font-bold">
                      {renderIconById(pillar.icon, "h-3.5 w-3.5")}
                    </div>
                    <span className="text-[11px] font-bold text-primary group-hover:underline">
                      Change Icon
                    </span>
                  </button>
                </div>

                {/* Card Title */}
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                    Card Title <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={pillar.title}
                    onChange={(e) => handleHighlightChange(index, "title", e.target.value)}
                    placeholder={`Card #${index + 1} Title`}
                    required
                    className="w-full bg-white border border-gray-200 focus:border-secondary outline-none px-3 py-2 text-xs text-gray-900 font-semibold"
                  />
                </div>

                {/* Card Description (Character Limited to 110) */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block">
                      Description <span className="text-primary">*</span>
                    </label>
                    <span
                      className={`text-[11px] font-mono font-bold ${pillar.description.length >= 100 ? "text-primary" : "text-gray-400"
                        }`}
                    >
                      {pillar.description.length} / 110 chars
                    </span>
                  </div>
                  <textarea
                    value={pillar.description}
                    maxLength={110}
                    onChange={(e) => handleHighlightChange(index, "description", e.target.value)}
                    placeholder="Short card description (max 110 characters)..."
                    rows={3}
                    required
                    className="w-full bg-white border border-gray-200 focus:border-secondary outline-none px-3 py-2 text-xs text-gray-800 font-medium resize-none flex-1"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: What We Deliver & Our Promise */}
        <div className="bg-white border border-gray-200 p-4 md:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-gray-200 pb-3.5">
            <span className="w-7 h-7 bg-primary/10 text-primary text-xs font-bold flex items-center justify-center border border-primary/20">
              3
            </span>
            <h2 className="font-oswald text-base md:text-lg font-bold text-secondary uppercase tracking-wide">
              Deliverables & Operational Promise
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                What We Deliver <span className="text-primary">*</span>{" "}
                <span className="text-gray-400 font-normal">(One bullet point per line)</span>
              </label>
              <textarea
                value={deliverablesText}
                onChange={(e) => setDeliverablesText(e.target.value)}
                placeholder={`Technical & Safety Audits\nPre-purchase & Condition Surveys\nRegulatory Compliance & Flag State Advisory...`}
                rows={6}
                required
                className="w-full bg-slate-50 border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none px-4 py-2.5 text-sm transition-all text-gray-900 placeholder-gray-400 font-medium resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                Our Promise <span className="text-primary">*</span>{" "}
                <span className="text-gray-400 font-normal">(Short Operational Promise Paragraph)</span>
              </label>
              <textarea
                value={promiseText}
                onChange={(e) => setPromiseText(e.target.value)}
                placeholder="We combine industry expertise, technical excellence, and global best practices..."
                rows={6}
                required
                className="w-full bg-slate-50 border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none px-4 py-2.5 text-sm transition-all text-gray-900 placeholder-gray-400 font-medium resize-none"
              />
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <Link
            href="/admin/services"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs uppercase tracking-wider transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting
              ? editId
                ? "Updating..."
                : "Publishing..."
              : editId
                ? "Update"
                : "Publish"}
          </button>
        </div>
      </form>

      {/* UNIFORM ICON SELECTION MODAL */}
      {iconModalTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                  <LuSparkles className="h-3 w-3" />
                </div>
                <h3 className="font-oswald text-lg font-bold text-secondary uppercase tracking-wide">
                  Select Icon for{" "}
                  {iconModalTarget === "main"
                    ? "Main Service"
                    : `Feature Card #${(iconModalTarget || 0) + 1}`}
                </h3>
              </div>
              <button
                onClick={() => setIconModalTarget(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <LuX className="h-6 w-6" />
              </button>
            </div>

            {/* Live Search Bar */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="relative">
                <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={iconSearchQuery}
                  onChange={(e) => setIconSearchQuery(e.target.value)}
                  placeholder="Search icons (e.g. Anchor, Ship, Safety, Crew, Port)..."
                  className="w-full bg-slate-50 border border-gray-200 focus:border-secondary outline-none pl-10 pr-4 py-2 text-xs font-semibold text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Icon Grid Body */}
            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                {filteredIcons.map((item) => {
                  const IconComp = item.Icon;
                  const currentlyActive =
                    iconModalTarget === "main"
                      ? selectedIcon === item.id
                      : typeof iconModalTarget === "number"
                        ? highlights[iconModalTarget]?.icon === item.id
                        : false;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectIconFromModal(item.id)}
                      className={`flex flex-col items-center justify-center p-3 border transition-all cursor-pointer gap-2 ${currentlyActive
                        ? "bg-primary text-white border-primary shadow-md ring-2 ring-primary/40"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-slate-100 hover:border-secondary hover:text-secondary"
                        }`}
                    >
                      <IconComp className="h-6 w-6" />
                      <span className="text-[10px] font-bold text-center leading-tight truncate max-w-full">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredIcons.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-500 font-medium">
                  No icons matching &quot;{iconSearchQuery}&quot;.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
              <button
                type="button"
                onClick={() => setIconModalTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
