import { NextResponse } from "next/server"
import { emailService } from "@/lib/email-service"

/**
 * Test endpoint to send a thank you email
 * Usage: POST /api/test-email with { email: "your@email.com" }
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email address required" },
        { status: 400 }
      )
    }

    console.log(`🔄 Sending test thank you email to ${email}`)

    const result = await emailService.sendThankYouEmail({
      customerEmail: email,
      customerName: "Test User",
      sessionId: "test_session_123",
      amount: 2900,
      currency: "usd",
    })

    if (result.success) {
      console.log(`✅ Test email sent successfully to ${email}`)
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${email}`,
        emailId: result.id,
      })
    } else {
      console.error(`❌ Failed to send test email:`, result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error in test-email endpoint:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
