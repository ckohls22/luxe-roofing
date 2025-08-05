import { NextRequest, NextResponse } from "next/server";
import { createSupplier, getAllSuppliers } from "@/db/queries";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function GET() {
  try {
    const suppliers = await getAllSuppliers();

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const installation = formData.get("installation") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const logoFile = formData.get("logo") as File;
    console.log(logoFile, "logoFile");
    let logoUrl = "";
    if (logoFile && logoFile.size > 0) {
      logoUrl = (await uploadToCloudinary(logoFile)) || "";
    }

    console.log("Logo URL:", logoUrl, typeof logoUrl);

    const supplierData = {
      name,
      description,
      installation,
      phone,
      email,
      logoUrl,
    };

    const newSupplier = await createSupplier(supplierData);
    return NextResponse.json({ supplier: newSupplier }, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
