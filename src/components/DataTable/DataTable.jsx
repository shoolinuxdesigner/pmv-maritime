"use client";

import React, { useState, useEffect } from "react";
import {
  LuSearch,
  LuFilter,
  LuDownload,
  LuRotateCw,
  LuShieldAlert,
  LuChevronLeft,
  LuChevronRight,
  LuX,
  LuEye,
  LuGripVertical,
  LuCheck,
  LuArrowUpDown,
} from "react-icons/lu";

export default function DataTable({
  data = [],
  loading = false,
  error = "",
  onRefresh,
  columns = [],
  filterOptions = [],
  title = "Data Submissions",
  detailTitle,
  renderDrawerDetail,
  showViewButton = true,
  exportFilename = "data_export.csv",
  searchPlaceholder = "Search records...",
  reorderable = false,
  onSaveOrder = null,
  onReorder = null,
}) {
  const saveOrderCallback = onSaveOrder || onReorder;
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Reordering state
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedData, setReorderedData] = useState([]);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Selected row for detail modal & drawer closing animation state
  const [selectedRowDetail, setSelectedRowDetail] = useState(null);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);

  // Sync reorderedData when data updates (and not actively reordering)
  useEffect(() => {
    if (!isReorderMode) {
      const timer = setTimeout(() => {
        setReorderedData(data);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [data, isReorderMode]);

  const openDrawer = (row) => {
    setSelectedRowDetail(row);
    setIsDrawerClosing(false);
  };

  const closeDrawer = () => {
    setIsDrawerClosing(true);
    setTimeout(() => {
      setSelectedRowDetail(null);
      setIsDrawerClosing(false);
    }, 360);
  };

  // Reorder mode handlers
  const handleStartReorder = () => {
    setReorderedData([...data]);
    setIsReorderMode(true);
  };

  const handleCancelReorder = () => {
    setIsReorderMode(false);
    setReorderedData([...data]);
    setDraggedIdx(null);
  };

  const handleSaveReorder = async () => {
    if (!saveOrderCallback) return;
    setIsSavingOrder(true);
    try {
      await saveOrderCallback(reorderedData);
      setIsReorderMode(false);
    } catch (err) {
      // Remain in reorder mode if save fails
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const updatedList = [...reorderedData];
    const itemToMove = updatedList[draggedIdx];
    updatedList.splice(draggedIdx, 1);
    updatedList.splice(targetIdx, 0, itemToMove);

    setDraggedIdx(targetIdx);
    setReorderedData(updatedList);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Filter data (when not in reorder mode)
  const filteredData = data.filter((row) => {
    const rowValues = Object.values(row)
      .filter((val) => typeof val === "string" || typeof val === "number")
      .join(" ")
      .toLowerCase();
    const matchesSearch = search === "" || rowValues.includes(search.toLowerCase());

    const filterFieldVal = row.query || row.category || row.status || "";
    const matchesFilter = selectedFilter === "" || filterFieldVal === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  // Effective display data
  const displayData = isReorderMode ? reorderedData : filteredData;

  // Pagination calculations (disabled during reorder mode to reorder full list)
  const totalEntries = displayData.length;
  const totalPages = isReorderMode ? 1 : Math.max(1, Math.ceil(totalEntries / pageSize));
  const startIndex = isReorderMode ? 0 : (currentPage - 1) * pageSize;
  const paginatedData = isReorderMode ? displayData : displayData.slice(startIndex, startIndex + pageSize);

  // Export to CSV function
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;

    const headers = columns.map((col) => col.header);
    const rows = filteredData.map((row) =>
      columns.map((col) => {
        const val = col.accessor ? row[col.accessor] : col.render ? col.render(row) : "";
        return `"${String(val || "").replace(/"/g, '""')}"`;
      })
    );

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", exportFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="bg-white border border-gray-200 p-4 shadow-xs flex flex-col md:flex-row md:flex-wrap gap-3 md:gap-4 justify-between items-stretch md:items-center">
        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-center w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              disabled={isReorderMode}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none pl-9 pr-4 py-2 text-xs transition-all text-gray-900 placeholder-gray-400 font-medium disabled:opacity-50"
            />
            <LuSearch className="absolute left-3 top-2.5 text-gray-400 text-sm" />
          </div>

          {/* Filter Dropdown */}
          {filterOptions.length > 0 && (
            <div className="relative w-full sm:w-48">
              <select
                value={selectedFilter}
                disabled={isReorderMode}
                onChange={(e) => {
                  setSelectedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-gray-200 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none px-3 py-2 pr-8 text-xs transition-all text-gray-900 font-medium appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">All Categories</option>
                {filterOptions
                  .filter((opt) => opt.value !== "")
                  .map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
              </select>
              <LuFilter className="absolute right-3 top-2.5 text-gray-400 text-xs pointer-events-none" />
            </div>
          )}
        </div>

        {/* Action Controls: Show Entries -> Rearrange -> Refresh -> CSV Export */}
        <div id="datatable-top-controls" className="md:ms-auto flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-center sm:justify-end">
          {/* Rows selector */}
          {!isReorderMode && (
            <div id="datatable-page-size" className="flex items-center gap-2 text-xs text-gray-500 font-bold">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-gray-200 outline-none px-2.5 py-1.5 text-xs font-bold text-gray-700 focus:border-secondary cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Rearrange Sequence Toggle Button */}
            {reorderable && (
              <>
                {!isReorderMode ? (
                  <button
                    id="datatable-reorder-btn"
                    onClick={handleStartReorder}
                    disabled={data.length <= 1}
                    className="h-[34px] px-3 py-1.5 bg-secondary hover:bg-secondary-dark text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
                    title="Enable Drag to Rearrange Sequence"
                  >
                    <LuArrowUpDown className="text-sm" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveReorder}
                      disabled={isSavingOrder}
                      className="h-[34px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <LuCheck className="text-sm text-white" />
                      <span>{isSavingOrder ? "Saving..." : "Save Sequence"}</span>
                    </button>
                    <button
                      onClick={handleCancelReorder}
                      disabled={isSavingOrder}
                      className="h-[34px] px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-gray-700 font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <LuX className="text-sm" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Refresh Button */}
            {onRefresh && !isReorderMode && (
              <button
                id="datatable-refresh-btn"
                onClick={onRefresh}
                className="h-[34px] w-[34px] bg-white border border-gray-200 text-gray-600 hover:text-primary hover:border-primary transition-all shadow-xs cursor-pointer flex items-center justify-center"
                title="Refresh Data"
              >
                <LuRotateCw className={`text-base ${loading ? "animate-spin" : ""}`} />
              </button>
            )}

            {/* Export CSV Button */}
            {!isReorderMode && (
              <button
                id="datatable-export-btn"
                onClick={handleExportCSV}
                disabled={filteredData.length === 0}
                className="h-[34px] px-3 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <LuDownload className="text-sm" /> <span className="whitespace-nowrap">Export CSV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rearrange Mode Alert Banner */}
      {isReorderMode && (
        <div className="bg-amber-50 border border-amber-200 p-3 flex items-center justify-between text-xs text-amber-800 font-semibold">
          <div className="flex items-center gap-2">
            <LuGripVertical className="text-amber-600 text-base" />
            <span>
              <strong>Rearrange Mode Active:</strong> Click and drag the grip handle on the left of any row to reorder the list, then click <strong>Save Sequence</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="bg-white border border-gray-200 shadow-xs relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-3">
            <LuRotateCw className="text-3xl text-secondary animate-spin" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">
              Fetching Data...
            </span>
          </div>
        )}

        {/* Error State */}
        {error ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2 border border-red-100">
              <LuShieldAlert className="text-xl" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Failed to Load Data</h3>
            <p className="text-xs text-red-500 mt-1 max-w-md mx-auto">{error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        ) : paginatedData.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No records found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or search parameters.</p>
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 font-oswald text-xs uppercase tracking-wider text-gray-600">
                  {isReorderMode && <th className="px-3 py-3.5 font-bold w-10 text-center">Drag</th>}
                  <th className="px-5 py-3.5 font-bold w-12">#</th>
                  {columns.map((col, idx) => (
                    <th key={idx} className={`px-5 py-3.5 font-bold ${col.className || ""}`}>
                      {col.header}
                    </th>
                  ))}
                  {showViewButton && <th className="px-5 py-3.5 font-bold text-right">View</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {paginatedData.map((row, rowIdx) => {
                  const isBeingDragged = draggedIdx === rowIdx;

                  return (
                    <tr
                      key={row._id || rowIdx}
                      draggable={isReorderMode}
                      onDragStart={(e) => isReorderMode && handleDragStart(e, rowIdx)}
                      onDragOver={(e) => isReorderMode && handleDragOver(e, rowIdx)}
                      onDragEnd={handleDragEnd}
                      className={`transition-colors ${isBeingDragged
                        ? "bg-secondary/15 border-l-4 border-l-secondary shadow-md"
                        : "hover:bg-slate-50/80"
                        } ${isReorderMode ? "cursor-grab active:cursor-grabbing" : ""}`}
                    >
                      {/* Drag Handle Column */}
                      {isReorderMode && (
                        <td className="px-3 py-3.5 align-middle text-center">
                          <div className="w-7 h-7 bg-slate-100 border border-gray-200 text-gray-400 hover:text-secondary hover:border-secondary flex items-center justify-center mx-auto cursor-grab active:cursor-grabbing">
                            <LuGripVertical className="text-base" />
                          </div>
                        </td>
                      )}

                      {/* Index */}
                      <td className="px-5 py-3.5 align-top font-mono text-sm font-bold text-gray-400">
                        {startIndex + rowIdx + 1}
                      </td>

                      {/* Dynamic Columns */}
                      {columns.map((col, colIdx) => (
                        <td key={colIdx} className="px-5 py-3 align-top">
                          {col.cell ? col.cell(row) : row[col.accessor] || "N/A"}
                        </td>
                      ))}

                      {/* View Button */}
                      {showViewButton && (
                        <td className="px-5 py-3 align-top text-right whitespace-nowrap">
                          <button
                            id={rowIdx === 0 ? "datatable-first-row-view-btn" : undefined}
                            onClick={() => openDrawer(row)}
                            className="p-1.5 bg-slate-100 hover:bg-secondary hover:text-white text-secondary-dark border border-secondary transition-colors cursor-pointer"
                            title="View Full Details"
                          >
                            <LuEye className="text-sm" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        <div className="flex w-full flex-col md:flex-row justify-center md:justify-between px-3 py-1 bg-slate-100 border-t border-gray-200">
          <div className="flex justify-center md:justify-between items-center text-[13px] font-semibold text-gray-500">
            <span>
              Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + pageSize, totalEntries)} of {totalEntries} entries {filteredData.length !== data.length && !isReorderMode && `(filtered from ${data.length} total)`}
            </span>
          </div>

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && !isReorderMode && (
            <div id="datatable-pagination" className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-2 border border-gray-200 text-xs font-bold uppercase tracking-wider bg-white text-primary hover:bg-secondary-dark hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <LuChevronLeft className="text-sm" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${currentPage === page
                      ? "bg-primary text-white font-extrabold"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-slate-100"
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 py-2 border border-gray-200 text-xs font-bold uppercase tracking-wider bg-white text-primary hover:bg-secondary-dark hover:text-white transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <LuChevronRight className="text-sm" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail View Right Drawer */}
      {selectedRowDetail && (
        <div
          className={`fixed inset-0 z-[99999] flex justify-end bg-black/50 backdrop-blur-xs transition-opacity duration-300 ${isDrawerClosing ? "opacity-0" : "opacity-100"
            }`}
        >
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={closeDrawer} />

          {/* Drawer Panel */}
          <div
            className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-gray-200 ${isDrawerClosing ? "animate-drawer-out" : "animate-drawer-in"
              }`}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-oswald text-xl font-bold text-secondary uppercase tracking-wide">
                {detailTitle || "Record Details"}
              </h3>
              <button
                onClick={closeDrawer}
                className="p-1 text-gray-400 hover:text-primary transition-colors cursor-pointer"
                title="Close"
              >
                <LuX className="text-2xl" />
              </button>
            </div>

            {/* Content Body — Generic or Custom Drawer */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {renderDrawerDetail ? (
                renderDrawerDetail(selectedRowDetail)
              ) : (
                /* Generic Key-Value Fallback for Any Record */
                Object.entries(selectedRowDetail)
                  .filter(([key]) => key !== "_id" && key !== "__v" && key.toLowerCase() !== "id")
                  .map(([key, val]) => (
                    <div key={key}>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                        {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      </label>
                      <p className="text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {typeof val === "object" && val !== null
                          ? JSON.stringify(val, null, 2)
                          : String(val ?? "N/A")}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
