/**
 * API Route for Sending Collaboration Invitations
 * Handles email sending via backend service
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body, link, senderName } = await request.json()

    // Validate inputs
    if (!to || !subject || !link) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // In production, integrate with your email service:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Resend
    // - Postmark

    // Resend Integration
    const { Resend } = require('resend')

    // Use environment variable or fallback for testing (will fail without key)
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not found. Email will not be sent.')
      // Return success for UI feedback even if no key (dev mode)
      return NextResponse.json({
        success: true,
        message: 'Invitation simulation (Set RESEND_API_KEY to send real emails)',
      })
    }

    const resend = new Resend(resendApiKey)

    const { data, error } = await resend.emails.send({
      from: 'Collaboration <onboarding@resend.dev>', // Default Resend testing email
      to: [to],
      subject: subject,
      html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You're invited to collaborate!</h2>
              <p><strong>${senderName}</strong> has invited you to join a real-time coding session.</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <a href="${link}" style="background: #000000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Join Session
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Or copy this link: <br/>
                <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; display: block; margin-top: 5px; word-break: break-all;">${link}</code>
              </p>
              
              <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
              
              <p style="color: #999; font-size: 12px; text-align: center;">
                Powered by Real-Time Code Editor
              </p>
            </div>
          `,
    })

    if (error) {
      console.error('Resend API error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.log('Email sent via Resend:', data)


    // For now, return success (email would be sent in production)
    console.log('Email invitation:', { to, subject, link })

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
    })
  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
