import React, { useMemo, useState } from "react";

export interface Column<T> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  label?: string;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  emptyTitle?: string;
  emptyMessage?: string;
}

function DataTable<T>({
  columns,
  data,
  rowKey,
  label = "Data",
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50],
  emptyTitle = "No records found",
  emptyMessage = "There are no records to display.",
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortedData = useMemo(() => {
    if (!sortKey) {
      return data;
    }

    const column = columns.find((item) => item.key === sortKey);

    if (!column?.sortValue) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = column.sortValue?.(a);
      const bValue = column.sortValue?.(b);

      if (aValue === bValue) {
        return 0;
      }

      const result = aValue! < bValue! ? -1 : 1;

      return sortDirection === "asc" ? result : -result;
    });
  }, [columns, data, sortKey, sortDirection]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedData.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (column: Column<T>) => {
    if (!column.sortValue) {
      return;
    }

    if (sortKey === column.key) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(column.key);
      setSortDirection("asc");
    }

    setPage(1);
  };

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setPageSize(Number(event.target.value));
    setPage(1);
  };

  return (
    <div className="shared-datatable">
      {data.length === 0 ? (
        <div className="datatable-empty" role="status">
          <h3>{emptyTitle}</h3>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="datatable-wrapper">
            <table
              className="datatable"
              aria-label={label}
            >
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} scope="col">
                      {column.sortValue ? (
                        <button
                          type="button"
                          className="datatable-sort-button"
                          onClick={() => handleSort(column)}
                        >
                          {column.header}

                          {sortKey === column.key && (
                            <span aria-hidden="true">
                              {sortDirection === "asc"
                                ? " ↑"
                                : " ↓"}
                            </span>
                          )}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedData.map((row) => (
                  <tr key={rowKey(row)}>
                    {columns.map((column) => (
                      <td key={column.key}>
                        {column.cell
                          ? column.cell(row)
                          : String(
                              (
                                row as Record<string, unknown>
                              )[column.key] ?? ""
                            )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="datatable-footer">
            <div className="datatable-page-size">
              <label htmlFor={`${label}-page-size`}>
                Rows per page
              </label>

              <select
                id={`${label}-page-size`}
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="datatable-pagination">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages, current + 1)
                  )
                }
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default DataTable;