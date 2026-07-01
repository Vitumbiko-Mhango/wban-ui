import React, { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";

const GeneralTable = ({
  tableTitle,
  headers,
  rows = [],
  renderRows,
  showSearch = true,
  sortableColumns = {},
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredRows =
    showSearch && searchQuery.trim()
      ? rows.filter((row) =>
          Object.values(row).some((value) => {
            if (value === null || value === undefined) return false;
            if (typeof value === "object") return false;
            return String(value)
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
          }),
        )
      : rows;

  const sortedRows = sortConfig.key
    ? [...filteredRows].sort((a, b) => {
        const getValue = sortableColumns[sortConfig.key];
        const rawA = getValue?.(a);
        const rawB = getValue?.(b);

        const valueA = rawA === null || rawA === undefined ? "" : rawA;
        const valueB = rawB === null || rawB === undefined ? "" : rawB;

        if (typeof valueA === "number" && typeof valueB === "number") {
          return sortConfig.direction === "asc"
            ? valueA - valueB
            : valueB - valueA;
        }

        return sortConfig.direction === "asc"
          ? String(valueA).localeCompare(String(valueB), undefined, {
              numeric: true,
              sensitivity: "base",
            })
          : String(valueB).localeCompare(String(valueA), undefined, {
              numeric: true,
              sensitivity: "base",
            });
      })
    : filteredRows;

  const handleSort = (header) => {
    if (!sortableColumns[header]) return;

    setSortConfig((current) => {
      if (current.key !== header) {
        return { key: header, direction: "asc" };
      }
      return {
        key: header,
        direction: current.direction === "asc" ? "desc" : "asc",
      };
    });
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div className="text-xl font-medium">
          <h2>{tableTitle}</h2>
        </div>
      </div>

      {/* Table */}
      <div className="border border-surface-a30 rounded-lg overflow-hidden shadow-md">
        <div className="p-4 overflow-x-auto">
          <div className="mb-4">
            {/* Search Field */}
            {showSearch && (
              <div className="relative mb-4 flex max-w-[50%] items-center gap-2">
                {" "}
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dark-a0/40" />
                <input
                  type="search"
                  name="search"
                  id="search"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-9 pr-4 py-2 border border-surface-a30 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 w-full"
                  placeholder="Search..."
                />
              </div>
            )}
          </div>

          {/* Table Content */}
          <table className="min-w-full divide-y divide-surface-a30 table-auto">
            <thead className="bg-surface-a30">
              <tr>
                {headers.map((header, index) => {
                  const sortable = Boolean(sortableColumns[header]);
                  const active = sortConfig.key === header;
                  const SortIcon = active
                    ? sortConfig.direction === "asc"
                      ? ArrowUp
                      : ArrowDown
                    : ArrowUpDown;

                  return (
                  <th
                    key={index}
                    className="px-6 py-3 border border-surface-a30 text-left text-sm font-bold text-dark-a0 uppercase tracking-wider"
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(header)}
                        className={`inline-flex items-center gap-1.5 uppercase cursor-pointer transition-colors hover:text-primary-a20 focus:outline-none focus:text-primary-a20 ${
                          active ? "text-primary-a20" : ""
                        }`}
                        aria-label={`Sort by ${header}`}
                      >
                        {header}
                        <SortIcon className="size-3.5" />
                      </button>
                    ) : (
                      header
                    )}
                  </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-a30">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="px-6 py-4 text-center text-dark-a0"
                  >
                    No records available
                  </td>
                </tr>
              ) : filteredRows.length === 0 && showSearch ? (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="px-6 py-4 text-center text-dark-a0"
                  >
                    No matching records found
                  </td>
                </tr>
              ) : (
                sortedRows.map((row, index) => renderRows(row, index))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GeneralTable;
