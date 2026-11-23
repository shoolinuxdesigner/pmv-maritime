"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import DataTable from "@/components/DataTable/DataTable";
import { hasPermission } from "@/lib/permissions";
import {
  LuArchive,
  LuTrash2,
  LuShieldAlert,
  LuInbox,
  LuExternalLink,
  LuPhone,
  LuMail,
  LuCircleCheck,
  LuCircleX,
  LuFileSpreadsheet,
} from "react-icons/lu";

const STATUS_FILTER_OPTIONS = [
  { value: "verified", label: "Verified Only" },
  { value: "failed", label: "Failed / Unverified" },
];

export default function BrochureQueriesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("active"); // "active" | "archive"

  const canDelete = hasPermission(null, "submissions:delete");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchQueries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/queries", { cache: "no-store" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || `Error ${res.status}: Failed to fetch data`);
      }
      const queries = await res.json();
      setData(Array.isArray(queries) ? queries : []);
    } catch (err) {
      setError(err.message || "Failed to load queries from MongoDB.");
      toast.error(err.message || "Failed to load queries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) fetchQueries();
    });
    return () => {
      ignore = true;
    };
  }, [fetchQueries]);

  // Archive or Restore query
  const handleToggleArchive = async (row, targetAction) => {
    try {
      const res = await fetch("/api/queries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row._id, action: targetAction }),
      });

      if (!res.ok) throw new Error("Failed to update status.");

      // Optimistic update local state
      setData((prev) =>
        prev.map((item) =>
          item._id === row._id ? { ...item, archived: targetAction === "archive" } : item
        )
      );

      toast.success(
        targetAction === "archive"
          ? "Query moved to Archive."
          : "Query restored to Active."
      );
    } catch (err) {
      toast.error(err.message || "Failed to update query status.");
    }
  };

  // Delete query permanently
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const res = await fetch("/api/queries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget._id }),
      });

      if (!res.ok) throw new Error("Failed to delete record.");

      // Remove from local state
      setData((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      setDeleteTarget(null);
      toast.success("Query permanently deleted.");
    } catch (err) {
      toast.error(err.message || "Failed to delete query.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Split data into active vs archive
  const activeQueries = data.filter((item) => !item.archived);
  const archivedQueries = data.filter((item) => item.archived);
  const currentDisplayedData = activeTab === "active" ? activeQueries : archivedQueries;

  // Column schema for DataTable
  const columns = [
    {
      header: "Name",
      accessor: "fullName",
      className: "min-w-[170px]",
      cell: (row) => (
        <span className="inline-block text-sm font-bold text-gray-900">
          {row.fullName || "N/A"}
        </span>
      ),
    },
    {
      header: "Mobile",
      accessor: "phone",
      className: "min-w-[150px]",
      cell: (row) =>
        row.phone ? (
          <a
            href={`tel:${row.phone.replace(/\s+/g, "")}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary-dark hover:text-primary transition-colors font-mono"
            title="Call client"
          >
            <LuPhone className="text-xs text-gray-400 shrink-0" />
            <span>{row.phone}</span>
          </a>
        ) : (
          <span className="text-sm text-gray-400">N/A</span>
        ),
    },
    {
      header: "Email Address",
      accessor: "email",
      className: "min-w-[200px]",
      cell: (row) =>
        row.email ? (
          <a
            href={`mailto:${row.email}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-primary hover:underline transition-colors font-mono"
            title="Send email"
          >
            <LuMail className="text-xs text-gray-400 shrink-0" />
            <span className="truncate max-w-[210px]">{row.email}</span>
          </a>
        ) : (
          <span className="text-sm text-gray-400">N/A</span>
        ),
    },
    {
      header: "Date & Time",
      accessor: "dateTime",
      className: "min-w-[170px]",
      cell: (row) => (
        <span className="inline-block text-xs font-medium text-gray-600 whitespace-nowrap">
          {row.dateTime || (row.createdAt ? new Date(row.createdAt).toLocaleString("en-IN") : "N/A")}
        </span>
      ),
    },
    {
      header: "Source",
      accessor: "serviceName",
      className: "min-w-[210px]",
      cell: (row) => {
        const href = row.sourceUrl || (row.serviceSlug ? `/services/${row.serviceSlug}` : "#");
        return (
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary-dark hover:text-primary transition-colors group"
            title={`View ${row.serviceName || "service"} page`}
          >
            <span className="truncate max-w-[200px]">{row.serviceName || "PMV Maritime Service"}</span>
            <LuExternalLink className="text-xs text-gray-400 group-hover:text-primary shrink-0 transition-colors" />
          </Link>
        );
      },
    },
    {
      header: "Verification",
      accessor: "status",
      className: "min-w-[150px]",
      cell: (row) => {
        const isVerified = row.status === "verified" || row.verified === true;
        return isVerified ? (
          <span className="inline-flex items-center gap-1.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            <LuCircleCheck className="text-xs text-emerald-600 shrink-0" />
            <span>Verified</span>
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 py-1 text-[11px] font-bold uppercase tracking-wider text-rose-700"
            title={row.failedReason || "Verification not completed"}
          >
            <LuCircleX className="text-xs text-rose-600 shrink-0" />
            <span>Failed</span>
          </span>
        );
      },
    },
    {
      header: "Actions",
      accessor: "actions",
      className: "min-w-[140px]",
      cell: (row) => (
        <div className="flex items-center gap-1.5 justify-start">
          {activeTab === "active" ? (
            <button
              onClick={() => handleToggleArchive(row, "archive")}
              className="px-2.5 pt-1.5 pb-1 bg-amber-50 hover:bg-amber-800 hover:text-white text-amber-700 border border-amber-200 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
              title="Move to Archive"
            >
              <LuArchive className="text-xs" />
              <span>Archive</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => handleToggleArchive(row, "restore")}
                className="px-2.5 pt-1.5 pb-1 bg-emerald-50 hover:bg-emerald-800 hover:text-white text-emerald-700 border border-emerald-200 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                title="Restore to Active"
              >
                <span>Restore</span>
              </button>
              {canDelete && (
                <button
                  onClick={() => setDeleteTarget(row)}
                  className="px-2.5 pt-1.5 pb-1 bg-red-50 hover:bg-primary hover:text-white text-red-800 border border-red-200 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                  title="Delete Permanently"
                >
                  <LuTrash2 className="text-xs" />
                  <span>Delete</span>
                </button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-3 md:p-5 space-y-4">
      {/* Header Info Banner */}
      <div className="bg-white border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
            <LuFileSpreadsheet className="text-xl" />
          </div>
          <div>
            <h2 className="font-oswald text-lg font-bold text-secondary uppercase tracking-wide">
              General Queries Submitted
            </h2>
          </div>
        </div>

        {/* Tab Buttons: Active vs Archive */}
        <div className="flex items-center gap-[1.5px] bg-slate-100 p-1 border border-gray-200 w-full sm:w-auto max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === "active"
              ? "bg-white text-primary shadow-xs border border-gray-200"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <LuInbox className="text-sm shrink-0" />
            <span>Active</span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-primary/10 text-primary shrink-0">
              {activeQueries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("archive")}
            className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-tight sm:tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${activeTab === "archive"
              ? "bg-white text-amber-700 shadow-xs border border-gray-200"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <LuArchive className="text-sm shrink-0" />
            <span>Archive</span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono bg-amber-100 text-amber-800 shrink-0">
              {archivedQueries.length}
            </span>
          </button>
        </div>
      </div>

      {/* Reusable DataTable without eye view button */}
      <DataTable
        data={currentDisplayedData}
        loading={loading}
        error={error}
        onRefresh={fetchQueries}
        columns={columns}
        showViewButton={false}
        filterOptions={STATUS_FILTER_OPTIONS}
        title={activeTab === "active" ? "Active Queries" : "Archived Queries"}
        exportFilename={`pmv_brochure_queries_${activeTab}.csv`}
        searchPlaceholder="Search by name, mobile, email, source..."
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-gray-200 shadow-2xl p-6 relative">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 border border-red-100 text-primary flex items-center justify-center flex-shrink-0">
                <LuShieldAlert className="text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-oswald text-xl font-bold text-secondary uppercase tracking-wide">
                  Delete Permanently<span className="text-primary">.</span>
                </h3>
                <p className="text-sm text-gray-600 font-medium mt-1 leading-relaxed">
                  Are you sure you want to permanently delete query from{" "}
                  <strong className="text-gray-900">{deleteTarget.fullName}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <LuTrash2 className="text-sm" />
                <span>{isDeleting ? "Deleting..." : "Delete Permanently"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
