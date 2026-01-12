-- Add location and class mode preferences for in-person sessions

-- Class mode preference for profiles (what type of classes user wants/offers)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class_mode TEXT DEFAULT 'online';
-- Values: 'online' | 'in_person' | 'hybrid'

-- General location (city-level, for matching - not exact address)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;

-- Booking-specific: exact location for in-person sessions
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_location_address TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_location_lat DECIMAL(10, 8);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_location_lng DECIMAL(11, 8);

-- Add comments for documentation
COMMENT ON COLUMN profiles.class_mode IS 'Preferred class mode: online, in_person, or hybrid';
COMMENT ON COLUMN profiles.country IS 'Country for location-based matching';
COMMENT ON COLUMN profiles.city IS 'City/town for location-based matching';
COMMENT ON COLUMN bookings.session_location_address IS 'Exact address for in-person sessions';
