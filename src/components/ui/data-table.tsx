'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  LayoutList,
  Columns2,
  Grid3X3,
  FolderTree,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Printer,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckSquare,
  Square,
  MinusSquare,
  Trash2,
  X,
  ChevronDown,
  Check,
} from 'lucide-react';
import { DateRangePicker, DateRange } from './date-range-picker';
import { Button } from './button';

export type DisplayMode = 'table' | 'list' | 'split' | 'matrix' | 'tree';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  sortable?: boolean;
  sortValue?: (item: T) => any;
  className?: string;
  render?: (item: T, index?: number) => React.ReactNode;
  printRender?: (item: T, index?: number) => React.ReactNode;
}

export interface CustomFilter {
  key: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  allLabel?: string;
  icon?: React.ReactNode;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor?: (item: T) => string;
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  searchKey?: string;
  statusOptions?: { label: string; value: string }[];
  categoryOptions?: { label: string; value: string }[];
  typeOptions?: { label: string; value: string }[];
  customFilters?: CustomFilter[];
  supportedModes?: DisplayMode[];
  displayModes?: DisplayMode[];
  defaultMode?: DisplayMode;
  defaultDisplayMode?: DisplayMode;
  renderListItem?: (
    item: T,
    isSelected: boolean,
    onSelect: () => void,
    isRowChecked: boolean,
    onToggleRowCheck: (e: React.MouseEvent) => void
  ) => React.ReactNode;
  renderSplitDetail?: (item: T | null) => React.ReactNode;
  renderMatrixCard?: (
    item: T,
    isRowChecked: boolean,
    onToggleRowCheck: (e: React.MouseEvent) => void
  ) => React.ReactNode;
  renderTreeMode?: () => React.ReactNode;
  primaryAction?: React.ReactNode;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
  // Multi-selection & Bulk Actions
  enableMultiSelect?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  onBulkDelete?: (keys: string[]) => void;
  // Printing customization
  printTitle?: string;
  exportFileName?: string;
  extraActions?: React.ReactNode;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export interface FilterDropdownProps {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  allLabel?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}

export function FilterDropdown({
  label,
  icon,
  value,
  onChange,
  options,
  allLabel = 'Tous',
  className,
  buttonClassName,
  menuClassName,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Guard against callers accidentally passing an 'ALL' option
  const cleanOptions = React.useMemo(() => {
    return options.filter((o) => o.value !== 'ALL' && o.value !== '');
  }, [options]);

  const selectedOption = cleanOptions.find((o) => o.value === value);
  const isFiltered = Boolean(value && value !== 'ALL');
  const displayLabel = isFiltered
    ? `${selectedOption?.label || value}`
    : `${label} : ${allLabel}`;

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return cleanOptions;
    const q = searchQuery.toLowerCase();
    return cleanOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [cleanOptions, searchQuery]);

  return (
    <div className={cn('relative inline-block text-left', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all duration-150 shadow-sm cursor-pointer select-none',
          isFiltered
            ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] border-[var(--royal-primary)] hover:bg-[var(--royal-primary-hover)] shadow-xs'
            : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#C59B27] hover:bg-[#FBF9F4]',
          buttonClassName
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <span className="truncate max-w-[220px]">{displayLabel}</span>
        </div>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 transition-transform duration-200 shrink-0 opacity-70',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className={cn('absolute left-0 mt-2 min-w-[240px] max-w-xs rounded-xl bg-white border border-neutral-200/90 shadow-2xl z-50 p-2 space-y-1.5 animate-in fade-in-50 zoom-in-95 duration-100 backdrop-blur-md', menuClassName)}>
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            {label}
          </div>

          {/* Search bar inside dropdown */}
          <div className="relative mb-1">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Rechercher ${label.toLowerCase()}...`}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 bg-neutral-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[var(--royal-primary)] transition"
              autoFocus
            />
          </div>

          <button
            type="button"
            onClick={() => {
              onChange('ALL');
              setIsOpen(false);
              setSearchQuery('');
            }}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all duration-100 cursor-pointer select-none',
              !isFiltered
                ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] font-bold shadow-xs'
                : 'text-neutral-700 hover:bg-[#FBF6E8] hover:text-[#1D232E]'
            )}
          >
            <span>{allLabel}</span>
            {!isFiltered && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
          </button>
          <div className="h-px bg-neutral-100 my-1" />
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-4 px-2 text-center text-xs text-neutral-400 italic">
                Aucun résultat trouvé
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all duration-100 cursor-pointer select-none',
                      isSelected
                        ? 'bg-[var(--royal-primary)] text-[var(--royal-primary-text)] font-bold shadow-xs'
                        : 'text-neutral-700 hover:bg-[#FBF6E8] hover:text-[#1D232E]'
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DataTable<T extends object = any>({
  data,
  columns,
  keyExtractor = (item: any) => item?.id || item?.key || item?.reference || item?.invoiceNumber || item?.entryNumber || item?.code || String(Math.random()),
  title,
  subtitle,
  searchPlaceholder = 'Rechercher...',
  searchKeys: explicitSearchKeys = [],
  searchKey,
  statusOptions = [],
  categoryOptions = [],
  typeOptions = [],
  customFilters = [],
  supportedModes: explicitSupportedModes,
  displayModes,
  defaultMode: explicitDefaultMode,
  defaultDisplayMode,
  renderListItem,
  renderSplitDetail,
  renderMatrixCard,
  renderTreeMode,
  primaryAction,
  isLoading = false,
  onRefresh,
  className,
  enableMultiSelect = false,
  selectedKeys: controlledSelectedKeys,
  onSelectionChange,
  onBulkDelete,
  printTitle = 'Catalogue des Articles — Royal',
  exportFileName,
  extraActions,
  defaultPageSize = 12,
  pageSizeOptions = [12, 24, 36, 60, 96],
}: DataTableProps<T>) {
  const supportedModes = explicitSupportedModes || displayModes || ['table', 'list', 'matrix'];
  const supportedModesKey = supportedModes.join(',');
  const defaultMode = explicitDefaultMode || defaultDisplayMode || 'table';
  const searchKeys = explicitSearchKeys.length > 0 ? explicitSearchKeys : (searchKey ? [searchKey] : []);

  const getResponsivePreferredMode = React.useCallback(
    (small: boolean): DisplayMode => {
      const modes = supportedModesKey.split(',').filter(Boolean) as DisplayMode[];
      if (!small) {
        return modes.includes(defaultMode) ? defaultMode : (modes[0] || 'table');
      }
      if (modes.includes('list')) return 'list';
      if (modes.includes('matrix')) return 'matrix';
      return modes.find((m) => m !== 'table') || modes[0] || 'list';
    },
    [supportedModesKey, defaultMode]
  );

  const [displayMode, setDisplayMode] = React.useState<DisplayMode>(defaultMode);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 1023px)');
    const applyResponsiveMode = (isSmall: boolean) => {
      setDisplayMode(getResponsivePreferredMode(isSmall));
    };
    applyResponsiveMode(mq.matches);
    const listener = (ev: MediaQueryListEvent) => applyResponsiveMode(ev.matches);
    if (mq.addEventListener) mq.addEventListener('change', listener);
    else if ((mq as any).addListener) (mq as any).addListener(listener);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', listener);
      else if ((mq as any).removeListener) (mq as any).removeListener(listener);
    };
  }, [getResponsivePreferredMode]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateRange, setDateRange] = React.useState<DateRange>({ startDate: '', endDate: '' });
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [categoryFilter, setCategoryFilter] = React.useState('ALL');
  const [typeFilter, setTypeFilter] = React.useState('ALL');
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(defaultPageSize);
  const [selectedItemKey, setSelectedItemKey] = React.useState<string | null>(null);

  // Local multi-select state if not controlled
  const [internalSelectedKeys, setInternalSelectedKeys] = React.useState<string[]>([]);
  const selectedKeys = controlledSelectedKeys ?? internalSelectedKeys;

  const updateSelection = React.useCallback(
    (newKeys: string[]) => {
      if (onSelectionChange) {
        onSelectionChange(newKeys);
      } else {
        setInternalSelectedKeys(newKeys);
      }
    },
    [onSelectionChange]
  );

  // Sorting Handler
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filter Data
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      const it = item as any;
      // 1. Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matches =
          searchKeys.length > 0
            ? searchKeys.some((k) => String(it[k] ?? '').toLowerCase().includes(query))
            : Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(query));
        if (!matches) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'ALL') {
        const itemStatus = it.status || it.stockStatus || it.isActive;
        if (String(itemStatus) !== statusFilter) return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'ALL') {
        const itemCat =
          it.categoryId || it.category?.slug || it.category?.name || it.category;
        if (String(itemCat) !== categoryFilter) return false;
      }

      // 4. Type Filter
      if (typeFilter !== 'ALL') {
        const itemType = it.type || it.channel || it.role;
        if (String(itemType) !== typeFilter) return false;
      }

      // 5. Date Range Filter (Works on created_at / createdAt / updated_at / updatedAt)
      if (dateRange.startDate || dateRange.endDate) {
        const rawDate =
          it.createdAt ||
          it.created_at ||
          it.updatedAt ||
          it.updated_at ||
          it.date;
        if (!rawDate) return false;
        const itemDate = new Date(rawDate);
        if (isNaN(itemDate.getTime())) return false;

        if (dateRange.startDate) {
          const startDate = new Date(dateRange.startDate);
          if (!dateRange.startDate.includes('T')) startDate.setHours(0, 0, 0, 0);
          if (itemDate < startDate) return false;
        }
        if (dateRange.endDate) {
          const endDate = new Date(dateRange.endDate);
          if (!dateRange.endDate.includes('T')) endDate.setHours(23, 59, 59, 999);
          if (itemDate > endDate) return false;
        }
      }

      return true;
    });
  }, [data, searchQuery, searchKeys, statusFilter, categoryFilter, typeFilter, dateRange]);

  // Enhanced Robust Sorting Data
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    const currentCol = columns.find((c) => c.key === sortKey);

    return [...filteredData].sort((a: any, b: any) => {
      let aVal: any;
      let bVal: any;

      if (currentCol?.sortValue) {
        aVal = currentCol.sortValue(a);
        bVal = currentCol.sortValue(b);
      } else {
        // Fallbacks for known keys across catalog items
        if (sortKey === 'product' || sortKey === 'name') {
          aVal = a.name || a.title || a.label || '';
          bVal = b.name || b.title || b.label || '';
        } else if (sortKey === 'category') {
          aVal = a.category?.name || a.categoryName || a.category || '';
          bVal = b.category?.name || b.categoryName || b.category || '';
        } else if (sortKey === 'brand') {
          aVal = a.brand?.name || a.brand || '';
          bVal = b.brand?.name || b.brand || '';
        } else if (sortKey === 'stock') {
          aVal = a.dimensionsJson?.stockQuantity !== undefined ? Number(a.dimensionsJson.stockQuantity) : (a.stockQuantity ?? 24);
          bVal = b.dimensionsJson?.stockQuantity !== undefined ? Number(b.dimensionsJson.stockQuantity) : (b.stockQuantity ?? 24);
        } else if (sortKey === 'variants') {
          aVal = a.variantsCount || a.variants?.length || 1;
          bVal = b.variantsCount || b.variants?.length || 1;
        } else if (sortKey === 'productCount') {
          aVal = a.productCount ?? a._count?.products ?? 0;
          bVal = b.productCount ?? b._count?.products ?? 0;
        } else if (sortKey === 'characteristicsCount') {
          aVal = a.characteristicsCount ?? 0;
          bVal = b.characteristicsCount ?? 0;
        } else if (sortKey === 'sellingPrice') {
          aVal = Number(a.sellingPrice || 0);
          bVal = Number(b.sellingPrice || 0);
        } else {
          aVal = a[sortKey];
          bVal = b[sortKey];
        }
      }

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortKey, sortOrder, columns]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rowsPerPage) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const activeSelectedItem = React.useMemo(() => {
    if (!selectedItemKey && paginatedData.length > 0) {
      return paginatedData[0];
    }
    return data.find((it) => keyExtractor(it) === selectedItemKey) || null;
  }, [selectedItemKey, paginatedData, data, keyExtractor]);

  // Page checkbox selection handlers
  const currentPageKeys = React.useMemo(() => {
    return paginatedData.map((item) => keyExtractor(item));
  }, [paginatedData, keyExtractor]);

  const isAllPageSelected =
    currentPageKeys.length > 0 &&
    currentPageKeys.every((key) => selectedKeys.includes(key));

  const isSomePageSelected =
    currentPageKeys.some((key) => selectedKeys.includes(key)) && !isAllPageSelected;

  const handleToggleSelectAllPage = () => {
    if (isAllPageSelected) {
      updateSelection(selectedKeys.filter((k) => !currentPageKeys.includes(k)));
    } else {
      const merged = Array.from(new Set([...selectedKeys, ...currentPageKeys]));
      updateSelection(merged);
    }
  };

  const handleToggleSelectRow = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedKeys.includes(key)) {
      updateSelection(selectedKeys.filter((k) => k !== key));
    } else {
      updateSelection([...selectedKeys, key]);
    }
  };

  const handleClearSelection = () => {
    updateSelection([]);
  };

  // Export to CSV on ALL sorted data
  const handleExportCSV = () => {
    if (sortedData.length === 0) return;
    const exportableCols = columns.filter((c) => c.key !== 'actions');
    const headers = exportableCols
      .map((c) => (typeof c.header === 'string' ? `"${c.header}"` : `"${c.key}"`))
      .join(',');
    const rows = sortedData.map((item: any) =>
      exportableCols
        .map((c) => {
          let val: any;
          if (c.sortValue) {
            val = c.sortValue(item);
          } else if (c.key === 'product') {
            val = `${item.name || ''} [${item.sku || ''}]`;
          } else if (c.key === 'category') {
            val = item.category?.name || item.category || '';
          } else if (c.key === 'brand') {
            val = item.brand?.name || item.brand || '';
          } else if (c.key === 'stock') {
            val = item.dimensionsJson?.stockQuantity ?? item.stockQuantity ?? 24;
          } else if (c.key === 'variants') {
            val = item.variantsCount || item.variants?.length || 1;
          } else {
            val = item[c.key];
          }
          return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : (val ?? '');
        })
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);

    // Formatted timestamp: YYYYMMDDHHmmss
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const baseName = exportFileName || (title ? title.toLowerCase().replace(/\s+/g, '_') : 'export');
    link.setAttribute('download', `${baseName}_${timestamp}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dedicated Printing of ALL data
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={cn('space-y-4', className)} data-display-mode={displayMode}>
      {/* 1. Header with Title & Primary Action (If provided) */}
      {(title || primaryAction) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-sm gap-4 no-print">
          <div>
            {title && (
              <h3 className="font-heading font-black text-lg text-neutral-900 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2.5">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 transition cursor-pointer"
                title="Actualiser les données"
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </button>
            )}
            {primaryAction}
          </div>
        </div>
      )}

      {/* 2. Isolated Toolbar Card (Search, DateRange, Filters, Mode Switcher, Export) */}
      <div className="p-3 sm:p-4 bg-white rounded-2xl border border-neutral-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs no-print">
        {/* Left Side: Search & Dynamic Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-1 min-w-0 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-neutral-200 bg-white placeholder-neutral-400 focus:outline-none focus:border-[var(--royal-primary)] focus:ring-1 focus:ring-[var(--royal-primary)] transition"
            />
          </div>

          {/* Unified Single DateRangePicker */}
          <DateRangePicker
            value={dateRange}
            onChange={(r) => {
              setDateRange(r);
              setCurrentPage(1);
            }}
            onClear={() => setDateRange({ startDate: '', endDate: '' })}
          />

          {/* Status Filter Dropdown */}
          {statusOptions.length > 0 && (
            <FilterDropdown
              label="Statut"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={statusOptions}
              allLabel="Tous les statuts"
            />
          )}

          {/* Category Filter Dropdown */}
          {categoryOptions.length > 0 && (
            <FilterDropdown
              label="Catégorie"
              value={categoryFilter}
              onChange={(val) => {
                setCategoryFilter(val);
                setCurrentPage(1);
              }}
              options={categoryOptions}
              allLabel="Toutes les catégories"
            />
          )}

          {/* Type Filter Dropdown */}
          {typeOptions.length > 0 && (
            <FilterDropdown
              label="Type"
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setCurrentPage(1);
              }}
              options={typeOptions}
              allLabel="Tous les types"
            />
          )}

          {/* Custom Dynamic Filters */}
          {customFilters.map((cf) => (
            <FilterDropdown
              key={cf.key}
              label={cf.label}
              icon={cf.icon}
              value={cf.value}
              onChange={(val) => {
                cf.onChange(val);
                setCurrentPage(1);
              }}
              options={cf.options}
              allLabel={cf.allLabel || `Tous`}
            />
          ))}
        </div>

        {/* Right Side: Print, Export, Extra Actions & Display Mode Switcher */}
        <div className="flex items-center gap-2">
          {extraActions}
          <button
            type="button"
            onClick={handlePrint}
            aria-label="Imprimer"
            className="p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-sm"
            title="Imprimer le tableau des données"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            aria-label="Exporter CSV"
            className="p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 transition shadow-sm"
            title="Exporter en fichier CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Mode Switcher Buttons: Order: Tableau -> Liste -> Grille -> Arborescence -> Split */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200/80">
            {supportedModes.includes('table') && (
              <button
                type="button"
                onClick={() => setDisplayMode('table')}
                aria-label="Mode Tableau"
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  displayMode === 'table'
                    ? 'bg-white text-neutral-950 shadow-sm font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900'
                )}
                title="Vue Tableau Tabulaire"
              >
                <Table className="w-3.5 h-3.5" />
              </button>
            )}

            {supportedModes.includes('list') && (
              <button
                type="button"
                onClick={() => setDisplayMode('list')}
                aria-label="Mode Liste"
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  displayMode === 'list'
                    ? 'bg-white text-neutral-950 shadow-sm font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900'
                )}
                title="Vue Liste Compacte"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
            )}

            {supportedModes.includes('matrix') && (
              <button
                type="button"
                onClick={() => setDisplayMode('matrix')}
                aria-label="Mode Grille Matrice"
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  displayMode === 'matrix'
                    ? 'bg-white text-neutral-950 shadow-sm font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900'
                )}
                title="Vue Grille E-commerce"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
            )}

            {supportedModes.includes('tree') && (
              <button
                type="button"
                onClick={() => setDisplayMode('tree')}
                aria-label="Mode Arborescence"
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  displayMode === 'tree'
                    ? 'bg-white text-neutral-950 shadow-sm font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900'
                )}
                title="Vue Arborescence Hiérarchique"
              >
                <FolderTree className="w-3.5 h-3.5" />
              </button>
            )}

            {supportedModes.includes('split') && (
              <button
                type="button"
                onClick={() => setDisplayMode('split')}
                aria-label="Mode Split Panneau"
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  displayMode === 'split'
                    ? 'bg-white text-neutral-950 shadow-sm font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900'
                )}
                title="Vue Séparée (Détails rapides)"
              >
                <Columns2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. DEDICATED DATA CONTAINER CARD */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
        {/* Bulk Selection Action Banner */}
        {enableMultiSelect && selectedKeys.length > 0 && (
          <div className="bg-[#FBF6E8] text-[#1D232E] border-b border-[#E6D6A6] px-5 py-3 flex items-center justify-between text-xs transition-all animate-in fade-in no-print">
            <div className="flex items-center gap-3">
              <span className="font-bold bg-[var(--royal-primary)] text-white px-2.5 py-0.5 rounded-md text-[11px]">
                {selectedKeys.length} sélectionné(s)
              </span>
              <span className="text-slate-600 hidden sm:inline">
                sur {sortedData.length} élément(s) au total
              </span>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-[#9A7414] hover:text-[#1D232E] underline text-[11px] ml-2 cursor-pointer"
              >
                Désélectionner tout
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onBulkDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onBulkDelete(selectedKeys)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  className="text-xs py-1.5 cursor-pointer"
                >
                  Supprimer ({selectedKeys.length})
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 4. Main Body: Display Modes (Screen Only) */}
        <div className="print:hidden">
        {/* MODE A: TABLE */}
        {displayMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/70 text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
                  {enableMultiSelect && (
                    <th className="py-3 px-4 w-10 text-center no-print">
                      <button
                        type="button"
                        onClick={handleToggleSelectAllPage}
                        className="text-neutral-500 hover:text-neutral-900 flex items-center justify-center"
                        title={isAllPageSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                      >
                        {isAllPageSelected ? (
                          <CheckSquare className="w-4 h-4 text-neutral-950" />
                        ) : isSomePageSelected ? (
                          <MinusSquare className="w-4 h-4 text-neutral-950" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-400" />
                        )}
                      </button>
                    </th>
                  )}

                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      className={cn(
                        'py-3.5 px-4 font-bold select-none',
                        col.sortable && 'cursor-pointer hover:text-neutral-900 transition-colors',
                        col.className
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-neutral-400 no-print">
                            {sortKey === col.key ? (
                              sortOrder === 'asc' ? (
                                <ArrowUp className="w-3.5 h-3.5 text-neutral-950" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-neutral-950" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={columns.length + (enableMultiSelect ? 1 : 0)}
                      className="py-12 text-center text-neutral-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-neutral-900" />
                        <span>Chargement des articles...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (enableMultiSelect ? 1 : 0)}
                      className="py-12 text-center text-neutral-400"
                    >
                      Aucun enregistrement ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, idx) => {
                    const rowKey = keyExtractor(item);
                    const isChecked = selectedKeys.includes(rowKey);

                    return (
                      <tr
                        key={rowKey}
                        onClick={() => setSelectedItemKey(rowKey)}
                        className={cn(
                          'transition-colors hover:bg-neutral-50/70',
                          isChecked && 'bg-neutral-50/90'
                        )}
                      >
                        {enableMultiSelect && (
                          <td className="py-3 px-4 text-center no-print" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleToggleSelectRow(rowKey, e)}
                              className="text-neutral-500 hover:text-neutral-900 flex items-center justify-center mx-auto"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-neutral-950" />
                              ) : (
                                <Square className="w-4 h-4 text-neutral-300" />
                              )}
                            </button>
                          </td>
                        )}

                        {columns.map((col) => (
                          <td key={col.key} className={cn('py-3 px-4 align-middle', col.className)}>
                            {col.render ? col.render(item, idx) : (item as any)[col.key]}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE B: LIST */}
        {displayMode === 'list' && (
          <div className="divide-y divide-neutral-100">
            {isLoading ? (
              <div className="p-12 text-center text-neutral-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-neutral-900 mb-2" />
                Chargement...
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="p-12 text-center text-neutral-400">
                Aucun enregistrement disponible.
              </div>
            ) : (
              paginatedData.map((item, idx) => {
                const rowKey = keyExtractor(item);
                const isChecked = selectedKeys.includes(rowKey);

                if (renderListItem) {
                  return (
                    <React.Fragment key={rowKey}>
                      {renderListItem(
                        item,
                        selectedItemKey === rowKey,
                        () => setSelectedItemKey(rowKey),
                        isChecked,
                        (e) => handleToggleSelectRow(rowKey, e)
                      )}
                    </React.Fragment>
                  );
                }

                const primaryCol = columns[0];
                const controlCol =
                  columns.find((c) => c.key === 'actions' || c.key === 'visibility') ||
                  (columns.length > 1 ? columns[columns.length - 1] : undefined);
                const detailCols = columns.filter((c) => c !== primaryCol && c !== controlCol);

                return (
                  <div
                    key={rowKey}
                    onClick={() => setSelectedItemKey(rowKey)}
                    className={cn(
                      'p-3.5 sm:p-4 hover:bg-neutral-50/80 transition cursor-pointer text-xs space-y-2.5',
                      isChecked && 'bg-amber-50/40'
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {enableMultiSelect && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleSelectRow(rowKey, e)}
                            className="text-neutral-400 hover:text-neutral-900 no-print shrink-0 mt-0.5"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-neutral-950" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-300" />
                            )}
                          </button>
                        )}
                        <div className="min-w-0 flex-1">
                          {primaryCol ? (
                            primaryCol.render
                              ? primaryCol.render(item, idx)
                              : <div className="font-bold text-neutral-900 truncate">{String((item as any)[primaryCol.key] ?? '—')}</div>
                          ) : null}
                        </div>
                      </div>

                      {controlCol?.render && (
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          {controlCol.render(item, idx)}
                        </div>
                      )}
                    </div>

                    {detailCols.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 pt-2.5 border-t border-neutral-100 text-[11px]">
                        {detailCols.map((col) => (
                          <div key={col.key} className="flex items-center justify-between sm:block gap-2 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block shrink-0">
                              {col.header}
                            </span>
                            <div className="min-w-0 text-neutral-800 truncate sm:mt-0.5">
                              {col.render ? col.render(item, idx) : String((item as any)[col.key] ?? '—')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* MODE C: SPLIT VIEW */}
        {displayMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Left Column: Compact list */}
            <div className="lg:col-span-5 border-r border-neutral-100 overflow-y-auto max-h-[700px] divide-y divide-neutral-100">
              {paginatedData.map((item) => {
                const rowKey = keyExtractor(item);
                const isSelected = (selectedItemKey || (paginatedData[0] as any)?.id) === rowKey;
                const isChecked = selectedKeys.includes(rowKey);

                return (
                  <div
                    key={rowKey}
                    onClick={() => setSelectedItemKey(rowKey)}
                    className={cn(
                      'p-3.5 flex items-center justify-between cursor-pointer transition text-xs',
                      isSelected
                        ? 'bg-neutral-100/70 border-l-4 border-neutral-950'
                        : 'hover:bg-neutral-50'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {enableMultiSelect && (
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelectRow(rowKey, e)}
                          className="text-neutral-400 hover:text-neutral-900 no-print"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-neutral-950" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-300" />
                          )}
                        </button>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-neutral-900 truncate">
                          {(item as any).name || (item as any).title}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono truncate">
                          {(item as any).sku}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Full Details Panel */}
            <div className="lg:col-span-7 overflow-y-auto max-h-[700px] bg-white">
              {renderSplitDetail ? (
                renderSplitDetail(activeSelectedItem)
              ) : (
                <div className="p-8 text-center text-neutral-400">
                  Sélectionnez un élément pour afficher ses détails.
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE D: MATRIX GRID (E-COMMERCE) */}
        {displayMode === 'matrix' && (
          <div className="p-4 sm:p-5">
            {isLoading ? (
              <div className="p-12 text-center text-neutral-400">Chargement de la grille...</div>
            ) : paginatedData.length === 0 ? (
              <div className="p-12 text-center text-neutral-400">Aucun produit trouvé.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedData.map((item, idx) => {
                  const rowKey = keyExtractor(item);
                  const isChecked = selectedKeys.includes(rowKey);

                  if (renderMatrixCard) {
                    return (
                      <React.Fragment key={rowKey}>
                        {renderMatrixCard(item, isChecked, (e) =>
                          handleToggleSelectRow(rowKey, e)
                        )}
                      </React.Fragment>
                    );
                  }

                  const primaryCol = columns[0];
                  const controlCol =
                    columns.find((c) => c.key === 'actions' || c.key === 'visibility') ||
                    (columns.length > 1 ? columns[columns.length - 1] : undefined);
                  const detailCols = columns.filter((c) => c !== primaryCol && c !== controlCol).slice(0, 4);

                  return (
                    <div
                      key={rowKey}
                      className={cn(
                        'bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-5 space-y-3 hover:shadow-md transition-all flex flex-col justify-between group',
                        isChecked && 'ring-2 ring-amber-500/50 bg-amber-50/20'
                      )}
                    >
                      <div className="space-y-3 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            {primaryCol ? (
                              primaryCol.render
                                ? primaryCol.render(item, idx)
                                : <span className="font-bold text-xs text-neutral-900 truncate block">{String((item as any)[primaryCol.key] ?? '—')}</span>
                            ) : null}
                          </div>
                          {enableMultiSelect && (
                            <button
                              type="button"
                              onClick={(e) => handleToggleSelectRow(rowKey, e)}
                              className="text-neutral-400 hover:text-neutral-900 no-print shrink-0"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-neutral-950" />
                              ) : (
                                <Square className="w-4 h-4 text-neutral-300" />
                              )}
                            </button>
                          )}
                        </div>

                        {detailCols.length > 0 && (
                          <div className="space-y-1.5 text-[11px]">
                            {detailCols.map((col) => (
                              <div key={col.key} className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold uppercase text-neutral-400 shrink-0">{col.header}</span>
                                <div className="min-w-0 truncate text-right">
                                  {col.render ? col.render(item, idx) : String((item as any)[col.key] ?? '—')}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {controlCol?.render && (
                        <div className="pt-3 border-t border-neutral-100 flex items-center justify-end text-xs" onClick={(e) => e.stopPropagation()}>
                          {controlCol.render(item, idx)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODE E: TREE VIEW */}
        {displayMode === 'tree' && renderTreeMode && (
          <div className="p-4 sm:p-6 bg-white animate-in fade-in duration-150">
            {renderTreeMode()}
          </div>
        )}
        </div>

        {/* 5. Pagination Bar */}
        <div className="p-4 bg-white border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 no-print">
          <div className="flex items-center gap-2">
            <span>Afficher</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Lignes par page"
              className="py-1 px-2 border border-[#E6E1D6] rounded-lg text-xs font-semibold bg-white text-[#1D232E] focus:outline-none focus:border-[#C59B27] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>sur {sortedData.length} au total</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-400 mr-2">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Page précédente"
              className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Page suivante"
              className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Full Print Table (Prints ALL sortedData across all pages cleanly without screen UI elements) */}
      <div id="royal-printable-table" className="hidden print:block p-4">
        {/* Print Title Header */}
        <div className="mb-4 pb-2 border-b border-neutral-300 text-black">
          <h2 className="text-xl font-bold">{printTitle}</h2>
          <div className="text-xs text-neutral-600 mt-1 flex items-center justify-between">
            <span>Date d'impression : {new Date().toLocaleString('fr-TN')}</span>
            <span>Total : {sortedData.length} élément(s)</span>
          </div>
        </div>
        <table className="w-full text-left border-collapse text-xs border border-neutral-300">
          <thead>
            <tr className="border-b border-neutral-300 bg-neutral-100 text-neutral-800 font-bold uppercase tracking-wider text-[10px]">
              {columns
                .filter((col) => col.key !== 'actions')
                .map((col) => (
                  <th key={col.key} className="py-2.5 px-3 border border-neutral-300 text-neutral-900 font-bold">
                    {col.header}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {sortedData.map((item, rowIdx) => (
              <tr key={keyExtractor(item)} className="break-inside-avoid">
                {columns
                  .filter((col) => col.key !== 'actions')
                  .map((col) => (
                    <td key={col.key} className="py-2 px-3 border border-neutral-200 text-neutral-800 text-[11px]">
                      {col.printRender
                        ? col.printRender(item, rowIdx)
                        : col.render
                        ? col.render(item, rowIdx)
                        : (item as any)[col.key]}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
