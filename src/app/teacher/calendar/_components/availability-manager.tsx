"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Clock, Save, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface DayAvailability {
    day_of_week: number
    is_available: boolean
    start_time: string
    end_time: string
}

const DAYS = [
    { value: 0, label: "Sunday", short: "Sun" },
    { value: 1, label: "Monday", short: "Mon" },
    { value: 2, label: "Tuesday", short: "Tue" },
    { value: 3, label: "Wednesday", short: "Wed" },
    { value: 4, label: "Thursday", short: "Thu" },
    { value: 5, label: "Friday", short: "Fri" },
    { value: 6, label: "Saturday", short: "Sat" },
]

const TIME_OPTIONS = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
]

function formatTime(time: string): string {
    const [hours] = time.split(':')
    const h = parseInt(hours)
    if (h === 0) return "12 AM"
    if (h < 12) return `${h} AM`
    if (h === 12) return "12 PM"
    return `${h - 12} PM`
}

export function AvailabilityManager() {
    const supabase = createClient()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [availability, setAvailability] = useState<DayAvailability[]>(
        DAYS.map(d => ({
            day_of_week: d.value,
            is_available: d.value >= 1 && d.value <= 5, // Mon-Fri default
            start_time: "09:00",
            end_time: "17:00"
        }))
    )

    useEffect(() => {
        if (open) {
            loadAvailability()
        }
    }, [open])

    async function loadAvailability() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('teacher_availability')
            .select('*')
            .eq('teacher_id', user.id)

        if (data && data.length > 0) {
            // Merge existing data with defaults
            const merged = DAYS.map(d => {
                const existing = data.find((a: any) => a.day_of_week === d.value)
                return existing ? {
                    day_of_week: existing.day_of_week,
                    is_available: existing.is_available,
                    start_time: existing.start_time,
                    end_time: existing.end_time
                } : {
                    day_of_week: d.value,
                    is_available: false,
                    start_time: "09:00",
                    end_time: "17:00"
                }
            })
            setAvailability(merged)
        }
        setLoading(false)
    }

    async function handleSave() {
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Upsert each day
        for (const day of availability) {
            await supabase
                .from('teacher_availability')
                .upsert({
                    teacher_id: user.id,
                    day_of_week: day.day_of_week,
                    is_available: day.is_available,
                    start_time: day.start_time,
                    end_time: day.end_time,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'teacher_id,day_of_week'
                })
        }

        setSaving(false)
        setOpen(false)
    }

    const toggleDay = (dayValue: number) => {
        setAvailability(prev => prev.map(d =>
            d.day_of_week === dayValue ? { ...d, is_available: !d.is_available } : d
        ))
    }

    const updateTime = (dayValue: number, field: 'start_time' | 'end_time', value: string) => {
        setAvailability(prev => prev.map(d =>
            d.day_of_week === dayValue ? { ...d, [field]: value } : d
        ))
    }

    const availableDaysCount = availability.filter(d => d.is_available).length

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 font-bold">
                    <Settings className="size-4" /> Manage Availability
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Set Your Weekly Availability</DialogTitle>
                    <DialogDescription>
                        Choose which days and times you're available to teach. Parents will only be able to book during these times.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <Loader2 className="animate-spin text-primary size-8" />
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        {DAYS.map((day) => {
                            const dayData = availability.find(d => d.day_of_week === day.value)!
                            return (
                                <div
                                    key={day.value}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-xl border transition-all",
                                        dayData.is_available
                                            ? "bg-primary/5 border-primary/30"
                                            : "bg-muted/30 border-border"
                                    )}
                                >
                                    <Switch
                                        checked={dayData.is_available}
                                        onCheckedChange={() => toggleDay(day.value)}
                                    />
                                    <span className={cn(
                                        "font-bold w-24",
                                        dayData.is_available ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                        {day.label}
                                    </span>

                                    {dayData.is_available && (
                                        <div className="flex items-center gap-2 flex-1">
                                            <Clock className="size-4 text-muted-foreground" />
                                            <select
                                                value={dayData.start_time}
                                                onChange={(e) => updateTime(day.value, 'start_time', e.target.value)}
                                                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                                            >
                                                {TIME_OPTIONS.map(t => (
                                                    <option key={t} value={t}>{formatTime(t)}</option>
                                                ))}
                                            </select>
                                            <span className="text-muted-foreground">to</span>
                                            <select
                                                value={dayData.end_time}
                                                onChange={(e) => updateTime(day.value, 'end_time', e.target.value)}
                                                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                                            >
                                                {TIME_OPTIONS.map(t => (
                                                    <option key={t} value={t}>{formatTime(t)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        <p className="text-sm text-muted-foreground text-center pt-2">
                            {availableDaysCount} days available per week
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2 font-bold">
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        {saving ? "Saving..." : "Save Availability"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
