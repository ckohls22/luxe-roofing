"use client";

import {
  IconCamera,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconFolder,
  IconListDetails,
} from "@tabler/icons-react";
import * as React from "react";

import { NavMain } from "@/components/admin/dashboard/nav-main";
import { Button } from "@/components/ui";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { useAdminAuth } from "@/hooks/useAdminAuth";
import Link from "next/link";
const data = {
  user: {
    name: "LuxeRoofing",
    email: "m@example.com",
    avatar: "/luxeroofinglogo.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Suppliers",
      url: "/admin/suppliers",
      icon: IconListDetails,
    },
    {
      title: "Add Supplier",
      url: "/admin/add-supplier",
      icon: IconListDetails,
    },
    {
      title: "Leads",
      url: "/admin/leads",
      icon: IconFolder,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { logout, isLoading } = useAdminAuth();

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-amber-200"
      {...props}
    >
      <SidebarHeader className="border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-3 hover:bg-amber-100 transition-colors"
            >
              <Link href="/admin/dashboard" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LQ</span>
                </div>
                <span className="text-base font-bold text-gray-900">
                  LuxelQ Admin
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-white">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t border-amber-200 bg-amber-50">
        <Button
          onClick={logout}
          className="border-t border-amber-200 bg-amber-700 hover:bg-amber-800 cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? "Logging out..." : "Log Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
