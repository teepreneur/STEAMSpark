-- Backfill booking_sessions from confirmed bookings
-- This script creates individual session records for all bookings that don't have sessions yet

-- First, let's see what confirmed bookings exist and their schedule info
SELECT 
    id,
    status,
    payment_status,
    session_date as start_date,
    preferred_days,
    preferred_time,
    total_sessions
FROM bookings 
WHERE status = 'confirmed' OR payment_status = 'paid'
ORDER BY created_at DESC;

-- Run this function to generate sessions for bookings missing them
-- This is a DO block that will create sessions based on the booking's preferred schedule

DO $$
DECLARE
    booking RECORD;
    session_count INTEGER;
    current_date_val DATE;
    session_num INTEGER;
    day_names TEXT[] := ARRAY['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    preferred_day TEXT;
    day_index INTEGER;
BEGIN
    -- Loop through all confirmed/paid bookings that don't have sessions
    FOR booking IN 
        SELECT b.*
        FROM bookings b
        LEFT JOIN booking_sessions bs ON b.id = bs.booking_id
        WHERE (b.status = 'confirmed' OR b.payment_status = 'paid')
        AND bs.id IS NULL
    LOOP
        RAISE NOTICE 'Processing booking: %', booking.id;
        
        -- Start from the booking's scheduled date
        current_date_val := COALESCE(booking.session_date::date, booking.scheduled_at::date, CURRENT_DATE);
        session_num := 1;
        
        -- Get total sessions (default to 4 if not set)
        session_count := COALESCE(booking.total_sessions, 4);
        
        -- Generate sessions
        WHILE session_num <= session_count LOOP
            -- Check if current day matches one of the preferred days
            IF booking.preferred_days IS NOT NULL AND array_length(booking.preferred_days, 1) > 0 THEN
                -- Get the name of the current day
                day_index := EXTRACT(DOW FROM current_date_val)::int;
                
                -- Check if this day is in the preferred days
                IF day_names[day_index + 1] = ANY(booking.preferred_days) THEN
                    -- Insert session
                    INSERT INTO booking_sessions (
                        booking_id,
                        session_date,
                        session_time,
                        session_number,
                        status
                    ) VALUES (
                        booking.id,
                        current_date_val,
                        COALESCE(booking.preferred_time::time, '10:00'::time),
                        session_num,
                        'confirmed'
                    );
                    
                    RAISE NOTICE 'Created session % for booking % on %', session_num, booking.id, current_date_val;
                    session_num := session_num + 1;
                END IF;
            ELSE
                -- No preferred days, just create sessions weekly from start date
                INSERT INTO booking_sessions (
                    booking_id,
                    session_date,
                    session_time,
                    session_number,
                    status
                ) VALUES (
                    booking.id,
                    current_date_val,
                    COALESCE(booking.preferred_time::time, '10:00'::time),
                    session_num,
                    'confirmed'
                );
                
                RAISE NOTICE 'Created session % for booking % on %', session_num, booking.id, current_date_val;
                session_num := session_num + 1;
                
                -- Skip to next week
                current_date_val := current_date_val + 7;
            END IF;
            
            -- Move to next day
            current_date_val := current_date_val + 1;
            
            -- Safety: don't go more than 1 year into the future
            IF current_date_val > CURRENT_DATE + 365 THEN
                RAISE NOTICE 'Reached date limit for booking %', booking.id;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Verify sessions were created
SELECT 
    bs.*,
    b.status as booking_status,
    g.title as gig_title
FROM booking_sessions bs
JOIN bookings b ON bs.booking_id = b.id
JOIN gigs g ON b.gig_id = g.id
ORDER BY bs.session_date;
