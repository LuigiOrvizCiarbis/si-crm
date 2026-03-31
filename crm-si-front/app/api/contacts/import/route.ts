import { NextRequest, NextResponse } from "next/server";
import { proxyToLaravel } from "@/lib/api/proxy-helper";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ message: "No auth" }, { status: 401 });

  const formData = await req.formData();

  try {
    const { data, status } = await proxyToLaravel("/api/contacts/import", authHeader, {
      method: "POST",
      body: formData,
      rawBody: true,
    });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ message: "No reachable backend" }, { status: 503 });
  }
}
