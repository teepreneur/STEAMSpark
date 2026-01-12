-- Fix RLS for gigs, bookings, payments, and students

-- 1. Gigs
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view gigs" ON public.gigs;
CREATE POLICY "Anyone can view gigs" ON public.gigs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Teachers can manage own gigs" ON public.gigs;
CREATE POLICY "Teachers can manage own gigs" ON public.gigs
    FOR ALL USING (teacher_id = auth.uid());


-- 2. Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (
        auth.uid() = parent_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.gigs 
            WHERE gigs.id = bookings.gig_id 
            AND gigs.teacher_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can create bookings" ON public.bookings;
CREATE POLICY "Parents can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = parent_id);

DROP POLICY IF EXISTS "Participants can update bookings" ON public.bookings;
CREATE POLICY "Participants can update bookings" ON public.bookings
    FOR UPDATE USING (
        auth.uid() = parent_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.gigs 
            WHERE gigs.id = bookings.gig_id 
            AND gigs.teacher_id = auth.uid()
        )
    );


-- 3. Students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can manage own students" ON public.students;
CREATE POLICY "Parents can manage own students" ON public.students
    FOR ALL USING (parent_id = auth.uid());


-- 4. Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view own payments" ON public.payments;
CREATE POLICY "Parents can view own payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = payments.booking_id 
            AND bookings.parent_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Parents can insert own payments" ON public.payments;
CREATE POLICY "Parents can insert own payments" ON public.payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = payments.booking_id 
            AND bookings.parent_id = auth.uid()
        )
    );
