import React, { useState } from "react";
import { Search } from "lucide-react";

const GeneralTable = ({
  tableTitle,
  headers,
  rows,
  renderRows,
  showSearch = true,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredRows = rows.filter((row) =>
    Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div className="text-xl font-medium">
          <h2>{tableTitle}</h2>
        </div>
      </div>

      {/* Table */}
      <div className="border border-surface-a30 rounded-lg overflow-hidden p-4 shadow-md">
        <div className="overflow-x-auto">
          <div className="flex flex-col md:flex-row md:justify-between mb-4">
            {/* Search Field */}
            {showSearch && (
              <div className="mb-4 flex max-w-1/2 items-center gap-2">
                <Search className="w-5 h-5 text-slate-800" />
                <input
                  type="search"
                  name="search"
                  id="search"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="px-4 py-2 border border-surface-a30 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 w-full"
                  placeholder="Search..."
                />
              </div>
            )}
          </div>

          {/* Table Content */}
          <table className="min-w-full divide-y divide-surface-a30 table-auto">
            <thead className="bg-surface-a30">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 border border-surface-a30 text-left text-sm font-bold text-dark-a0 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
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
                filteredRows.map((row, index) => renderRows(row, index))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GeneralTable;
