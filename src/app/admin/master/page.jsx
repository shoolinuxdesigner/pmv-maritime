"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import DataTable from "@/components/DataTable/DataTable";

import {
  LuFolderOpen,
  LuShip,
  LuMail,
  LuBriefcaseBusiness,
  LuPencil,
  LuTrash2,
  LuShieldAlert,
  LuX,
  LuPlus,
  LuCheck,
  LuWrench,
  LuUser,
  LuCalendar,
} from "react-icons/lu";
import { getCurrentUserSession } from "@/lib/permissions";

export default function MasterPage() {
  const [activeTab, setActiveTab] = useState("services");
  const [masterData, setMasterData] = useState({
    projects: [],
    services: [],
    contact: [],
    careers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dynamic Maintenance Mode state for Master Settings page
  const [maintenanceModeLive, setMaintenanceModeLive] = useState(false);
  const [bypassPasswordsList, setBypassPasswordsList] = useState([]);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [maintenanceFetchLoading, setMaintenanceFetchLoading] = useState(false);

  // Bypass Password Form State (Left Panel)
  const [bypassFormLabel, setBypassFormLabel] = useState("");
  const [bypassFormPassword, setBypassFormPassword] = useState("");
  const [bypassFormDuration, setBypassFormDuration] = useState("20");
  const [editingBypassIndex, setEditingBypassIndex] = useState(null);

  const fetchMaintenanceSystemInfo = useCallback(async () => {
    setMaintenanceFetchLoading(true);
    try {
      const res = await fetch("/api/settings/maintenance", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceModeLive(Boolean(data.isEnabled));
        if (Array.isArray(data.bypassPasswords)) {
          setBypassPasswordsList(data.bypassPasswords);
        }
      }
    } catch (err) {
      console.error("Error fetching system maintenance info:", err);
      toast.error("Failed to load maintenance mode configuration.");
    } finally {
      setMaintenanceFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    if (activeTab === "system") {
      Promise.resolve().then(() => {
        if (!ignore) fetchMaintenanceSystemInfo();
      });
    }
    return () => {
      ignore = true;
    };
  }, [activeTab, fetchMaintenanceSystemInfo]);

  const handleToggleLiveMaintenance = async (targetState) => {
    setIsSavingMaintenance(true);
    try {
      const res = await fetch("/api/settings/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled: targetState,
          bypassPasswords: bypassPasswordsList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update maintenance mode.");
      }

      setMaintenanceModeLive(targetState);
      if (targetState) {
        toast.error("Maintenance Mode turned ON");
      } else {
        toast.success("Maintenance Mode turned OFF");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update maintenance mode.");
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  const handleSaveBypassPasswords = async () => {
    setIsSavingMaintenance(true);
    try {
      const res = await fetch("/api/settings/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled: maintenanceModeLive,
          bypassPasswords: bypassPasswordsList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save bypass configuration.");
      }

      toast.success("Bypass passwords and session settings saved successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  const handleBypassPasswordChange = (index, field, value) => {
    const updated = [...bypassPasswordsList];
    updated[index] = { ...updated[index], [field]: value };
    setBypassPasswordsList(updated);
  };

  const resetBypassForm = () => {
    setBypassFormLabel("");
    setBypassFormPassword("");
    setBypassFormDuration("20");
    setEditingBypassIndex(null);
  };

  const handleSaveBypassPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!bypassFormLabel.trim() || !bypassFormPassword.trim()) {
      toast.error("Label and Password fields are required.");
      return;
    }

    const durationNum = parseInt(bypassFormDuration, 10) || 20;
    const newEntry = {
      label: bypassFormLabel.trim(),
      password: bypassFormPassword.trim(),
      durationMinutes: durationNum,
    };

    let updatedList = [...bypassPasswordsList];
    if (editingBypassIndex !== null && editingBypassIndex >= 0) {
      updatedList[editingBypassIndex] = newEntry;
    } else {
      updatedList.push(newEntry);
    }

    setIsSavingMaintenance(true);
    try {
      const res = await fetch("/api/settings/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled: maintenanceModeLive,
          bypassPasswords: updatedList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save bypass password.");
      }

      setBypassPasswordsList(updatedList);
      toast.success(editingBypassIndex !== null ? "Bypass password updated!" : "New bypass password added!");
      resetBypassForm();
    } catch (err) {
      toast.error(err.message || "Failed to save bypass password.");
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  const handleEditBypassItem = (item, index) => {
    setBypassFormLabel(item.label || "");
    setBypassFormPassword(item.password || "");
    setBypassFormDuration(item.durationMinutes ? item.durationMinutes.toString() : "20");
    setEditingBypassIndex(index);
  };

  const handleDeleteBypassItem = async (indexToDelete) => {
    const updatedList = bypassPasswordsList.filter((_, idx) => idx !== indexToDelete);
    setIsSavingMaintenance(true);
    try {
      const res = await fetch("/api/settings/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled: maintenanceModeLive,
          bypassPasswords: updatedList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete bypass password.");
      }

      setBypassPasswordsList(updatedList);
      toast.success("Bypass password deleted successfully.");
      if (editingBypassIndex === indexToDelete) {
        resetBypassForm();
      }
    } catch (err) {
      toast.error(err.message || "Failed to delete bypass password.");
    } finally {
      setIsSavingMaintenance(false);
    }
  };

  // Form State: Name & Status
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Active");
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Fetch Master Records from MongoDB ──────────────────────
  const fetchMasterRecords = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/master", { cache: "no-store" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || `Error ${res.status}: Failed to fetch master records`);
      }
      const data = await res.json();

      const grouped = {
        projects: [],
        services: [],
        contact: [],
        careers: [],
      };

      if (Array.isArray(data)) {
        data.forEach((item) => {
          const mod = item.module || "projects";
          if (grouped[mod]) {
            grouped[mod].push(item);
          }
        });
      }

      setMasterData(grouped);
    } catch (err) {
      setError(err.message || "Failed to load master records from database.");
      toast.error(err.message || "Failed to load master records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) fetchMasterRecords();
    });
    return () => {
      ignore = true;
    };
  }, [fetchMasterRecords]);

  // Reset Form
  const resetForm = () => {
    setName("");
    setStatus("Active");
    setEditingId(null);
  };

  // Switch Tab Handler
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    resetForm();
  };

  // Form Submit (Add / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name field is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const sessionUser = getCurrentUserSession();
      const performer =
        sessionUser?.fullName ||
        sessionUser?.name ||
        sessionUser?.username ||
        "Super Administrator";

      if (editingId) {
        // Update item in MongoDB
        const res = await fetch("/api/master", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-performed-by": encodeURIComponent(performer),
          },
          body: JSON.stringify({
            id: editingId,
            name: name.trim(),
            status,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.error || "Failed to update record.");
        }

        const nowIso = new Date().toISOString();
        setMasterData((prev) => ({
          ...prev,
          [activeTab]: prev[activeTab].map((item) =>
            (item._id || item.id) === editingId
              ? {
                ...item,
                name: name.trim(),
                status,
                updatedBy: performer,
                updatedAt: nowIso,
              }
              : item
          ),
        }));
        toast.success("Master record updated successfully.");
      } else {
        // Add new item to MongoDB
        const res = await fetch("/api/master", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-performed-by": encodeURIComponent(performer),
          },
          body: JSON.stringify({
            module: activeTab,
            name: name.trim(),
            status,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.error || "Failed to create record.");
        }

        const result = await res.json();
        if (result.data) {
          setMasterData((prev) => ({
            ...prev,
            [activeTab]: [...prev[activeTab], result.data],
          }));
        } else {
          fetchMasterRecords();
        }
        toast.success("New Master record added successfully.");
      }

      resetForm();
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Item Handler
  const handleEdit = (item) => {
    setName(item.name || "");
    setStatus(item.status || "Active");
    setEditingId(item._id || item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete Handlers
  const openDeleteModal = (item) => {
    setDeletingItem(item);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);
    const targetId = deletingItem._id || deletingItem.id;

    try {
      const res = await fetch("/api/master", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || "Failed to delete record.");
      }

      setMasterData((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(
          (i) => (i._id || i.id) !== targetId
        ),
      }));

      if (editingId === targetId) {
        resetForm();
      }
      toast.success("Master record deleted successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to delete record.");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setDeletingItem(null);
    }
  };

  // ── Reorder (persisted to MongoDB via PATCH) ────────────────────────────
  const handleSaveOrder = async (newOrderedItems) => {
    try {
      const orderedIds = newOrderedItems.map((item) => item._id || item.id);
      const res = await fetch("/api/master", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData?.error || "Failed to save sequence.");
      }

      setMasterData((prev) => {
        const orderMap = new Map(orderedIds.map((id, index) => [id, index + 1]));
        return {
          ...prev,
          [activeTab]: prev[activeTab]
            .map((item) => ({
              ...item,
              order: orderMap.has(item._id || item.id) ? orderMap.get(item._id || item.id) : item.order,
            }))
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
        };
      });

      toast.success("Master sequence updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to save sequence.");
      throw err;
    }
  };

  const items = masterData[activeTab] || [];

  const tabConfig = [
    { key: "services", label: "Services Master", icon: LuShip },
    { key: "projects", label: "Projects Master", icon: LuFolderOpen },
    { key: "contact", label: "Contact Form Master", icon: LuMail },
    { key: "careers", label: "Careers Master", icon: LuBriefcaseBusiness },
    { key: "system", label: "System Maintenance", icon: LuWrench },
  ];

  // ── DataTable Columns ────────────────────────────────────────────────────
  const columns = [
    {
      header: "Name",
      accessor: "name",
      cell: (row) => (
        <p className="text-sm font-bold text-gray-900 leading-snug">{row.name}</p>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      className: "w-32",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-xs ${row.status === "Active"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-gray-100 text-gray-600"
            }`}
        >
          <LuCheck className="text-xs" />
          {row.status || "Active"}
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "actions",
      className: "w-28 text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 bg-slate-100 hover:bg-secondary hover:text-white text-secondary-dark border border-secondary transition-colors cursor-pointer"
            title="Edit Record"
          >
            <LuPencil className="text-sm" />
          </button>
          <button
            onClick={() => openDeleteModal(row)}
            className="p-1.5 bg-slate-100 hover:bg-primary hover:text-white text-primary border border-primary transition-colors cursor-pointer"
            title="Delete Record"
          >
            <LuTrash2 className="text-sm" />
          </button>
        </div>
      ),
    },
  ];

  const formatDateTime = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderMasterDrawerDetail = (row) => {
    if (!row) return null;

    const moduleConfig = tabConfig.find((t) => t.key === (row.module || activeTab));
    const moduleLabel =
      moduleConfig?.label ||
      (row.module ? `${row.module.charAt(0).toUpperCase()}${row.module.slice(1)} Master` : "Master");
    const ModuleIcon = moduleConfig?.icon || LuFolderOpen;

    const createdByName = row.createdBy || "Super Administrator";
    const createdDateFormatted = formatDateTime(row.createdAt);

    const updatedByName = row.updatedBy || (row.updatedAt ? (row.createdBy || "Super Administrator") : null);
    const updatedDateFormatted = formatDateTime(row.updatedAt);

    return (
      <div className="space-y-6">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
            Category Name
          </label>
          <div className="bg-slate-50 border border-gray-200 p-3.5">
            <p className="text-base font-bold text-secondary-dark leading-snug">
              {row.name}
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
            Master Section
          </label>
          <div className="bg-slate-50 border border-gray-200 p-3 flex items-center gap-2">
            <ModuleIcon className="text-secondary text-base shrink-0" />
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              {moduleLabel}
            </span>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
            Status
          </label>
          <div className="bg-slate-50 border border-gray-200 p-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase ${row.status === "Active"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${row.status === "Active" ? "bg-emerald-500" : "bg-gray-400"
                  }`}
              />
              {row.status || "Active"}
            </span>
          </div>
        </div>

        {typeof row.order === "number" && (
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Sequence Order
            </label>
            <div className="bg-slate-50 border border-gray-200 p-3">
              <span className="text-xs font-bold text-gray-700 font-mono">
                #{row.order}
              </span>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
            Created By
          </label>
          <div className="bg-slate-50 border border-gray-200 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <LuUser className="text-primary text-sm shrink-0" />
              <span className="text-sm font-bold text-gray-900">
                {createdByName}
              </span>
            </div>
            {createdDateFormatted ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium pl-5">
                <LuCalendar className="text-xs text-gray-400 shrink-0" />
                <span>{createdDateFormatted}</span>
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-medium pl-5 italic">Initial Setup</p>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
            Updated By
          </label>
          <div className="bg-slate-50 border border-gray-200 p-3.5 space-y-1.5">
            {updatedByName || updatedDateFormatted ? (
              <>
                <div className="flex items-center gap-2">
                  <LuUser className="text-secondary text-sm shrink-0" />
                  <span className="text-sm font-bold text-gray-900">
                    {updatedByName || "Super Administrator"}
                  </span>
                </div>
                {updatedDateFormatted && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium pl-5">
                    <LuCalendar className="text-xs text-gray-400 shrink-0" />
                    <span>{updatedDateFormatted}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400 italic">Not updated yet</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 md:p-5 space-y-5">
      {/* ═══════════════════════════════════════════════════
          TAB NAVIGATION BAR
         ═══════════════════════════════════════════════════ */}
      <div className="bg-white border border-gray-200 p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {tabConfig.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`w-full md:w-fit flex items-center gap-2 px-4 py-2.5 font-bold text-xs md:text-sm uppercase tracking-wider transition-all cursor-pointer ${isActive
                  ? "border border-primary bg-primary text-white shadow-xs"
                  : "border border-gray-200 bg-slate-50 text-secondary-dark hover:bg-slate-100"
                  }`}
              >
                <TabIcon className="text-base" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>


      {activeTab === "system" ? (
        <div className="space-y-5">
          {/* Top Status Toggle Card */}
          <div className="bg-white border border-gray-200 shadow-xs p-3 flex items-center justify-between">
            <div className="space-y-0">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${maintenanceModeLive ? "bg-amber-500 animate-pulse" : "bg-green-500"}`}></span>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Site Status:
                </h3>
              </div>
              <p className="text-md font-bold">
                {maintenanceModeLive ? (<span className="text-amber-600">UNDER MAINTENANCE</span>) : (<span className="text-green-500">LIVE & ONLINE</span>)}
              </p>
            </div>

            <button
              type="button"
              disabled={isSavingMaintenance || maintenanceFetchLoading}
              onClick={() => handleToggleLiveMaintenance(!maintenanceModeLive)}
              className={`relative inline-flex h-8 w-18 shrink-0 cursor-pointer border-4 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${maintenanceModeLive ? "bg-amber-500" : "bg-green-500"
                }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform bg-white shadow ring-0 transition duration-200 ease-in-out ${maintenanceModeLive ? "translate-x-10" : "translate-x-0"
                  }`}
              />
            </button>
          </div>

          {/* 2-Column Section: Left Form + Right Table */}
          <div className="flex flex-col xl:flex-row gap-5">
            {/* ─── LEFT PANEL: Add / Edit Bypass Password Form ─── */}
            <div className="w-full xl:w-[360px] xl:min-w-[360px] flex-shrink-0">
              <div className="bg-white border border-gray-200 shadow-xs">
                <div className="px-5 py-4 border-b border-gray-200 bg-slate-50 flex items-center justify-between">
                  <h2 className="font-oswald text-lg font-bold text-secondary uppercase tracking-wide">
                    {editingBypassIndex !== null ? "Edit Password" : "Add Password"}
                    <span className="text-primary">.</span>
                  </h2>
                  {editingBypassIndex !== null && (
                    <button
                      onClick={resetBypassForm}
                      className="p-1.5 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                      title="Cancel Edit"
                    >
                      <LuX className="text-lg" />
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveBypassPasswordSubmit} className="p-5 space-y-4">
                  {/* Label Field */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                      Role / Description <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={bypassFormLabel}
                      onChange={(e) => setBypassFormLabel(e.target.value)}
                      placeholder="e.g. Admin Access"
                      className="w-full bg-slate-50 border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none px-4 py-2.5 text-sm text-gray-900 font-medium placeholder-gray-400"
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                      Bypass Password <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={bypassFormPassword}
                      onChange={(e) => setBypassFormPassword(e.target.value)}
                      placeholder="e.g. something@0000"
                      className="w-full bg-slate-50 border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none px-4 py-2.5 text-sm font-mono font-bold text-gray-900 placeholder-gray-400"
                      required
                    />
                  </div>

                  {/* Duration Field */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                      Bypass Duration (Minutes) <span className="text-primary">*</span>
                    </label>
                    <input
                      type="number"
                      value={bypassFormDuration}
                      onChange={(e) => setBypassFormDuration(e.target.value)}
                      placeholder="e.g. 20 for 20 mins, 1200 for 20 hrs"
                      className="w-full bg-slate-50 border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none px-4 py-2.5 text-sm text-gray-900 font-medium placeholder-gray-400"
                      required
                      min="1"
                    />
                    <p className="text-[11px] text-gray-400 mt-1 font-mono">
                      {parseInt(bypassFormDuration || 0, 10) >= 60
                        ? `(~${(parseInt(bypassFormDuration || 0, 10) / 60).toFixed(1)} Hours)`
                        : `(${bypassFormDuration || 0} Minutes)`}
                    </p>
                  </div>

                  {/* Submit / Clear Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingMaintenance}
                      className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <LuPlus className="text-sm" />
                      <span>
                        {isSavingMaintenance
                          ? editingBypassIndex !== null
                            ? "Updating..."
                            : "Adding..."
                          : editingBypassIndex !== null
                            ? "Update Password"
                            : "Add Password"}
                      </span>
                    </button>
                    {bypassFormLabel && (
                      <button
                        type="button"
                        onClick={resetBypassForm}
                        disabled={isSavingMaintenance}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-600 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* ─── RIGHT PANEL: Tabular Form of Configured Bypass Passwords ─── */}
            <div className="flex-1 min-w-0">
              <div className="bg-white border border-gray-200 shadow-xs">
                <div className="px-5 py-4 border-b border-gray-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between">
                  <h3 className="font-oswald text-lg font-bold text-secondary uppercase tracking-wide">
                    Configured Passwords<span className="text-primary">.</span>
                  </h3>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Total: {bypassPasswordsList.length} Entries
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Role / Label</th>
                        <th className="px-4 py-3">Password</th>
                        <th className="px-4 py-3">Session Duration</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {bypassPasswordsList.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-gray-400 font-medium">
                            No custom bypass passwords configured.
                          </td>
                        </tr>
                      ) : (
                        bypassPasswordsList.map((item, idx) => {
                          const mins = parseInt(item.durationMinutes, 10) || 20;
                          const durationText = mins >= 60 ? `${(mins / 60).toFixed(1)} Hours (${mins} mins)` : `${mins} Mins`;
                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{item.label || "Bypass Access"}</td>
                              <td className="px-4 py-3 font-mono font-bold text-secondary whitespace-nowrap">{item.password}</td>
                              <td className="px-4 py-3 font-mono text-gray-600">
                                <span className="inline-block px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-semibold text-[11px] whitespace-nowrap">
                                  {durationText}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEditBypassItem(item, idx)}
                                    className="p-1.5 bg-slate-100 hover:bg-secondary hover:text-white text-secondary-dark border border-secondary transition-colors cursor-pointer"
                                    title="Edit Password"
                                  >
                                    <LuPencil className="text-sm" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBypassItem(idx)}
                                    className="p-1.5 bg-slate-100 hover:bg-primary hover:text-white text-primary border border-primary transition-colors cursor-pointer"
                                    title="Delete Password"
                                  >
                                    <LuTrash2 className="text-sm" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row gap-5">
          {/* ─── LEFT PANEL: Add / Edit Form (Only Name & Status) ─── */}
          <div className="w-full xl:w-[360px] xl:min-w-[360px] flex-shrink-0">
            <div className="bg-white border border-gray-200 shadow-xs">
              <div className="px-5 py-4 border-b border-gray-200 bg-slate-50 flex items-center justify-between">
                <h2 className="font-oswald text-lg font-bold text-secondary uppercase tracking-wide">
                  {editingId ? "Edit Record" : "Add Record"}
                  <span className="text-primary">.</span>
                </h2>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="p-1.5 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                    title="Cancel Edit"
                  >
                    <LuX className="text-lg" />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Name Field */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                    Name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name..."
                    className="w-full bg-slate-50 border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none px-4 py-2.5 text-sm text-gray-900 font-medium placeholder-gray-400"
                    required
                  />
                </div>

                {/* Status Selector */}
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 focus:border-secondary outline-none px-4 py-2.5 text-sm text-gray-900 font-medium cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Submit / Clear Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <LuPlus className="text-sm" />
                    <span>
                      {isSubmitting
                        ? editingId
                          ? "Updating..."
                          : "Adding..."
                        : editingId
                          ? "Update Record"
                          : "Add Record"}
                    </span>
                  </button>
                  {name && (
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-600 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* ─── RIGHT PANEL: DataTable with Drag & Drop Reordering ─── */}
          <div className="flex-1 min-w-0">
            <DataTable
              data={items}
              loading={loading}
              error={error}
              onRefresh={fetchMasterRecords}
              columns={columns}
              reorderable={true}
              onSaveOrder={handleSaveOrder}
              onReorder={handleSaveOrder}
              title={`${tabConfig.find((t) => t.key === activeTab)?.label || "Master Records"}`}
              detailTitle={`${tabConfig.find((t) => t.key === activeTab)?.label || "Master Category"} Details`}
              renderDrawerDetail={renderMasterDrawerDetail}
              searchPlaceholder="Search records by name..."
              exportFilename={`${activeTab}_master_export.csv`}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
         ═══════════════════════════════════════════════════ */}
      {deleteModalOpen && deletingItem && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-gray-200 shadow-2xl p-6 md:p-8 relative">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 border border-red-100 text-primary flex items-center justify-center flex-shrink-0">
                <LuShieldAlert className="text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-oswald text-xl font-bold text-secondary uppercase tracking-wide">
                  Delete Master Record<span className="text-primary">?</span>
                </h3>
                <p className="text-sm text-gray-600 font-medium mt-1 leading-relaxed">
                  Are you sure you want to delete this master record?
                </p>
                <div className="mt-3 p-3 bg-slate-50 border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                    Item Name
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {deletingItem.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletingItem(null);
                }}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <LuTrash2 className="text-sm" />
                <span>{isDeleting ? "Deleting..." : "Yes, Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
