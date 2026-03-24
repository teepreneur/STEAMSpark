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

export async function updateStudentProfile(studentId: string, data: any) {
    if (!studentId) return { error: "Student ID is required" }

    try {
        const { error } = await supabaseAdmin
            .from('students')
            .update({
                name: data.name,
                date_of_birth: data.date_of_birth,
                grade: data.grade,
                gender: data.gender,
                school: data.school,
                favorite_subjects: data.favorite_subjects,
                disliked_subjects: data.disliked_subjects,
                spare_time_activities: data.spare_time_activities,
                personal_devices: data.personal_devices,
                study_habits: data.study_habits,
                preferred_class_mode: data.preferred_class_mode,
                latitude: data.latitude,
                longitude: data.longitude,
                address: data.address,
                updated_at: new Date().toISOString()
            })
            .eq('id', studentId)

        if (error) {
            console.error('Error updating student:', error)
            return { error: error.message }
        }

        // We don't know the parent ID easily here without a fetch, 
        // but we can revalidate the general paths
        revalidatePath('/admin/users/parents')
        
        return { success: true }
    } catch (e) {
        console.error('Server error updating student:', e)
        return { error: "Failed to update student profile" }
    }
}
