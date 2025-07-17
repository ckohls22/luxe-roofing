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
    <div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              onClick={() => handleSort("firstName")}
              className="px-6 py-3 text-left cursor-pointer"
            >
              First Name
              {currentSort.sortBy === "firstName" && (
                <span>{currentSort.sortOrder === "asc" ? " ↑" : " ↓"}</span>
              )}
            </th>
            <th
              onClick={() => handleSort("lastName")}
              className="px-6 py-3 text-left cursor-pointer"
            >
              Last Name
              {currentSort.sortBy === "lastName" && (
                <span>{currentSort.sortOrder === "asc" ? " ↑" : " ↓"}</span>
              )}
            </th>
            <th className="px-6 py-3 text-left">Email</th>
            <th
              onClick={() => handleSort("createdAt")}
              className="px-6 py-3 text-left cursor-pointer"
            >
              Created At
              {currentSort.sortBy === "createdAt" && (
                <span>{currentSort.sortOrder === "asc" ? " ↑" : " ↓"}</span>
              )}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {forms.map((form) => (
            <tr key={form.id}>
              <td className="px-6 py-4">{form.firstName}</td>
              <td className="px-6 py-4">{form.lastName}</td>
              <td className="px-6 py-4">{form.email}</td>
              <td className="px-6 py-4">
                {new Date(form.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.totalCount)}{" "}
          of {pagination.totalCount} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
