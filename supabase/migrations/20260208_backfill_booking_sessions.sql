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
DO $$
DECLARE
    booking_record RECORD;
    session_count INTEGER;
    current_date_val DATE;
    session_num INTEGER;
    day_names TEXT[] := ARRAY['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    day_index INTEGER;
BEGIN
    -- Loop through all confirmed/paid bookings that don't have sessions
    FOR booking_record IN 
        SELECT b.*
        FROM bookings b
        LEFT JOIN booking_sessions bs ON b.id = bs.booking_id
        WHERE (b.status = 'confirmed' OR b.payment_status = 'paid')
        AND bs.booking_id IS NULL -- Check if NO sessions exist for this booking
    LOOP
        RAISE NOTICE 'Processing booking: %', booking_record.id;
        
        -- Start from the booking's scheduled date or today if missing
        current_date_val := COALESCE(booking_record.session_date::date, booking_record.scheduled_at::date, CURRENT_DATE);
        session_num := 1;
        
        -- Get total sessions (default to 4 if not set)
        session_count := COALESCE(booking_record.total_sessions, 4);
        
        -- Generate sessions
        WHILE session_num <= session_count LOOP
            -- Check if current day matches one of the preferred days
            IF booking_record.preferred_days IS NOT NULL AND array_length(booking_record.preferred_days, 1) > 0 THEN
                -- Get the name of the current day (1-based index for array)
                day_index := EXTRACT(DOW FROM current_date_val)::int;
                
                -- Check if this day is in the preferred days
                IF day_names[day_index + 1] = ANY(booking_record.preferred_days) THEN
                    -- Insert session
                    INSERT INTO booking_sessions (
                        booking_id,
                        session_date,
                        session_time,
                        session_number,
                        status
                    ) VALUES (
                        booking_record.id,
                        current_date_val,
                        COALESCE(booking_record.preferred_time::time, '10:00'::time),
                        session_num,
                        'confirmed'
                    );
                    
                    RAISE NOTICE 'Created session % for booking % on % (Preferred Day)', session_num, booking_record.id, current_date_val;
                    session_num := session_num + 1;
                END IF;
                
                -- Move to next day to check for next match
                current_date_val := current_date_val + 1;
                
            ELSE
                -- No preferred days, just create sessions weekly from start date
                INSERT INTO booking_sessions (
                    booking_id,
                    session_date,
                    session_time,
                    session_number,
                    status
                ) VALUES (
                    booking_record.id,
                    current_date_val,
                    COALESCE(booking_record.preferred_time::time, '10:00'::time),
                    session_num,
                    'confirmed'
                );
                
                RAISE NOTICE 'Created session % for booking % on % (Weekly)', session_num, booking_record.id, current_date_val;
                session_num := session_num + 1;
                
                -- Skip to next week
                current_date_val := current_date_val + 7;
            END IF;
            
            -- Safety: don't go more than 1 year into the future
            IF current_date_val > CURRENT_DATE + 365 THEN
                RAISE NOTICE 'Reached date limit for booking %', booking_record.id;
                EXIT;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Verify sessions were created
SELECT 
    bs.id,
    bs.session_date,
    bs.session_number,
    bs.status,
    b.id as booking_id
FROM booking_sessions bs
JOIN bookings b ON bs.booking_id = b.id
WHERE b.status = 'confirmed'
ORDER BY bs.booking_id, bs.session_number;
