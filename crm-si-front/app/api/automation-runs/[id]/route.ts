import { NextRequest } from "next/server"
import { forwardAutomation } from "../../automations/_proxy"
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return forwardAutomation(request, `/api/automation-runs/${(await params).id}`, "GET") }
