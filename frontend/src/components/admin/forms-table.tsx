// app/forms/forms-table.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface FormsTableProps {
  forms: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    // Add other form fields
  }>;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  currentSort: {
    sortBy?: string;
    sortOrder?: string;
  };
}

export function FormsTable({
  forms,
  pagination,
  currentSort,
}: FormsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle sort change
  const handleSort = (column: string) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (currentSort.sortBy === column) {
      // Toggle sort order
      newSearchParams.set(
        "sortOrder",
        currentSort.sortOrder === "asc" ? "desc" : "asc"
      );
    } else {
      // New column sort
      newSearchParams.set("sortBy", column);
      newSearchParams.set("sortOrder", "asc");
    }

    router.push(`?${newSearchParams.toString()}`);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("page", newPage.toString());
    router.push(`?${newSearchParams.toString()}`);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg border border-amber-200">
      <table className="min-w-full divide-y divide-amber-200">
        <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
          <tr>
            <th
              onClick={() => handleSort("firstName")}
              className="px-6 py-3 text-left cursor-pointer font-semibold text-gray-900 hover:bg-amber-100 transition-colors"
            >
              First Name
              {currentSort.sortBy === "firstName" && (
                <span className="text-amber-600">{currentSort.sortOrder === "asc" ? " ↑" : " ↓"}</span>
              )}
            </th>
            <th
              onClick={() => handleSort("lastName")}
              className="px-6 py-3 text-left cursor-pointer font-semibold text-gray-900 hover:bg-amber-100 transition-colors"
            >
              Last Name
              {currentSort.sortBy === "lastName" && (
                <span className="text-amber-600">{currentSort.sortOrder === "asc" ? " ↑" : " ↓"}</span>
              )}
            </th>
            <th className="px-6 py-3 text-left font-semibold text-gray-900">Email</th>
            <th
              onClick={() => handleSort("createdAt")}
              className="px-6 py-3 text-left cursor-pointer font-semibold text-gray-900 hover:bg-amber-100 transition-colors"
            >
              Created At
              {currentSort.sortBy === "createdAt" && (
                <span className="text-amber-600">{currentSort.sortOrder === "asc" ? " ↑" : " ↓"}</span>
              )}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-amber-100">
          {forms.map((form) => (
            <tr key={form.id} className="hover:bg-amber-50 transition-colors">
              <td className="px-6 py-4 text-gray-900 font-medium">{form.firstName}</td>
              <td className="px-6 py-4 text-gray-900 font-medium">{form.lastName}</td>
              <td className="px-6 py-4 text-amber-800">{form.email}</td>
              <td className="px-6 py-4 text-gray-600">
                {new Date(form.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 p-4 bg-amber-50 border-t border-amber-200">
        <div className="text-sm text-amber-800 font-medium">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.totalCount)}{" "}
          of {pagination.totalCount} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-amber-300 rounded-lg bg-white text-amber-700 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border border-amber-300 rounded-lg bg-white text-amber-700 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
