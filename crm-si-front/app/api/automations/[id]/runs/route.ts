import { NextRequest } from "next/server"
import { forwardAutomation } from "../../_proxy"
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return forwardAutomation(request, `/api/automations/${(await params).id}/runs${request.nextUrl.search}`, "GET") }
