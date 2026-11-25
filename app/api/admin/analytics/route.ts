import { NextResponse } from "next/server";
import { getAdminAnalytics } from "@/lib/analytics";
import { getCurrentAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const linkId = url.searchParams.get("linkId") || undefined;
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;

  const analytics = await getAdminAnalytics({
    adminId: admin.id,
    linkId,
    from,
    to,
  });

  return NextResponse.json(analytics);
}
