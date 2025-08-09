"use client";

import React from "react";
import { QuotesTable } from "@/components/admin/dashboard/quotes-table";
import { IconFileInvoice } from "@tabler/icons-react";

export default function QuotesPage() {
  return (
    <div className="container py-6 px-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-2">
          <IconFileInvoice className="text-amber-500" />
          <span>Quotes Management</span>
        </h1>
        <p className="text-gray-500">
          View, manage, and track all your roofing quotes in one place.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-amber-200">
        <QuotesTable />
      </div>
    </div>
  );
}
