"use client";

import * as React from "react";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { z } from "zod";
import { toast } from "sonner";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";

import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define quote schema
export const quoteSchema = z.object({
  id: z.string().uuid(),
  quoteNumber: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  materialType: z.string(),
  supplierName: z.string(),
  materialCost: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Quote = z.infer<typeof quoteSchema>;

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  let className = "capitalize";

  switch (status) {
    case "draft":
      className +=
        " bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200";
      break;
    case "sent":
      className +=
        " bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300";
      break;
    case "viewed":
      className +=
        " bg-orange-100 text-orange-800 hover:bg-orange-200 border border-orange-300";
      break;
    case "accepted":
      className +=
        " bg-green-100 text-green-800 hover:bg-green-200 border border-green-300";
      break;
    case "rejected":
      className +=
        " bg-red-100 text-red-800 hover:bg-red-200 border border-red-300";
      break;
    case "expired":
      className +=
        " bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300";
      break;
    default:
      className +=
        " bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200";
  }

  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
  );
};

export function QuotesTable() {
  const [data, setData] = React.useState<Quote[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [totalPages, setTotalPages] = React.useState(0);
  // Removed totalItems state as it's not being used anywhere
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [editingQuote, setEditingQuote] = React.useState<Quote | null>(null);
  const [deleteQuoteId, setDeleteQuoteId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string | undefined>();

  // Define table columns
  const columns: ColumnDef<Quote>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "quoteNumber",
      header: "Quote #",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("quoteNumber")}</div>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => <div>{row.getValue("customerName")}</div>,
    },
    {
      accessorKey: "materialType",
      header: "Material",
      cell: ({ row }) => <div>{row.getValue("materialType")}</div>,
    },
    {
      accessorKey: "supplierName",
      header: "Supplier",
      cell: ({ row }) => <div>{row.getValue("supplierName")}</div>,
    },
    {
      accessorKey: "materialCost",
      header: "Cost",
      cell: ({ row }) => (
        <div className="text-right font-medium">
          ${parseFloat(row.getValue("materialCost")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div>{new Date(row.getValue("createdAt")).toLocaleDateString()}</div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            >
              <IconDotsVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteQuoteId(row.original.id)}
              className="text-red-600"
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Fetch quotes data
  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const page = pagination.pageIndex + 1;
      const limit = pagination.pageSize;

      let url = `/api/admin/quote?page=${page}&limit=${limit}`;
      if (statusFilter) url += `&status=${statusFilter}`;

      const res = await fetch(url);
      const result = await res.json();

      if (result.success) {
        setData(result.data);
        setTotalPages(result.pagination.totalPages);
        // No longer tracking totalItems
      } else {
        toast.error("Failed to fetch quotes");
      }
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast.error("An error occurred while fetching quotes");
    } finally {
      setLoading(false);
    }
  };

  // Handle edit quote
  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote);
  };

  // Handle edit save
  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingQuote) return;

    try {
      const formData = new FormData(e.currentTarget);
      const status = formData.get("status") as string;
      const materialCost = formData.get("materialCost") as string;

      const res = await fetch(`/api/admin/quote?id=${editingQuote.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          materialCost,
        }),
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Quote updated successfully");
        setEditingQuote(null);
        fetchQuotes();
      } else {
        toast.error(result.message || "Failed to update quote");
      }
    } catch (error) {
      console.error("Error updating quote:", error);
      toast.error("An error occurred while updating the quote");
    }
  };

  // Handle delete quote
  const handleDelete = async () => {
    if (!deleteQuoteId) return;

    try {
      const res = await fetch(`/api/admin/quote?id=${deleteQuoteId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Quote deleted successfully");
        setDeleteQuoteId(null);
        fetchQuotes();
      } else {
        toast.error(result.message || "Failed to delete quote");
      }
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast.error("An error occurred while deleting the quote");
    }
  };

  // Effect for fetching data on component mount and when dependencies change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedFetchQuotes = React.useCallback(fetchQuotes, []);

  React.useEffect(() => {
    memoizedFetchQuotes();
    // Adding memoizedFetchQuotes to the dependency array instead of fetchQuotes directly
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    statusFilter,
    memoizedFetchQuotes,
  ]);

  // Setup table
  const table = useReactTable({
    data,
    columns,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    manualPagination: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-amber-800">
            Quotes
          </h2>
          <p className="text-muted-foreground">
            Manage customer quotes and pricing
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Filter quotes..."
            className="max-w-sm"
            value={
              (table.getColumn("quoteNumber")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("quoteNumber")?.setFilterValue(event.target.value)
            }
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="viewed">Viewed</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading quotes...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No quotes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of {totalPages || 1}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <IconChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <IconChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <IconChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit Quote Dialog */}
      <Dialog
        open={!!editingQuote}
        onOpenChange={(open) => !open && setEditingQuote(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Quote</DialogTitle>
            <DialogDescription>
              Make changes to quote #{editingQuote?.quoteNumber}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select name="status" defaultValue={editingQuote?.status}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="viewed">Viewed</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="materialCost" className="text-right">
                  Cost
                </Label>
                <Input
                  id="materialCost"
                  name="materialCost"
                  defaultValue={editingQuote?.materialCost}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white"
              >
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteQuoteId}
        onOpenChange={(open) => !open && setDeleteQuoteId(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this quote? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteQuoteId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
