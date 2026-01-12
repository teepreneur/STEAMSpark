import { createClient } from "@/lib/supabase/server"
import TutorsList from "./_components/tutors-list"

export default async function FindTutorsPage() {
    const supabase = await createClient()

    // Fetch current user's profile for location-based matching
    const { data: { user } } = await supabase.auth.getUser()
    let parentLocation: { country: string | null; city: string | null; class_mode: string | null } = {
        country: null,
        city: null,
        class_mode: null
    }

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('country, city, class_mode')
            .eq('id', user.id)
            .single()

        if (profile) {
            parentLocation = {
                country: (profile as any).country || null,
                city: (profile as any).city || null,
                class_mode: (profile as any).class_mode || null
            }
        }
    }

    // Fetch active gigs with teacher details
    const { data: gigs, error } = await supabase
        .from('gigs')
        .select('*, teacher:profiles(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching gigs:", error)
        return <div>Error loading classes. Please try again later.</div>
    }

    return (
        <TutorsList initialGigs={gigs || []} parentLocation={parentLocation} />
    )
}
