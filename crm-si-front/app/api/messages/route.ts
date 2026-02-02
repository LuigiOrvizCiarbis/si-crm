import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ message: "No authorization token provided" }, { status: 401 });
  }

  const body = await req.json();
  const publicBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const internalBase = (process.env.API_INTERNAL_URL || "").replace(/\/$/, "");
  const bases = [internalBase, publicBase, "http://localhost:8000", "http://host.docker.internal:8000"].filter(Boolean);

  for (const base of bases) {
    try {
      const url = `${base}/api/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok || res.status >= 400) {
        return NextResponse.json(data, { status: res.status });
      }
    } catch {
      continue;
    }
  }
  return NextResponse.json({ message: "No reachable backend" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ message: "No authorization token provided" }, { status: 401 });
  }

  const body = await req.json();
  const publicBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const internalBase = (process.env.API_INTERNAL_URL || "").replace(/\/$/, "");
  const bases = [internalBase, publicBase, "http://localhost:8000", "http://host.docker.internal:8000"].filter(Boolean);

  for (const base of bases) {
    try {
      const url = `${base}/api/messages`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok || res.status >= 400) {
        return NextResponse.json(data, { status: res.status });
      }
    } catch {
      continue;
    }
  }
  return NextResponse.json({ message: "No reachable backend" }, { status: 500 });
}

