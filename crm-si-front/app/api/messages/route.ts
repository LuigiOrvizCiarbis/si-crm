import { NextRequest, NextResponse } from "next/server";
import { proxyResponse, proxyToLaravel } from "@/lib/api/proxy-helper";

function resolveBackendBases() {
  const stripSlash = (url?: string) => (url || "").replace(/\/$/, "");

  return [
    stripSlash(process.env.API_INTERNAL_URL),
    stripSlash(process.env.NEXT_PUBLIC_API_URL),
    "http://localhost:8000",
    "http://host.docker.internal:8000",
  ].filter(Boolean);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ message: "No authorization token provided" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  // Read body once before the retry loop (streams can only be consumed once)
  let fetchBody: FormData | string;
  let requestMeta: Record<string, unknown> = {};
  const headers: Record<string, string> = {};

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

  const { data, status } = await proxyToLaravel("/api/messages", authHeader, {
    method: "POST",
    body: fetchBody,
    headers,
    rawBody: isMultipart,
    baseUrls: resolveBackendBases(),
    observability: {
      responseErrorName: "message_send_backend_failed",
      connectionErrorName: "message_send_backend_connection_failed",
      feature: "chats",
      action: "send_message",
      requestMeta,
    },
  });

  return proxyResponse(data, status);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ message: "No authorization token provided" }, { status: 401 });
  }

  const { data, status } = await proxyToLaravel("/api/messages", authHeader, {
    method: "GET",
    baseUrls: resolveBackendBases(),
    observability: {
      feature: "chats",
      action: "list_messages",
    },
  });

  return proxyResponse(data, status);
}
