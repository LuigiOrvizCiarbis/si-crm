import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { success: false, message: "No authorization token provided" },
      { status: 401 }
    );
  }

  const publicBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const internalBase = (process.env.API_INTERNAL_URL || "").replace(/\/$/, "");
  const candidates: string[] = [];
  
  const pushCandidate = (b?: string) => {
    if (!b) return;
    const base = b.replace(/\/$/, "");
    if (!base) return;
    candidates.push(base);
    if (base.startsWith("https://localhost")) {
      candidates.push("http://localhost:8000");
    }
  };

  pushCandidate(internalBase);
  pushCandidate(publicBase);
  candidates.push("http://localhost:8000");
  candidates.push("http://host.docker.internal:8000");

  const tried: string[] = [];

  try {
    for (const base of candidates) {
      const url = `${base}/api/admin/channels/whatsapp-auth`;
      tried.push(url);
      
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok || res.status >= 400) {
          return NextResponse.json(data, { status: res.status });
        }
      } catch (err) {
        continue;
      }
    }
    throw new Error("No reachable backend URLs");
  } catch (e: any) {
    console.error("Proxy whatsapp-auth error:", e);
    return NextResponse.json(
      { success: false, message: e?.message || "Proxy error", tried },
      { status: 500 }
    );
  }
}