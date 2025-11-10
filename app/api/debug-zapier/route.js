// app/api/debug-zapier/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const requestBody = await req.json();
    
    // Return exactly what we received for debugging
    return NextResponse.json({
      success: true,
      message: "Debug endpoint - showing what Zapier sent",
      receivedData: requestBody,
      dataType: typeof requestBody,
      keys: Object.keys(requestBody),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({
      error: "Failed to parse JSON",
      message: err.message,
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}

export async function GET(req) {
  return NextResponse.json({
    message: "Debug endpoint is working. Use POST to see what data is being sent.",
    timestamp: new Date().toISOString()
  });
}
















