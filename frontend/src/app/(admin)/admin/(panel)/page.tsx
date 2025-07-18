import React from "react";

import { AdminDashboard } from "@/components/admin/dashboard";

const admin = () => {
  return (
    <div className="bg-amber-50/30 min-h-screen">
      <AdminDashboard />
      {/* <ChartAreaStacked/> */}
    </div>
  );
};

export default admin;
