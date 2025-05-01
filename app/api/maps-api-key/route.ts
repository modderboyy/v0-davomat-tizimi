import { NextResponse } from "next/server"

export async function GET() {
  // This is a placeholder route that would normally return the API key
  // In a real implementation, you would implement proper authentication
  // to ensure only authorized users can access this endpoint

  return NextResponse.json(
    {
      message:
        "For security reasons, the Google Maps API key should be used only in server components or server actions",
    },
    { status: 403 },
  )
}
