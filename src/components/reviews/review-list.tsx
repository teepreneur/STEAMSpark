"use client"

import { Star, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export interface Review {
    id: string
    rating: number
    content: string | null
    created_at: string
    profiles?: {
        full_name: string
        avatar_url: string | null
    }
}

interface ReviewListProps {
    reviews: Review[]
    loading?: boolean
}

export function ReviewList({ reviews, loading }: ReviewListProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse flex gap-4 p-4 border rounded-xl">
                        <div className="size-10 rounded-full bg-muted shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/4" />
                            <div className="h-3 bg-muted rounded w-full" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-10 bg-muted/20 border-2 border-dashed rounded-2xl">
                <p className="text-muted-foreground">No reviews yet.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div key={review.id} className="p-5 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                {review.profiles?.avatar_url ? (
                                    <img
                                        src={review.profiles.avatar_url}
                                        alt={review.profiles.full_name}
                                        className="size-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="size-5 text-primary" />
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm leading-none mb-1">
                                    {review.profiles?.full_name || "Parent"}
                                </h4>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={cn(
                                                "size-3",
                                                review.rating >= star ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"
                                            )}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </span>
                    </div>
                    {review.content && (
                        <p className="text-sm text-foreground/80 leading-relaxed italic">
                            "{review.content}"
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}
