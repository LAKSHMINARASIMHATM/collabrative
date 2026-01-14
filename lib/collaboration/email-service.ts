/**
 * Email Service for Collaboration Invitations
 * Sends invitation emails to collaborators
 */

interface EmailInvitation {
    to: string
    sessionId: string
    senderName: string
    senderEmail: string
}

export async function sendCollaborationInvite(invitation: EmailInvitation): Promise<boolean> {
    try {
        // In production, this would call your backend API
        // For now, we'll use a mailto fallback with better formatting

        const collaborationLink = `${window.location.origin}/collaborate/${invitation.sessionId}`

        const subject = `${invitation.senderName} invited you to collaborate`

        const body = `Hi there!

${invitation.senderName} (${invitation.senderEmail}) has invited you to join a real-time coding collaboration session.

🔗 Join the session:
${collaborationLink}

What you can do:
• Edit code together in real-time
• See each other's cursors and selections
• Chat and communicate
• Share your screen

Click the link above to start collaborating!

---
This invitation was sent from Real-Time Code Editor
`

        // Try to send via backend API first
        const response = await fetch('/api/send-invite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: invitation.to,
                subject,
                body,
                link: collaborationLink,
                senderName: invitation.senderName,
            }),
        })

        if (response.ok) {
            return true
        }

        // Fallback to mailto if API fails
        const mailtoLink = `mailto:${invitation.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
        window.open(mailtoLink, '_blank')

        return true
    } catch (error) {
        console.error('Failed to send invitation:', error)

        // Last resort: copy link and show instructions
        const collaborationLink = `${window.location.origin}/collaborate/${invitation.sessionId}`
        await navigator.clipboard.writeText(collaborationLink)

        throw new Error('Could not send email. Link copied to clipboard - please share it manually.')
    }
}

export async function sendCollaborationLink(email: string, sessionId: string, userName: string, userEmail: string): Promise<void> {
    await sendCollaborationInvite({
        to: email,
        sessionId,
        senderName: userName,
        senderEmail: userEmail,
    })
}
