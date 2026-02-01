export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]


export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    role: 'teacher' | 'parent' | null
                    full_name: string | null
                    avatar_url: string | null
                    bio: string | null
                    subjects: string[] | null
                    hourly_rate: number | null
                    created_at: string
                    class_mode: 'online' | 'in_person' | 'hybrid' | null
                    country: string | null
                    city: string | null
                    cv_url: string | null
                    id_url: string | null
                    photo_url: string | null
                }
                Insert: {
                    id: string
                    email?: string | null
                    role?: 'teacher' | 'parent' | null
                    full_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    subjects?: string[] | null
                    hourly_rate?: number | null
                    created_at?: string
                    class_mode?: 'online' | 'in_person' | 'hybrid' | null
                    country?: string | null
                    city?: string | null
                    cv_url?: string | null
                    id_url?: string | null
                    photo_url?: string | null
                }
                Update: {
                    id?: string
                    email?: string | null
                    role?: 'teacher' | 'parent' | null
                    full_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    subjects?: string[] | null
                    hourly_rate?: number | null
                    created_at?: string
                    class_mode?: 'online' | 'in_person' | 'hybrid' | null
                    country?: string | null
                    city?: string | null
                    cv_url?: string | null
                    id_url?: string | null
                    photo_url?: string | null
                }
            }
            students: {
                Row: {
                    id: string
                    parent_id: string
                    name: string
                    age: number | null
                    grade: string | null
                    avatar_url: string | null
                    learning_goals: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    parent_id: string
                    name: string
                    age?: number | null
                    grade?: string | null
                    avatar_url?: string | null
                    learning_goals?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    parent_id?: string
                    name?: string
                    age?: number | null
                    grade?: string | null
                    avatar_url?: string | null
                    learning_goals?: string | null
                    created_at?: string
                }
            }
            gigs: {
                Row: {
                    id: string
                    teacher_id: string
                    title: string
                    description: string | null
                    price: number
                    duration: number | null
                    subject: string | null
                    status: 'active' | 'draft' | 'archived' | null
                    total_sessions: number | null
                    session_duration: number | null
                    max_students: number | null
                    cover_image: string | null
                    requirements: Json | null
                    topics: Json | null
                    class_type: string | null
                    meeting_platform: string | null
                    meeting_link: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    teacher_id: string
                    title: string
                    description?: string | null
                    price: number
                    duration?: number | null
                    subject?: string | null
                    status?: 'active' | 'draft' | 'archived' | null
                    total_sessions?: number | null
                    session_duration?: number | null
                    max_students?: number | null
                    cover_image?: string | null
                    requirements?: Json | null
                    topics?: Json | null
                    class_type?: string | null
                    meeting_platform?: string | null
                    meeting_link?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    teacher_id?: string
                    title?: string
                    description?: string | null
                    price?: number
                    duration?: number | null
                    subject?: string | null
                    status?: 'active' | 'draft' | 'archived' | null
                    total_sessions?: number | null
                    session_duration?: number | null
                    max_students?: number | null
                    cover_image?: string | null
                    requirements?: Json | null
                    topics?: Json | null
                    class_type?: string | null
                    meeting_platform?: string | null
                    meeting_link?: string | null
                    created_at?: string
                }
            }
            bookings: {
                Row: {
                    id: string
                    gig_id: string
                    student_id: string
                    parent_id: string
                    status: 'pending' | 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | null
                    scheduled_at: string
                    session_date: string | null
                    preferred_days: string[] | null
                    preferred_time: string | null
                    total_sessions: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    gig_id: string
                    student_id: string
                    parent_id: string
                    status?: 'pending' | 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | null
                    scheduled_at?: string
                    session_date?: string | null
                    preferred_days?: string[] | null
                    preferred_time?: string | null
                    total_sessions?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    gig_id?: string
                    student_id?: string
                    parent_id?: string
                    status?: 'pending' | 'pending_payment' | 'confirmed' | 'completed' | 'cancelled' | null
                    scheduled_at?: string
                    session_date?: string | null
                    preferred_days?: string[] | null
                    preferred_time?: string | null
                    total_sessions?: number | null
                    created_at?: string
                }
            }
            teacher_availability: {
                Row: {
                    id: string
                    teacher_id: string
                    day_of_week: number
                    start_time: string
                    end_time: string
                    is_available: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    teacher_id: string
                    day_of_week: number
                    start_time?: string
                    end_time?: string
                    is_available?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    teacher_id?: string
                    day_of_week?: number
                    start_time?: string
                    end_time?: string
                    is_available?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            booking_sessions: {
                Row: {
                    id: string
                    booking_id: string
                    session_date: string
                    session_time: string
                    session_number: number
                    status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
                    created_at: string
                }
                Insert: {
                    id?: string
                    booking_id: string
                    session_date: string
                    session_time: string
                    session_number: number
                    status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
                    created_at?: string
                }
                Update: {
                    id?: string
                    booking_id?: string
                    session_date?: string
                    session_time?: string
                    session_number?: number
                    status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
                    created_at?: string
                }
            }
            conversations: {
                Row: {
                    id: string
                    teacher_id: string
                    parent_id: string
                    last_message_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    teacher_id: string
                    parent_id: string
                    last_message_at?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    teacher_id?: string
                    parent_id?: string
                    last_message_at?: string
                    created_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    conversation_id?: string
                    sender_id?: string
                    content?: string
                    is_read?: boolean
                    created_at?: string
                }
            }
            reviews: {
                Row: {
                    id: string
                    teacher_id: string
                    parent_id: string
                    booking_id: string | null
                    rating: number
                    content: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    teacher_id: string
                    parent_id: string
                    booking_id?: string | null
                    rating: number
                    content?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    teacher_id?: string
                    parent_id?: string
                    booking_id?: string | null
                    rating?: number
                    content?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
