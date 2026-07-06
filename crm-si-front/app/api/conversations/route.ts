import { NextRequest, NextResponse } from "next/server";
import { proxyToLaravel } from "@/lib/api/proxy-helper";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json({ message: "No auth" }, { status: 401 });
  }

  const baseUrls = [
    process.env.API_INTERNAL_URL,
    process.env.NEXT_PUBLIC_API_URL,
    "http://localhost:8000",
    "http://host.docker.internal:8000",
  ].filter((url): url is string => !!url);

  const qs = req.nextUrl.search || "";

  try {
    const { data, status } = await proxyToLaravel(
      `/api/conversations${qs}`,
      authHeader,
      { baseUrls }
    );
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json(
      { message: "No reachable backend" },
      { status: 503 }
    );
  }
}
