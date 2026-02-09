import { Button } from "@/components/ui/button"
import { Video, User, Users, Calendar } from "lucide-react"
import { format, isToday, isTomorrow } from "date-fns"

interface Session {
    id: string
    title: string
    scheduled_at: string
    student_name: string
    parent_name?: string
    session_number: number
    total_sessions?: number
}

export function UpcomingSessions({ sessions }: { sessions: Session[] }) {
    // ... (rest of component) ...
    return (
        <section className="flex flex-col grow">
            {/* ... (header) ... */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col divide-y">
                {sessions.length > 0 ? sessions.map((session) => {
                    // ... (date logic) ...
                    const dateStr = session.scheduled_at
                    let dayLabel = "Unknown"
                    let timeLabel = "Unknown"
                    // ... (date parsing) ...
                    try {
                        const date = new Date(dateStr)
                        if (!isNaN(date.getTime())) {
                            dayLabel = isToday(date) ? "Today" : isTomorrow(date) ? "Tomorrow" : format(date, "MMM d")
                            timeLabel = format(date, "h:mm a")
                        } else {
                            // ... fallback ...
                        }
                    } catch (e) {
                        console.error("Date parse error", e)
                    }

                    return (
                        <div key={session.id} className="p-4 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center">
                            {/* Date Badge */}
                            <div className={`flex-shrink-0 flex flex-row sm:flex-col items-center sm:justify-center gap-2 sm:gap-0 rounded-lg p-2 sm:size-16 min-w-[100px] sm:min-w-[64px] text-center ${dayLabel === 'Today' ? 'bg-primary/10' : 'bg-muted border border-dashed'}`}>
                                <span className={`text-xs font-bold uppercase ${dayLabel === 'Today' ? 'text-primary' : 'text-muted-foreground'}`}>{dayLabel}</span>
                                <span className="text-sm sm:text-xs md:text-sm font-bold truncate w-full">{timeLabel}</span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold line-clamp-1 mr-1">{session.title}</h3>
                                    <div className="flex gap-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide bg-blue-100 text-blue-700 dark:bg-blue-900/30 shrink-0`}>
                                            Zoom
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide bg-gray-100 text-gray-700 border border-gray-200 shrink-0">
                                            Session {session.session_number}{session.total_sessions ? ` of ${session.total_sessions}` : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-sm text-foreground/90 flex items-center gap-1 font-medium">
                                        <User size={14} className="opacity-70" /> {session.student_name}
                                    </p>
                                    {session.parent_name && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 ml-0.5">
                                            Client: {session.parent_name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Action */}
                            <div className="mt-2 sm:mt-0 flex gap-2">
                                <Button size="sm" variant="outline" className="w-full sm:w-auto font-bold" asChild>
                                    <a href={`/teacher/sessions/${session.id}`}>Details</a>
                                </Button>
                                <Button size="sm" className="w-full sm:w-auto font-bold gap-2">
                                    <Video size={16} />
                                    Join
                                </Button>
                            </div>
                        </div>
                    )
                }) : (
                    // ... (no sessions) ...
                    <div className="p-8 text-center text-muted-foreground">
                        No upcoming sessions found.
                    </div>
                )}
            </div>
        </section>
    )
}
