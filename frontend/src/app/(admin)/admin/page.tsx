import React from "react";
import { Button } from "@/components/ui/button";
import { AdminDashboard } from "@/components/admin/dashboard";
import { ChartAreaStacked } from "@/components/admin/chart";

const admin = () => {
  return (
    <div>
      <AdminDashboard/>
      {/* <ChartAreaStacked/> */}
    </div>
  );
};

export default admin;
