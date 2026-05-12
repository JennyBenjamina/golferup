import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getUploadSignature } from "@/server/services/cloudinary";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const signatureData = await getUploadSignature("listings");
    return NextResponse.json(signatureData);
  } catch (error) {
    console.error("Failed to generate upload signature:", error);
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
