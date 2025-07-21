import { updateMaterialById } from "@/db/queries";
import { materials } from "@/db/schema";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ materialId: string }> }
) {
  const { materialId } = await params;

  try {
    const formData = await request.formData();

    const type = formData.get("type") as string | null;
    const warranty = formData.get("warranty") as string | null;
    const topFeatures = formData.get("topFeatures") as string | null;
    const price = formData.get("price") as string;

    const materialImageFile = formData.get("materialImage") as File | null;
    const showCaseFile = formData.get("showCase") as File | null;

    let materialImage: string | undefined;
    let showCase: string | undefined;

    if (materialImageFile && materialImageFile.size > 0) {
      materialImage = await uploadToCloudinary(materialImageFile);
    }

    if (showCaseFile && showCaseFile.size > 0) {
      showCase = await uploadToCloudinary(showCaseFile);
    }

    const updateData: Partial<typeof materials.$inferInsert> = {
      ...(type ? { type } : {}),
      ...(warranty ? { warranty } : {}),
      ...(topFeatures ? { topFeatures } : {}),
      ...(price ? { price } : {}),
      ...(materialImage ? { materialImage } : {}),
      ...(showCase ? { showCase } : {}),
      updatedAt: new Date(),
    };

    const updated = await updateMaterialById(materialId, updateData);

    if (!updated) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ material: updated });
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json(
      { error: "Failed to update material" },
      { status: 500 }
    );
  }
}
