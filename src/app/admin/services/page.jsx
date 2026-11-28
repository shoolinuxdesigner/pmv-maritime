"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import DataTable from "@/components/DataTable/DataTable";
import { hasPermission } from "@/lib/permissions";

import {
  LuShip,
  LuHandshake,
  LuCheck,
  LuArchive,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuShieldAlert,
  LuArrowUpRight,
  LuX,
  LuRefreshCw,
  LuFileText,
} from "react-icons/lu";

import { renderIconById } from "@/lib/maritimeIcons";

export default function AdminServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const canCreate = hasPermission(null, "services:create");
  const canEdit = hasPermission(null, "services:edit");
  const canArchive = hasPermission(null, "services:archive");
  const canDelete = hasPermission(null, "services:delete");

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingService, setDeletingService] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch all services from MongoDB ──────────────────────────────────────
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/services?all=true", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load services.");
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Could not load services.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) fetchServices();
    });
    return () => {
      ignore = true;
    };
  }, [fetchServices]);

  // ── Archive / Restore ────────────────────────────────────────────────────
  const handleToggleArchive = async (row, targetAction) => {
    const isArchived = targetAction === "archive";
    try {
      const res = await fetch("/api/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row._id, archived: isArchived }),
      });
      if (!res.ok) throw new Error("Failed to update service.");
      setServices((prev) =>
        prev.map((s) => (s._id === row._id ? { ...s, archived: isArchived } : s))
      );
      toast.success(isArchived ? "Service moved to Archive." : "Service restored to Published.");
    } catch (err) {
      toast.error(err.message || "Failed to update service.");
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const openDeleteModal = (service) => {
    setDeletingService(service);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingService) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/services", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingService._id }),
      });
      if (!res.ok) throw new Error("Failed to delete service.");
      setServices((prev) => prev.filter((s) => s._id !== deletingService._id));
      toast.success("Service deleted successfully.");
      setDeleteModalOpen(false);
      setDeletingService(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete service.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Reorder (persisted to MongoDB) ───────────────────────────────────────
  const handleSaveOrder = async (newOrderedServices) => {
    try {
      const orderedIds = newOrderedServices.map((s) => s._id || s.id);
      const res = await fetch("/api/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || "Failed to save sequence.");
      }

      setServices((prev) => {
        const orderMap = new Map(orderedIds.map((id, index) => [id, index + 1]));
        return prev
          .map((s) => ({
            ...s,
            order: orderMap.has(s._id) ? orderMap.get(s._id) : s.order,
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
      });

      toast.success("Services sequence updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to save sequence.");
      throw err;
    }
  };

  // ── Split data ────────────────────────────────────────────────────────────
  const publishedServices = services.filter((item) => !item.archived);
  const archivedServices = services.filter((item) => item.archived);
  const currentDisplayedServices =
    activeTab === "active" ? publishedServices : archivedServices;

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    {
      header: "Icon",
      accessor: "icon",
      className: "w-[70px]",
      cell: (row) => (
        <div className="w-9 h-9 bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
          {renderIconById(row.icon, "h-5 w-5")}
        </div>
      ),
    },
    {
      header: "Service Name",
      accessor: "name",
      className: "min-w-[220px]",
      cell: (row) => (
        <p className="text-sm font-bold text-gray-900 leading-snug">{row.name}</p>
      ),
    },
    {
      header: "Category",
      accessor: "category",
      className: "min-w-[160px]",
      cell: (row) => (
        <p className="text-sm font-medium text-gray-600 leading-snug">
          {row.category || "—"}
        </p>
      ),
    },
    {
      header: "Short Description",
      accessor: "shortDesc",
      className: "min-w-[320px]",
      cell: (row) => (
        <p
          className="text-sm font-normal text-gray-600 line-clamp-2 leading-snug"
          title={row.shortDesc}
        >
          {row.shortDesc || "N/A"}
        </p>
      ),
    },
    {
      header: "Deliverables",
      accessor: "deliverables",
      className: "w-[120px]",
      cell: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-slate-100 text-gray-700">
          {Array.isArray(row.deliverables) ? row.deliverables.length : 0} Items
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      className: "w-[190px]",
      cell: (row) => {
        const slug = row.slug || row.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-");

        return (
          <div className="flex items-center gap-1.5 justify-start">
            {/* View Public Page */}
            <Link
              href={`/services/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-slate-100 hover:bg-secondary-dark hover:text-white text-gray-600 border border-gray-200 transition-colors cursor-pointer"
              title="View Public Page"
            >
              <LuArrowUpRight className="text-sm" />
            </Link>

            {/* View Google Drive PDF */}
            {row.brochureUrl ? (
              <a
                href={row.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-red-50 hover:bg-primary hover:text-white text-primary border border-red-200 transition-colors cursor-pointer"
                title="Open Google Drive Brochure PDF (New Tab)"
              >
                <LuFileText className="text-sm" />
              </a>
            ) : (
              <span
                className="p-1.5 bg-slate-100 text-gray-300 border border-gray-200 cursor-not-allowed"
                title="No Brochure PDF link provided"
              >
                <LuFileText className="text-sm" />
              </span>
            )}

            {activeTab === "active" ? (
              <>
                {canEdit && (
                  <Link
                    href={`/admin/services/create?edit=${row._id}`}
                    className="p-1.5 bg-slate-100 hover:bg-secondary hover:text-white text-secondary-dark border border-secondary transition-colors cursor-pointer"
                    title="Edit Service"
                  >
                    <LuPencil className="text-sm" />
                  </Link>
                )}
                {canArchive && (
                  <button
                    onClick={() => handleToggleArchive(row, "archive")}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-800 hover:text-white text-amber-700 border border-amber-200 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                    title="Move to Archive"
                  >
                    <LuArchive className="text-xs" />
                    <span>Archive</span>
                  </button>
                )}
              </>
            ) : (
              <>
                {canArchive && (
                  <button
                    onClick={() => handleToggleArchive(row, "restore")}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-800 hover:text-white text-emerald-700 border border-emerald-200 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                    title="Restore to Published"
                  >
                    <LuCheck className="text-xs" />
                    <span>Restore</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => openDeleteModal(row)}
                    className="p-1.5 bg-red-50 hover:bg-primary hover:text-white text-primary border border-red-200 transition-colors cursor-pointer"
                    title="Delete Permanently"
                  >
                    <LuTrash2 className="text-sm" />
                  </button>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-3 md:p-5 space-y-4">
      {/* Combined Action Bar */}
      <div className="bg-white border border-gray-200 p-2.5 md:px-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Add New Service Button */}
        {canCreate ? (
          <Link
            href="/admin/services/create"
            className="w-full sm:w-auto px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <LuPlus className="text-base" />
            <span>Add New Service</span>
          </Link>
        ) : (
          <div />
        )}

        {/* Tabs */}
        <div className="flex items-center gap-[1.5px] bg-slate-100 p-1 border border-gray-200 w-full sm:w-auto max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === "active"
              ? "bg-white text-primary shadow-xs border border-gray-200"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <LuShip className="text-sm shrink-0" />
            <span>Published</span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-primary/10 text-primary shrink-0">
              {publishedServices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("archive")}
            className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === "archive"
              ? "bg-white text-amber-700 shadow-xs border border-gray-200"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <LuArchive className="text-sm shrink-0" />
            <span>Archived</span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-amber-100 text-amber-800 shrink-0">
              {archivedServices.length}
            </span>
          </button>
        </div>
      </div>

      <DataTable
        data={currentDisplayedServices}
        loading={loading}
        error={error}
        onRefresh={fetchServices}
        columns={columns}
        reorderable={activeTab === "active"}
        onSaveOrder={handleSaveOrder}
        onReorder={handleSaveOrder}
        title={activeTab === "active" ? "Published Services" : "Archived Services"}
        detailTitle="Service Details Preview"
        renderDrawerDetail={(service) => (
          <>
            <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
              <div className="w-12 h-12 bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                {renderIconById(service.icon, "h-6 w-6")}
              </div>
              <div>
                <h3 className="font-oswald text-xl font-bold text-secondary-dark uppercase tracking-wide">
                  {service.name}
                </h3>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  {service.category}
                </span>
              </div>
            </div>

            {/* 3 Key Feature Cards Preview */}
            {Array.isArray(service.highlights) && service.highlights.length > 0 && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  3 Key Feature Cards
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {service.highlights.map((card, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 border border-gray-200">
                      <div className="w-9 h-9 bg-secondary-dark/10 text-secondary-dark flex items-center justify-center shrink-0">
                        {renderIconById(card.icon, "h-4 w-4")}
                      </div>
                      <div>
                        <h4 className="font-bold text-secondary-dark text-xs">{card.title || `Feature #${idx + 1}`}</h4>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed font-medium">
                          {card.description || "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {service.shortDesc && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Short Description
                </label>
                <p className="text-sm font-medium text-gray-700 leading-relaxed bg-slate-50 p-3 border border-gray-200">
                  {service.shortDesc}
                </p>
              </div>
            )}

            {service.longDesc && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Long Description
                </label>
                <p className="text-sm font-medium text-gray-700 leading-relaxed">
                  {service.longDesc}
                </p>
              </div>
            )}

            {Array.isArray(service.deliverables) && service.deliverables.length > 0 && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  What We Deliver
                </label>
                <div className="space-y-2 bg-slate-50 p-3.5 border border-gray-200">
                  {service.deliverables.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs font-medium text-gray-700">
                      <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                        <LuCheck className="h-2.5 w-2.5 text-white" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(service.deliverySteps) && service.deliverySteps.length > 0 && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  How We Deliver ({service.deliverySteps.length} Steps)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 border border-gray-200">
                  {service.deliverySteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white p-2 border border-gray-100">
                      <div className="w-6 h-6 bg-primary text-white text-[10px] flex items-center justify-center shrink-0 font-bold">
                        {renderIconById(step.icon, "h-3.5 w-3.5")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {idx + 1}. {step.title}
                        </p>
                        <p className="text-[11px] text-gray-500 line-clamp-1">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(service.serviceStandards) && service.serviceStandards.length > 0 && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Service Standards ({service.serviceStandards.length} Pillars)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 border border-gray-200">
                  {service.serviceStandards.map((std, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white p-2 border border-gray-100">
                      <div className="w-6 h-6 bg-secondary text-white text-[10px] flex items-center justify-center shrink-0 font-bold">
                        {renderIconById(std.icon, "h-3.5 w-3.5")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{std.title}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-1">{std.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brochure PDF Link */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Brochure PDF / Google Drive Link
              </label>
              {service.brochureUrl ? (
                <div className="flex items-center justify-between gap-3 p-3 bg-red-50/60 border border-red-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <LuFileText className="text-primary text-base shrink-0" />
                    <span className="text-xs font-mono text-gray-700 truncate">
                      {service.brochureUrl}
                    </span>
                  </div>
                  <a
                    href={service.brochureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-3 py-1 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Open PDF
                  </a>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic bg-slate-50 p-2.5 border border-gray-200">
                  No brochure PDF link configured for this service.
                </p>
              )}
            </div>

            {service.promise && (
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  Our Promise
                </label>
                <div className="p-4 bg-secondary/5 border-l-4 border-secondary">
                  <div className="flex items-center gap-2 mb-1.5">
                    <LuHandshake className="text-secondary h-5 w-5" />
                    <h4 className="font-oswald text-sm font-bold text-secondary uppercase">
                      Our Operational Promise
                    </h4>
                  </div>
                  <p className="text-xs md:text-sm font-medium text-gray-700 leading-relaxed">
                    {service.promise}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deletingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-gray-200 shadow-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 text-primary border border-red-200 flex items-center justify-center shrink-0">
                <LuShieldAlert className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-oswald text-lg font-bold text-secondary-dark uppercase tracking-wide">
                  Confirm Delete Service
                </h3>
                <p className="text-xs font-medium text-gray-600 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-gray-900">{deletingService.name}</strong>? This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer p-1"
              >
                <LuX className="text-lg" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
