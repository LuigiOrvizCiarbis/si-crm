import { NextRequest } from "next/server";
import { proxyToLaravel } from "@/lib/api/proxy-helper";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization") ?? "";
  const body = await request.text();

  const { data, status } = await proxyToLaravel("/api/broadcasting/auth", auth, {
    method: "POST",
    body,
    rawBody: true,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return Response.json(data, { status });
}
