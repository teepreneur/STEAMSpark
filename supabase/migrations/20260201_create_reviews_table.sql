-- Create reviews table for teacher feedback
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS reviews_teacher_id_idx ON public.reviews(teacher_id);
CREATE INDEX IF NOT EXISTS reviews_parent_id_idx ON public.reviews(parent_id);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Anyone can view reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT USING (true);

-- 2. Parents can only review teachers they have booked with
-- Note: This is a simplified check, ideally we verify the booking status is 'completed'
DROP POLICY IF EXISTS "Parents can create reviews for their teachers" ON public.reviews;
CREATE POLICY "Parents can create reviews for their teachers" ON public.reviews
    FOR INSERT WITH CHECK (
        auth.uid() = parent_id 
        AND EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.parent_id = auth.uid() 
            AND bookings.gig_id IN (
                SELECT id FROM public.gigs WHERE teacher_id = reviews.teacher_id
            )
        )
    );

-- 3. Only the parent who wrote the review can update or delete it
DROP POLICY IF EXISTS "Authors can manage own reviews" ON public.reviews;
CREATE POLICY "Authors can manage own reviews" ON public.reviews
    FOR ALL USING (auth.uid() = parent_id);

-- Add comments
COMMENT ON TABLE public.reviews IS 'Stores parent feedback and ratings for teachers';
COMMENT ON COLUMN public.reviews.rating IS 'Rating score from 1 to 5 stars';
