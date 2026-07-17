import { NextRequest } from "next/server"
import { forwardAutomation } from "../_proxy"

type Context = { params: Promise<{ id: string }> }
export const dynamic = "force-dynamic"
export async function GET(request: NextRequest, { params }: Context) { return forwardAutomation(request, `/api/automations/${(await params).id}`, "GET") }
export async function PUT(request: NextRequest, { params }: Context) { return forwardAutomation(request, `/api/automations/${(await params).id}`, "PUT") }
export async function DELETE(request: NextRequest, { params }: Context) { return forwardAutomation(request, `/api/automations/${(await params).id}`, "DELETE") }
