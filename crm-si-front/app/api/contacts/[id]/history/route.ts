import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");

  if (!token) return NextResponse.json({ message: "No auth" }, { status: 401 });

  const publicBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const internalBase = (process.env.API_INTERNAL_URL || "").replace(/\/$/, "");
  const bases = [
    internalBase,
    publicBase,
    "http://localhost:8000",
    "http://host.docker.internal:8000",
  ].filter(Boolean);

  const { id: contactId } = await params;

  for (const base of bases) {
    try {
      const url = `${base}/api/contacts/${contactId}/history`;
      const r = await fetch(url, {
        headers: { Accept: "application/json", 
            Authorization: `Bearer ${token}` },
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok || r.status >= 400) {
        return NextResponse.json(data, { status: r.status });
      }
    } catch {
      continue;
    }
  }
  return NextResponse.json(
    { message: "No reachable backend" },
    { status: 500 }
  );
}
