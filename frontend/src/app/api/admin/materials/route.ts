import { NextRequest, NextResponse } from "next/server";
import { createMaterial, getMaterialsBySupplier } from "@/db/queries";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");

    if (supplierId) {
      const materials = await getMaterialsBySupplier(supplierId);
      return NextResponse.json({ materials });
    }

    return NextResponse.json(
      { error: "Supplier ID is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const supplierId = formData.get("supplierId") as string;
    const type = formData.get("type") as string;
    const warranty = formData.get("warranty") as string;
    const topFeatures = formData.get("topFeatures") as string;
    const showCase = formData.get("showCase") as File;
    const materialImageFile = formData.get("materialImage") as File;
    console.log(formData);

    let materialImage = "";
    if (materialImageFile && materialImageFile.size > 0) {
      materialImage = await uploadToCloudinary(materialImageFile);
    }
    let showcaseImage = "";
    if (materialImageFile && materialImageFile.size > 0) {
      materialImage = await uploadToCloudinary(showCase);
    }

    console.log(materialImage, showcaseImage);

    const materialData = {
      supplierId,
      type,
      warranty,
      topFeatures,
      showCase: showcaseImage,
      materialImage: materialImage || undefined,
    };

    const newMaterial = await createMaterial(materialData);
    return NextResponse.json({ material: newMaterial }, { status: 201 });
  } catch (error) {
    console.error("Error creating material:", error);
    return NextResponse.json(
      { error: "Failed to create material" },
      { status: 500 }
    );
  }
}
