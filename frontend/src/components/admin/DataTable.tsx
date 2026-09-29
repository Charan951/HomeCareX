import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react';
import clsx from 'clsx';
import { Pagination } from './Pagination';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  /** Custom cell. Defaults to `String(row[key])`. */
  cell?: (row: T) => React.ReactNode;
  /** Makes the column sortable in client mode. Return a string, number or null. */
  sortValue?: (row: T) => string | number | null | undefined;
  /** Makes the column sortable in `manual` (server) mode, where there is no sortValue. */
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string;
  /** Hidden below 768px so wide tables stay readable on phones. */
  hideOnMobile?: boolean;
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  /** Accessible name for the table. */
  label: string;

  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;

  // Selection: pass selectedKeys + onSelectionChange to control it, or just selectable to let the table keep it.
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;

  // Sorting: controlled with sort + onSortChange, otherwise the table keeps it.
  sort?: SortState | null;
  defaultSort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;

  // Pagination: controlled with page/pageSize + callbacks, otherwise the table keeps it.
  page?: number;
  pageSize?: number;
  defaultPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Hide the footer pagination entirely. */
  hidePagination?: boolean;

  /**
   * Server mode: `data` is already the current page in the right order, so the table
   * neither sorts nor slices. Requires `total`, and you handle onSortChange / onPageChange.
   */
  manual?: boolean;
  total?: number;

  onRowClick?: (row: T) => void;
}

const SKELETON_ROWS = 5;

function compare(a: string | number | null | undefined, b: string | number | null | undefined) {
  if (a == null && b == null) return 0;
  if (a == null) return 1; // empty values always last
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export function DataTable<T>({
  columns, data, rowKey, label,
  loading, error, onRetry, emptyTitle = 'Nothing here yet', emptyMessage = 'No records match your filters.',
  selectable, selectedKeys, onSelectionChange,
  sort, defaultSort = null, onSortChange,
  page, pageSize, defaultPageSize = 10, onPageChange, onPageSizeChange, pageSizeOptions, hidePagination,
  manual, total, onRowClick,
}: DataTableProps<T>) {
  // ---- state: controlled when the prop is given, internal otherwise ----
  const [innerSort, setInnerSort] = useState<SortState | null>(defaultSort);
  const [innerPage, setInnerPage] = useState(1);
  const [innerSize, setInnerSize] = useState(defaultPageSize);
  const [innerSelected, setInnerSelected] = useState<string[]>([]);

  const activeSort = sort !== undefined ? sort : innerSort;
  const currentSize = pageSize ?? innerSize;
  const selected = selectedKeys ?? innerSelected;

  const setSort = (next: SortState | null) => {
    setInnerSort(next);
    onSortChange?.(next);
    if (page === undefined) setInnerPage(1);
    else onPageChange?.(1);
  };
  const setSelected = (keys: string[]) => {
    setInnerSelected(keys);
    onSelectionChange?.(keys);
  };

  // ---- rows for this page ----
  const sortedRows = useMemo(() => {
    if (manual || !activeSort) return data;
    const col = columns.find((c) => c.key === activeSort.key);
    if (!col?.sortValue) return data;
    const get = col.sortValue;
    const dir = activeSort.direction === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      // Keep empty values last in both directions.
      if (av == null || bv == null) return compare(av, bv);
      return compare(av, bv) * dir;
    });
  }, [data, columns, activeSort, manual]);

  const totalRows = manual ? total ?? data.length : sortedRows.length;
  const lastPage = Math.max(1, Math.ceil(totalRows / currentSize));
  const currentPage = Math.min(page ?? innerPage, lastPage);
  const pageRows = manual
    ? sortedRows
    : sortedRows.slice((currentPage - 1) * currentSize, currentPage * currentSize);

  // If the data shrinks (filters) and our page no longer exists, step back.
  useEffect(() => {
    if (page === undefined && innerPage > lastPage) setInnerPage(lastPage);
  }, [innerPage, lastPage, page]);

  const goToPage = (next: number) => {
    setInnerPage(next);
    onPageChange?.(next);
  };
  const changeSize = (next: number) => {
    setInnerSize(next);
    setInnerPage(1);
    onPageSizeChange?.(next);
    onPageChange?.(1);
  };

  // ---- selection helpers (select-all acts on the visible page) ----
  const pageKeys = pageRows.map(rowKey);
  const selectedOnPage = pageKeys.filter((k) => selected.includes(k)).length;
  const allSelected = pageKeys.length > 0 && selectedOnPage === pageKeys.length;
  const someSelected = selectedOnPage > 0 && !allSelected;

  const headCheckbox = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headCheckbox.current) headCheckbox.current.indeterminate = someSelected;
  }, [someSelected]);

  const toggleAll = () => {
    setSelected(
      allSelected
        ? selected.filter((k) => !pageKeys.includes(k))
        : Array.from(new Set([...selected, ...pageKeys])),
    );
  };
  const toggleOne = (key: string) => {
    setSelected(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  };

  const cycleSort = (key: string) => {
    if (activeSort?.key !== key) setSort({ key, direction: 'asc' });
    else if (activeSort.direction === 'asc') setSort({ key, direction: 'desc' });
    else setSort(null);
  };

  const colSpan = columns.length + (selectable ? 1 : 0);
  const showEmpty = !loading && !error && pageRows.length === 0;

  return (
    <div className="hcx-table-card">
      <div className="hcx-table-scroll">
        <table className="hcx-table" aria-label={label} aria-busy={loading}>
          <thead>
            <tr>
              {selectable && (
                <th className="hcx-table__check" scope="col">
                  <input
                    ref={headCheckbox}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={loading || pageKeys.length === 0}
                    aria-label="Select all rows on this page"
                  />
                </th>
              )}
              {columns.map((col) => {
                const sortable = Boolean(col.sortValue || col.sortable);
                const dir = activeSort?.key === col.key ? activeSort.direction : null;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width, textAlign: col.align }}
                    className={clsx(col.hideOnMobile && 'hcx-hide-sm')}
                    aria-sort={dir ? (dir === 'asc' ? 'ascending' : 'descending') : sortable ? 'none' : undefined}
                  >
                    {sortable ? (
                      <button type="button" className="hcx-table__sort" onClick={() => cycleSort(col.key)}>
                        {col.header}
                        {dir === 'asc' ? <ArrowUp size={14} /> : dir === 'desc' ? <ArrowDown size={14} /> : <ArrowUpDown size={14} className="is-idle" />}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: Math.min(currentSize, SKELETON_ROWS) }, (_, i) => (
                <tr key={`sk-${i}`}>
                  <td colSpan={colSpan}>
                    <span className="hcx-skeleton hcx-skeleton--row" />
                  </td>
                </tr>
              ))}

            {!loading && error && (
              <tr>
                <td colSpan={colSpan}>
                  <div className="hcx-empty hcx-empty--error" role="alert">
                    <p>{error}</p>
                    {onRetry && (
                      <button type="button" className="hcx-btn" onClick={onRetry}>Try again</button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {showEmpty && (
              <tr>
                <td colSpan={colSpan}>
                  <div className="hcx-empty">
                    <Inbox size={28} aria-hidden />
                    <strong>{emptyTitle}</strong>
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading && !error &&
              pageRows.map((row) => {
                const key = rowKey(row);
                const isSelected = selected.includes(key);
                return (
                  <tr
                    key={key}
                    className={clsx(isSelected && 'is-selected', onRowClick && 'is-clickable')}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {selectable && (
                      <td className="hcx-table__check" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(key)}
                          aria-label={`Select row ${key}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{ textAlign: col.align }}
                        className={clsx(col.hideOnMobile && 'hcx-hide-sm')}
                      >
                        {col.cell ? col.cell(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {!hidePagination && !error && (
        <Pagination
          page={currentPage}
          pageSize={currentSize}
          total={loading ? 0 : totalRows}
          onPageChange={goToPage}
          onPageSizeChange={changeSize}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}

export default DataTable;
