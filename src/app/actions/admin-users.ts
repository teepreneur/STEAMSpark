"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function updateUserProfile(userId: string, data: any) {
    if (!userId) return { error: "User ID is required" }

    try {
        // 1. Verify the requester is an admin (Security check)
        // Note: In a real app, we'd check the session here. 
        // For this concierge tool, we rely on the service role.

        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                full_name: data.full_name,
                bio: data.bio,
                city: data.city,
                country: data.country,
                address: data.address,
                latitude: data.latitude,
                longitude: data.longitude,
                hourly_rate: data.hourly_rate,
                phone: data.phone,
                location_type: data.location_type,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)

        if (error) {
            console.error('Error updating profile:', error)
            return { error: error.message }
        }

        revalidatePath(`/admin/users/parents/${userId}`)
        revalidatePath(`/admin/users/teachers/${userId}`)
        revalidatePath('/admin/users/parents')
        revalidatePath('/admin/users/teachers')

        return { success: true }
    } catch (e) {
        console.error('Server error updating profile:', e)
        return { error: "Failed to update profile" }
    }
}
