import { NextRequest, NextResponse } from "next/server"

// Simple debug endpoint to verify API routing is working in production.
// Not used by normal application flow.

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    ok: true,
    message: "Debug order endpoint is reachable",
  })
}

