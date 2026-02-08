import { createClient } from "@/lib/supabase/server"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { GigsList } from "./_components/gigs-list"

export default async function MyGigsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Please log in to view your gigs.</div>
    }

    let query = supabase.from('gigs').select('*').eq('teacher_id', user.id)

    const { data: gigs, error } = await query

    if (error) {
        console.error("Error fetching gigs:", error)
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Page Heading & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] text-foreground">My Gigs</h1>
                    <p className="text-muted-foreground text-base font-normal">Manage, promote, and track your STEAM teaching portfolio.</p>
                </div>
                <Link href="/teacher/gigs/new">
                    <Button className="font-bold gap-2 shadow-lg" size="lg">
                        <PlusCircle className="size-5" /> Create New Gig
                    </Button>
                </Link>
            </div>

            <GigsList initialGigs={gigs || []} />
        </div>
    )
}

