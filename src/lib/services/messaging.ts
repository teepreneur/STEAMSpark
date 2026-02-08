
import { SupabaseClient } from "@supabase/supabase-js"

export async function getOrCreateConversation(
    supabase: SupabaseClient,
    teacherId: string,
    parentId: string
) {
    // 1. Check if conversation already exists
    const { data: existing } = await supabase
        .from('conversations')
        .select(`
            id,
            teacher_id,
            parent_id,
            last_message_at
        `)
        .eq('teacher_id', teacherId)
        .eq('parent_id', parentId)
        .maybeSingle()

    if (existing) {
        return { data: existing, error: null, isNew: false }
    }

    // 2. Create new conversation
    const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({ teacher_id: teacherId, parent_id: parentId })
        .select()
        .single()

    return { data: newConvo, error, isNew: true }
}
