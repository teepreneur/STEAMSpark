import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client for creating notifications
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const { recipientId, senderName, messagePreview, conversationId, senderRole } = await request.json()

        if (!recipientId || !senderName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Determine action URL based on who is receiving (opposite of sender's role)
        // If parent sends, teacher receives -> teacher messages URL
        // If teacher sends, parent receives -> parent messages URL
        const actionUrl = senderRole === 'parent' ? '/teacher/messages' : '/parent/messages'

        // Create in-app notification
        const { error } = await supabaseAdmin.from('notifications').insert({
            user_id: recipientId,
            type: 'new_message',
            title: 'New Message',
            message: `${senderName}: "${messagePreview?.slice(0, 50)}${messagePreview?.length > 50 ? '...' : ''}"`,
            read: false,
            action_url: actionUrl
        })

        if (error) {
            console.error('[Notification] Insert error:', error)
            return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
        }

        console.log(`[Notification] New message notification sent to ${recipientId} from ${senderName}`)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Notification error:', error)
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
    }
}
