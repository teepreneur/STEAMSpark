import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const gigId = searchParams.get('gig_id')

        if (!gigId) {
            return NextResponse.json({ error: 'gig_id is required' }, { status: 400 })
        }

        // Verify parent has paid for this gig (has an active booking)
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('id, gig:gigs(title)')
            .eq('gig_id', gigId)
            .eq('parent_id', user.id)
            .eq('status', 'accepted')
            .single()

        if (bookingError || !booking) {
            return NextResponse.json(
                { error: 'You do not have access to this course materials. Please enroll first.' },
                { status: 403 }
            )
        }

        // Fetch all file-type materials for this gig
        const { data: materials, error: materialsError } = await supabase
            .from('materials')
            .select('*')
            .eq('gig_id', gigId)
            .eq('material_type', 'file')
            .in('visibility', ['enrolled_students', 'public'])

        if (materialsError) {
            return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
        }

        if (!materials || materials.length === 0) {
            return NextResponse.json({ error: 'No downloadable materials found for this course' }, { status: 404 })
        }

        // Create a ZIP file
        const zip = new JSZip()

        // Download and add each file to the ZIP
        for (const material of materials) {
            try {
                const response = await fetch(material.file_url)
                if (response.ok) {
                    const blob = await response.blob()
                    const arrayBuffer = await blob.arrayBuffer()
                    const fileName = material.file_name || `${material.title}.${material.file_type || 'file'}`
                    zip.file(fileName, arrayBuffer)
                }
            } catch (err) {
                console.error(`Failed to fetch ${material.title}:`, err)
                // Continue with other files
            }
        }

        // Generate the ZIP file
        const zipBlob = await zip.generateAsync({ type: 'arraybuffer' })

        // Get gig title for the filename
        const gigData = booking.gig as unknown as { title: string } | null
        const gigTitle = gigData?.title || 'Course'
        const safeFileName = gigTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 50)

        return new NextResponse(zipBlob, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${safeFileName}_Materials.zip"`,
            },
        })
    } catch (error: any) {
        console.error('Download all error:', error)
        return NextResponse.json({ error: 'Failed to create download' }, { status: 500 })
    }
}
