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

export async function createParentAndStudent(formData: FormData) {
    const email = formData.get("email") as string
    const fullName = formData.get("full_name") as string
    const phoneNumber = formData.get("phone_number") as string
    const country = formData.get("country") as string
    const city = formData.get("city") as string

    if (!email || !fullName) {
        return { error: "Email and Full Name are required." }
    }

    try {
        // 1. Create User in Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: 'ChangeMe123!',
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: 'parent'
            }
        })

        if (authError || !authData.user) {
            return { error: authError?.message || "Failed to create user in Auth" }
        }

        const userId = authData.user.id

        // 2. Process might be slightly delayed if using DB triggers, so we explicitly update the profile
        //    (Just wait a tiny bit or retry, but usually synchronous enough)
        
        let profileUpdated = false;
        for (let i = 0; i < 3; i++) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    full_name: fullName,
                    role: 'parent',
                    phone_number: phoneNumber || null,
                    country: country || null,
                    city: city || null
                })
                .eq('id', userId)
                
            if (!profileError) {
                profileUpdated = true;
                break;
            }
            await new Promise(r => setTimeout(r, 500)); // wait 500ms before retrying
        }

        revalidatePath("/admin/users/parents")
        
        // Generate Onboarding Link
        const onboardingLink = `/onboarding/child?id=${userId}`
        
        return { 
            success: true, 
            userId, 
            email, 
            onboardingLink 
        }

    } catch (e: any) {
        console.error("Action error:", e)
        return { error: e.message || "An unexpected error occurred." }
    }
}

export async function createTeacherProfile(formData: FormData) {
    const email = formData.get("email") as string
    const fullName = formData.get("full_name") as string
    const hourlyRate = formData.get("hourly_rate") as string
    
    // Convert subjects string like "Math, Science" to array
    const subjectsRaw = formData.get("subjects") as string
    const subjects = subjectsRaw ? subjectsRaw.split(',').map(s => s.trim()).filter(Boolean) : []

    if (!email || !fullName) {
        return { error: "Email and Full Name are required." }
    }

    try {
        // 1. Create User in Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: 'ChangeMe123!',
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: 'teacher'
            }
        })

        if (authError || !authData.user) {
            return { error: authError?.message || "Failed to create user in Auth" }
        }

        const userId = authData.user.id

        // 2. Update Profile
        for (let i = 0; i < 3; i++) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    full_name: fullName,
                    role: 'teacher',
                    hourly_rate: hourlyRate ? Number(hourlyRate) : null,
                    subjects: subjects.length > 0 ? subjects : null
                })
                .eq('id', userId)

            if (!profileError) break
            await new Promise(r => setTimeout(r, 500))
        }

        revalidatePath("/admin/users/teachers")
        return { success: true, userId, email }

    } catch (e: any) {
        console.error("Action error:", e)
        return { error: e.message || "An unexpected error occurred." }
    }
}
