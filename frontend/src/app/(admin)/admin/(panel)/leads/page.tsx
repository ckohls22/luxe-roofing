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
      <div className="container mx-auto py-8 px-4 md:px-6 space-y-8 bg-amber-50/30 min-h-screen">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">L</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Leads</h1>
          </div>
          <p className="text-amber-800 font-medium">
            Manage and view your form submissions
          </p>
        </div>
        <LeadsDataTable initialData={data} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching leads:", error);
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 bg-amber-50/30 min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 font-bold text-xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-amber-800 mt-2 font-medium">
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
