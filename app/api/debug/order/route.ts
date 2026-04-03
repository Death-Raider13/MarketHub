import { NextRequest, NextResponse } from "next/server"
import { devOnlyGuard } from '@/lib/api-auth'

// Simple debug endpoint to verify API routing is working.
// Gated to development only.

export async function GET(_request: NextRequest) {
  const blocked = devOnlyGuard()
  if (blocked) return blocked

  return NextResponse.json({
    ok: true,
    message: "Debug order endpoint is reachable",
  })
}
