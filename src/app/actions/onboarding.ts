"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

import { calculateAge } from "@/lib/utils"

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

export async function createChildProfile(formData: FormData) {
    const parentId = formData.get("parent_id") as string
    const name = formData.get("name") as string
    const dob = formData.get("dob") as string
    const grade = formData.get("grade") as string
    const primaryGoal = formData.get("primary_goal") as string
    const goals = formData.get("goals") as string
    
    // New fields
    const gender = formData.get("gender") as string
    const school = formData.get("school") as string
    const favoriteSubjects = formData.getAll("favorite_subjects") as string[]
    const dislikedSubjects = formData.getAll("disliked_subjects") as string[]
    const spareTimeActivities = formData.get("spare_time_activities") as string
    const personalDevices = formData.getAll("personal_devices") as string[]
    const studyHabits = formData.get("study_habits") as string
    
    // Calculate age from DOB to maintain the legacy field
    const age = dob ? calculateAge(dob) : null

    // Interests is an array from the form
    const interests = formData.getAll("interests") as string[]

    if (!parentId || !name) {
        return { error: "Parent ID and Child Name are required." }
    }

    try {
        // 1. Verify parent exists
        const { data: parent, error: parentError } = await supabaseAdmin
            .from('profiles')
            .select('full_name')
            .eq('id', parentId)
            .single()

        if (parentError || !parent) {
            return { error: "Invalid onboarding link. Parent account not found." }
        }

        // 2. Create Student record
        const { error: studentError } = await supabaseAdmin
            .from('students')
            .insert({
                parent_id: parentId,
                name,
                age,
                date_of_birth: dob || null,
                grade: grade || null,
                interests: interests.length > 0 ? interests : null,
                primary_goal: primaryGoal || null,
                learning_goals: goals || null,
                gender: gender || null,
                school: school || null,
                favorite_subjects: favoriteSubjects.length > 0 ? favoriteSubjects : null,
                disliked_subjects: dislikedSubjects.length > 0 ? dislikedSubjects : null,
                spare_time_activities: spareTimeActivities || null,
                personal_devices: personalDevices.length > 0 ? personalDevices : null,
                study_habits: studyHabits || null
            })

        if (studentError) {
            return { error: "Failed to save child profile: " + studentError.message }
        }

        return { success: true }

    } catch (error) {
        console.error('Error creating child profile:', error)
        return { error: 'Failed to create profile. Please try again.' }
    }
}

export async function verifyOnboardingLink(parentId: string) {
    if (!parentId) return { error: "Missing ID" }

    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('full_name')
            .eq('id', parentId)
            .single()

        if (error || !data) {
            return { error: "Invalid or expired onboarding link." }
        }

        return { full_name: data.full_name }
    } catch (e) {
        return { error: "Server error verifying link." }
    }
}
