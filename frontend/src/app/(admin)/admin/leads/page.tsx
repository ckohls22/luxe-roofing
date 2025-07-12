// app/(admin)/admin/leads/page.tsx
import { getAllForms } from "@/db/queries";
import { LeadsDataTable } from "@/components/admin/dashboard/leads-table";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const sortBy = params.sortBy as
    | "createdAt"
    | "firstName"
    | "lastName"
    | undefined;
  const sortOrder = params.sortOrder as "asc" | "desc" | undefined;

  try {
    const data = await getAllForms({
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return (
      <div className="container mx-auto py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">
            Manage and view your form submissions
          </p>
        </div>
        <LeadsDataTable initialData={data} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching leads:", error);
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-muted-foreground mt-2">
            Failed to load leads. Please try again.
          </p>
        </div>
      </div>
    );
  }
}

export async function generateMetadata() {
  return {
    title: "Leads | Admin Dashboard",
    description: "View and manage form submissions",
  };
}
