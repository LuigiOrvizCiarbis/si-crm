import { NextRequest } from "next/server"
import { forwardAutomation } from "./_proxy"

export const dynamic = "force-dynamic"
export const GET = (request: NextRequest) => forwardAutomation(request, `/api/automations${request.nextUrl.search}`, "GET")
export const POST = (request: NextRequest) => forwardAutomation(request, "/api/automations", "POST")
