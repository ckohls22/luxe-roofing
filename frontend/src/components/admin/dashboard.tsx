"use client";

import { useState } from "react";
import {
  BarChart3,
  FileText,
  Users,
  Building2,
  TrendingUp,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Badge } from "@/components/ui/badge"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Input } from "@/components/ui";

// Sample data
const monthlyLeadsData = [
  { month: "Jan", leads: 45 },
  { month: "Feb", leads: 52 },
  { month: "Mar", leads: 38 },
  { month: "Apr", leads: 61 },
  { month: "May", leads: 55 },
  { month: "Jun", leads: 67 },
];

// Expanded sample data (simulating API response)
const allLeadsData = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@email.com",
    address: "123 Main St, New York, NY",
    quote: "$2,500",
    status: "pending",
    date: "2024-01-15",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    address: "456 Oak Ave, Los Angeles, CA",
    quote: "$3,200",
    status: "approved",
    date: "2024-01-14",
  },
  {
    id: 3,
    name: "Mike Davis",
    email: "mike.davis@email.com",
    address: "789 Pine St, Chicago, IL",
    quote: "$1,800",
    status: "rejected",
    date: "2024-01-13",
  },
  {
    id: 4,
    name: "Emily Wilson",
    email: "emily.w@email.com",
    address: "321 Elm St, Houston, TX",
    quote: "$4,100",
    status: "pending",
    date: "2024-01-12",
  },
  {
    id: 5,
    name: "David Brown",
    email: "david.brown@email.com",
    address: "654 Maple Dr, Phoenix, AZ",
    quote: "$2,900",
    status: "approved",
    date: "2024-01-11",
  },
  {
    id: 6,
    name: "Lisa Anderson",
    email: "lisa.anderson@email.com",
    address: "987 Cedar Ln, Miami, FL",
    quote: "$3,750",
    status: "pending",
    date: "2024-01-10",
  },
  {
    id: 7,
    name: "Robert Taylor",
    email: "robert.t@email.com",
    address: "147 Birch St, Seattle, WA",
    quote: "$2,200",
    status: "approved",
    date: "2024-01-09",
  },
  {
    id: 8,
    name: "Jennifer Martinez",
    email: "jennifer.m@email.com",
    address: "258 Spruce Ave, Denver, CO",
    quote: "$4,500",
    status: "rejected",
    date: "2024-01-08",
  },
  {
    id: 9,
    name: "Michael Garcia",
    email: "michael.g@email.com",
    address: "369 Willow Dr, Boston, MA",
    quote: "$3,100",
    status: "pending",
    date: "2024-01-07",
  },
  {
    id: 10,
    name: "Amanda Rodriguez",
    email: "amanda.r@email.com",
    address: "741 Poplar St, Atlanta, GA",
    quote: "$2,800",
    status: "approved",
    date: "2024-01-06",
  },
  {
    id: 11,
    name: "Christopher Lee",
    email: "chris.lee@email.com",
    address: "852 Ash Blvd, Portland, OR",
    quote: "$3,900",
    status: "pending",
    date: "2024-01-05",
  },
  {
    id: 12,
    name: "Jessica White",
    email: "jessica.w@email.com",
    address: "963 Hickory Way, Nashville, TN",
    quote: "$2,600",
    status: "approved",
    date: "2024-01-04",
  },
];

const navigationItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    isActive: true,
  },
  {
    title: "Quotes",
    icon: FileText,
    isActive: false,
  },
  {
    title: "Users",
    icon: Users,
    isActive: false,
  },
  {
    title: "Suppliers",
    icon: Building2,
    isActive: false,
  },
];

function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">AdminPro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-4 py-4">
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={item.isActive}
                className="w-full justify-start"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

export function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 5;

  // Filter leads based on search term
  const filteredLeads = allLeadsData.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, endIndex);

  // Reset to first page when search changes
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Simulate API call structure (ready for future implementation)
  const fetchLeads = async (page: number, search: string) => {
    setIsLoading(true);
    // Future API call would go here
    // const response = await fetch(`/api/leads?page=${page}&search=${search}&limit=${itemsPerPage}`)
    // const data = await response.json()

    // Simulate loading delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    setIsLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="Admin" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Main Content */}
          <main className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
            {/* Monthly Leads Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Leads Chart</CardTitle>
                <CardDescription>
                  Lead generation performance over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    leads: {
                      label: "Leads",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyLeadsData}>
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="leads"
                        fill="var(--color-leads)"
                        radius={4}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Leads
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">318</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+12.5%</span> from last
                    month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,247</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">+8.2%</span> from last
                    month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Suppliers
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-red-600">-2.1%</span> from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Leads Table */}
            <Card>
              <CardHeader>
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div>
                    <CardTitle>Leads Table</CardTitle>
                    <CardDescription>
                      Recent leads and their current status
                    </CardDescription>
                  </div>
                  <div className="flex w-full max-w-sm items-center space-x-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search leads..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mobile-friendly table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Quote</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          Array.from({ length: itemsPerPage }).map(
                            (_, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
                                </TableCell>
                                <TableCell>
                                  <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
                                </TableCell>
                                <TableCell>
                                  <div className="h-4 w-40 animate-pulse rounded bg-muted"></div>
                                </TableCell>
                                <TableCell>
                                  <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
                                </TableCell>
                                <TableCell>
                                  <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
                                </TableCell>
                                <TableCell>
                                  <div className="h-4 w-20 animate-pulse rounded bg-muted"></div>
                                </TableCell>
                                <TableCell>
                                  <div className="h-4 w-8 animate-pulse rounded bg-muted"></div>
                                </TableCell>
                              </TableRow>
                            )
                          )
                        ) : currentLeads.length > 0 ? (
                          currentLeads.map((lead) => (
                            <TableRow key={lead.id}>
                              <TableCell className="font-medium">
                                {lead.name}
                              </TableCell>
                              <TableCell>{lead.email}</TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {lead.address}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {lead.quote}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(lead.status)}
                              </TableCell>
                              <TableCell>{lead.date}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No leads found matching your search.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile card layout */}
                  <div className="md:hidden space-y-4">
                    {isLoading ? (
                      Array.from({ length: itemsPerPage }).map((_, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
                              <div className="h-3 w-48 animate-pulse rounded bg-muted"></div>
                              <div className="h-3 w-24 animate-pulse rounded bg-muted"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : currentLeads.length > 0 ? (
                      currentLeads.map((lead) => (
                        <Card key={lead.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{lead.name}</h3>
                                  {getStatusBadge(lead.status)}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {lead.email}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {lead.address}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold">
                                    {lead.quote}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {lead.date}
                                  </span>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                          No leads found matching your search.
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to{" "}
                        {Math.min(endIndex, filteredLeads.length)} of{" "}
                        {filteredLeads.length} results
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1 || isLoading}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              let pageNumber;
                              if (totalPages <= 5) {
                                pageNumber = i + 1;
                              } else if (currentPage <= 3) {
                                pageNumber = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNumber = totalPages - 4 + i;
                              } else {
                                pageNumber = currentPage - 2 + i;
                              }

                              return (
                                <Button
                                  key={pageNumber}
                                  variant={
                                    currentPage === pageNumber
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNumber)}
                                  disabled={isLoading}
                                  className="w-8 h-8 p-0"
                                >
                                  {pageNumber}
                                </Button>
                              );
                            }
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages || isLoading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
