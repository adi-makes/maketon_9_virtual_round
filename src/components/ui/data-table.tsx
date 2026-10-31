"use client";

import React, { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Inbox,
  Calendar,
  ChevronDown,
} from "lucide-react";

export interface ColumnDef<T> {
  /**
   * The column header text or custom render element.
   */
  header: React.ReactNode;
  /**
   * Optional key of the data object to display if `cell` renderer is omitted.
   */
  accessorKey?: keyof T;
  /**
   * Optional custom cell renderer function.
   */
  cell?: (row: T, index: number) => React.ReactNode;
  /**
   * Additional Tailwind class names for cell `<td>`.
   */
  className?: string;
  /**
   * Additional Tailwind class names for header `<th>`.
   */
  headerClassName?: string;
  /**
   * Text alignment for the column.
   */
  align?: "left" | "center" | "right";
}

export interface FilterTab {
  label: string;
  count?: number | string;
  value: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string | number;
  title?: string;
  description?: string;

  // Search & Filter placeholders
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterTabs?: FilterTab[];
  activeTab?: string;
  onTabChange?: (tabValue: string) => void;

  // Row selection
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectRow?: (id: string | number) => void;
  onSelectAll?: () => void;
  onRowClick?: (row: T, index: number) => void;

  // Pagination placeholders
  currentPage?: number;
  totalPages?: number;
  totalRecords?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;

  // Extra toolbar actions
  actions?: React.ReactNode;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
}

export function DataTable<T>({
  columns,
  data = [],
  keyExtractor,
  title,
  description,
  searchPlaceholder = "Filter by keyword, ID, or customer...",
  searchValue = "",
  onSearchChange,
  filterTabs,
  activeTab: controlledActiveTab,
  onTabChange,
  selectable = true,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  onRowClick,
  currentPage = 1,
  totalPages = 1,
  totalRecords,
  pageSize = 10,
  onPageChange,
  actions,
  emptyState,
  isLoading = false,
}: DataTableProps<T>) {
  // Internal UI states for standalone / placeholder usage
  const [internalSearch, setInternalSearch] = useState(searchValue);
  const [internalTab, setInternalTab] = useState(filterTabs?.[0]?.value || "all");
  const [selectedInternalIds, setSelectedInternalIds] = useState<(string | number)[]>(selectedIds);

  const activeTabValue = controlledActiveTab !== undefined ? controlledActiveTab : internalTab;
  const currentSearchValue = onSearchChange ? searchValue : internalSearch;
  const effectiveTotalRecords = totalRecords ?? data.length;

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalSearch(val);
    onSearchChange?.(val);
  };

  const handleTabClick = (tabValue: string) => {
    setInternalTab(tabValue);
    onTabChange?.(tabValue);
  };

  const handleRowCheckbox = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectRow) {
      onSelectRow(id);
    } else {
      setSelectedInternalIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
  };

  const isRowSelected = (id: string | number) => {
    const list = onSelectRow ? selectedIds : selectedInternalIds;
    return list.includes(id);
  };

  const allSelected =
    data.length > 0 &&
    data.every((item, idx) => {
      const id = keyExtractor ? keyExtractor(item, idx) : (item as any)?.id ?? idx;
      return isRowSelected(id);
    });

  const handleSelectAllToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelectAll) {
      onSelectAll();
    } else {
      if (allSelected) {
        setSelectedInternalIds([]);
      } else {
        const all = data.map((item, idx) =>
          keyExtractor ? keyExtractor(item, idx) : (item as any)?.id ?? idx
        );
        setSelectedInternalIds(all);
      }
    }
  };

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, effectiveTotalRecords);

  return (
    <div className="flex flex-col w-full gap-space-md">
      {/* Optional Title Header */}
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-1">
          <div>
            {title && (
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {title}
              </h2>
            )}
            {description && (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-space-sm">{actions}</div>}
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex flex-wrap items-center gap-space-sm flex-1">
          {/* Search Input */}
          <div className="relative flex items-center min-w-[240px] max-w-sm w-full md:w-auto">
            <Search size={18} className="absolute left-3 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              value={currentSearchValue}
              onChange={handleSearchInput}
              placeholder={searchPlaceholder}
              className="w-full md:w-72 h-10 pl-9 pr-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-low border border-surface-container-high/30 transition-all text-xs"
            />
          </div>

          {/* Filter Dropdown Placeholder */}
          <button
            type="button"
            className="h-10 px-3.5 flex items-center gap-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm transition-all border border-surface-container-high/30 text-xs font-medium"
          >
            <SlidersHorizontal size={16} className="text-on-surface-variant" />
            <span>Filter</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary ml-0.5" />
          </button>

          {/* Export CSV Placeholder */}
          <button
            type="button"
            className="h-10 px-3.5 flex items-center gap-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-label-md shadow-sm transition-all border border-surface-container-high/30 text-xs font-medium"
          >
            <Download size={16} className="text-on-surface-variant" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs / Quick View Badges (if provided) */}
      {filterTabs && filterTabs.length > 0 && (
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md bg-surface-container-lowest p-space-sm rounded-xl shadow-sm border border-surface-container-high/30">
          <div className="flex items-center overflow-x-auto gap-1 py-0.5">
            {filterTabs.map((tab) => {
              const active = tab.value === activeTabValue;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleTabClick(tab.value)}
                  className={`px-3.5 py-1.5 rounded-lg font-label-md text-label-md whitespace-nowrap transition-colors text-xs font-medium ${
                    active
                      ? "bg-primary-container text-on-primary shadow-sm"
                      : "hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-md font-mono-data-sm text-[10px] ${
                        active ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Contextual Filter Options */}
          <div className="flex flex-wrap items-center gap-space-xs self-end lg:self-auto text-xs">
            <div className="flex items-center bg-surface-container-low rounded-lg px-2.5 py-1.5 gap-1.5 text-on-surface-variant">
              <Calendar size={14} />
              <span className="font-body-sm text-on-surface font-medium">CY 2024–2025</span>
              <ChevronDown size={14} />
            </div>
            <div className="flex items-center bg-surface-container-low rounded-lg px-2.5 py-1.5 gap-1.5 text-on-surface-variant">
              <span className="font-body-sm text-on-surface-variant">Tier:</span>
              <span className="font-body-sm text-on-surface font-medium">All</span>
              <ChevronDown size={14} />
            </div>
            <div className="h-5 w-px bg-surface-container-high mx-1" />
            <button
              type="button"
              className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface uppercase tracking-wide font-medium text-[11px] transition-colors"
            >
              Batch Action
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-surface-container-high/30">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/70 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider h-10 select-none text-[11px] border-b border-surface-container-high/30">
                {selectable && (
                  <th className="w-10 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAllToggle}
                      className="rounded w-4 h-4 text-primary bg-surface-container focus:ring-0 cursor-pointer"
                    />
                  </th>
                )}
                {columns.map((col, index) => (
                  <th
                    key={index}
                    className={`px-3 py-2 font-semibold ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    } ${col.headerClassName || ""}`}
                  >
                    {col.header}
                  </th>
                ))}
                <th className="w-10 px-3 py-2 text-center" />
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm divide-y-0 text-xs">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 2 : 1)}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Loading telemetry records...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 2 : 1)}>
                    {emptyState || (
                      <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-3">
                          <Inbox size={24} />
                        </div>
                        <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-1">
                          No records found
                        </h4>
                        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
                          There are currently no rows matching your search criteria or active cohort filter.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                data.map((item, rowIndex) => {
                  const rowId = keyExtractor
                    ? keyExtractor(item, rowIndex)
                    : (item as any)?.id ?? rowIndex;
                  const selected = isRowSelected(rowId);

                  return (
                    <tr
                      key={rowId}
                      onClick={() => onRowClick?.(item, rowIndex)}
                      className={`transition-colors cursor-pointer group border-b border-surface-container-high/15 ${
                        selected
                          ? "bg-primary/5 hover:bg-primary/10"
                          : "hover:bg-surface-container-low"
                      }`}
                    >
                      {selectable && (
                        <td
                          className="w-10 px-3 text-center"
                          onClick={(e) => handleRowCheckbox(rowId, e)}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {}}
                            className="rounded w-4 h-4 text-primary bg-surface-container focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((col, colIndex) => {
                        return (
                          <td
                            key={colIndex}
                            className={`px-3 py-3 ${
                              col.align === "right"
                                ? "text-right"
                                : col.align === "center"
                                ? "text-center"
                                : "text-left"
                            } ${col.className || ""}`}
                          >
                            {col.cell
                              ? col.cell(item, rowIndex)
                              : col.accessorKey
                              ? String((item as any)[col.accessorKey] ?? "")
                              : null}
                          </td>
                        );
                      })}
                      <td
                        className="px-3 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="p-1 hover:bg-surface-container rounded-md text-on-surface-variant hover:text-on-surface transition-colors"
                          aria-label="Row options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-sm border-t border-surface-container-high/30">
          <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
            Showing{" "}
            <span className="font-medium text-on-surface">
              {effectiveTotalRecords === 0 ? 0 : `${startRecord}–${endRecord}`}
            </span>{" "}
            of{" "}
            <span className="font-medium text-on-surface">
              {effectiveTotalRecords}
            </span>{" "}
            records
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange?.(currentPage - 1)}
              className="h-8 px-2.5 rounded-md bg-surface-container-low hover:bg-surface-container disabled:opacity-40 disabled:pointer-events-none text-on-surface-variant hover:text-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors text-xs"
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>

            {/* Pagination Numbers Placeholder */}
            {Array.from({ length: Math.min(3, totalPages || 1) }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange?.(pageNum)}
                className={`w-8 h-8 rounded-md font-mono-data-sm text-mono-data-sm font-semibold flex items-center justify-center text-xs transition-colors ${
                  currentPage === pageNum
                    ? "bg-primary-container text-on-primary shadow-sm"
                    : "hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {pageNum}
              </button>
            ))}

            {(totalPages || 1) > 3 && (
              <>
                <span className="px-1 text-on-surface-variant font-mono-data-sm text-xs">…</span>
                <button
                  type="button"
                  onClick={() => onPageChange?.(totalPages)}
                  className={`w-8 h-8 rounded-md font-mono-data-sm text-mono-data-sm font-semibold flex items-center justify-center text-xs transition-colors ${
                    currentPage === totalPages
                      ? "bg-primary-container text-on-primary shadow-sm"
                      : "hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={currentPage >= (totalPages || 1)}
              onClick={() => onPageChange?.(currentPage + 1)}
              className="h-8 px-2.5 rounded-md bg-surface-container-low hover:bg-surface-container disabled:opacity-40 disabled:pointer-events-none text-on-surface-variant hover:text-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors text-xs"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataTable;

