import { redirect } from "next/navigation"

interface ParentTutorProfileProps {
    params: Promise<{ id: string }>
}

/**
 * Parent-specific tutor profile route.
 * This redirects to the main tutor profile page to avoid duplication.
 * The main profile at /tutor/[id] is accessible to all users.
 */
export default async function ParentTutorProfileRedirect({ params }: ParentTutorProfileProps) {
    const { id } = await params
    redirect(`/tutor/${id}`)
}
