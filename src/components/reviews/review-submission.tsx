"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface ReviewSubmissionProps {
    teacherId: string
    bookingId?: string
    teacherName: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function ReviewSubmission({
    teacherId,
    bookingId,
    teacherName,
    isOpen,
    onOpenChange,
    onSuccess
}: ReviewSubmissionProps) {
    const supabase = createClient()
    const [rating, setRating] = useState(0)
    const [hoveredRating, setHoveredRating] = useState(0)
    const [content, setContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (rating === 0) return

        setIsSubmitting(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    teacher_id: teacherId,
                    parent_id: user.id,
                    booking_id: bookingId,
                    rating,
                    content
                })

            if (error) throw error

            onOpenChange(false)
            if (onSuccess) onSuccess()
            // Reset form
            setRating(0)
            setContent("")
        } catch (error: any) {
            alert(`Failed to submit review: ${error.message}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Share Your Experience</DialogTitle>
                        <DialogDescription>
                            How was your session with <strong>{teacherName}</strong>? Your feedback helps the community.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-sm font-medium text-muted-foreground">Rate your experience</span>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className="p-1 transition-transform active:scale-90"
                                        onMouseEnter={() => setHoveredRating(star)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        onClick={() => setRating(star)}
                                    >
                                        <Star
                                            className={cn(
                                                "size-8 transition-colors",
                                                (hoveredRating || rating) >= star
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-muted-foreground/30"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                            {rating > 0 && (
                                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                                    {rating === 1 ? "Poor" : rating === 2 ? "Fair" : rating === 3 ? "Good" : rating === 4 ? "Very Good" : "Excellent"}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <span className="text-sm font-medium text-muted-foreground">What did you like (or what could be improved)?</span>
                            <Textarea
                                placeholder="Write your review here..."
                                className="min-h-[100px] resize-none border-muted focus-visible:ring-primary/20"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || rating === 0}
                            className="gap-2 font-bold px-8"
                        >
                            {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Submitting...</> : "Submit Review"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
