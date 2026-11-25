import { NextResponse } from "next/server";
import { revokeCurrentSession } from "@/lib/auth";

export async function POST() {
  try {
    await revokeCurrentSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to log out" }, { status: 500 });
  }
}
