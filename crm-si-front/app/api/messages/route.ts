import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

function sanitizeBackendError(payload: any) {
  return {
    message: typeof payload?.message === "string" ? payload.message : undefined,
    error: typeof payload?.error === "string" ? payload.error : undefined,
    code: typeof payload?.code === "string" || typeof payload?.code === "number" ? payload.code : undefined,
  };
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ message: "No authorization token provided" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  const publicBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const internalBase = (process.env.API_INTERNAL_URL || "").replace(/\/$/, "");
  const bases = [internalBase, publicBase, "http://localhost:8000", "http://host.docker.internal:8000"].filter(Boolean);

  // Read body once before the retry loop (streams can only be consumed once)
  let fetchBody: FormData | string;
  let requestMeta: Record<string, unknown> = {};
  const headers: Record<string, string> = {
    "Authorization": authHeader,
    "Accept": "application/json",
  };

  if (isMultipart) {
    fetchBody = await req.formData();
    requestMeta = {
      conversationId: fetchBody.get("conversation_id"),
      type: fetchBody.get("type"),
      hasImage: fetchBody.has("image"),
      hasAudio: fetchBody.has("audio"),
    };
  } else {
    const jsonBody = await req.json();
    fetchBody = JSON.stringify(jsonBody);
    requestMeta = {
      conversationId: jsonBody?.conversation_id,
      type: jsonBody?.type,
      contentLength: typeof jsonBody?.content === "string" ? jsonBody.content.length : undefined,
    };
    headers["Content-Type"] = "application/json";
  }

  for (const base of bases) {
    try {
      const url = `${base}/api/messages`;
      const res = await fetch(url, { method: "POST", headers, body: fetchBody });
      const data = await res.json().catch(() => ({}));
      if (res.ok || res.status >= 400) {
        if (!res.ok) {
          Sentry.captureMessage("message_send_backend_failed", {
            level: res.status >= 500 ? "error" : "warning",
            tags: {
              feature: "chats",
              action: "send_message",
              backend_status: String(res.status),
            },
            extra: {
              backendBase: base,
              backendError: sanitizeBackendError(data),
              request: requestMeta,
            },
          });
        }

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
