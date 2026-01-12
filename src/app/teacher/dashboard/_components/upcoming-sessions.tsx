import { Button } from "@/components/ui/button"
import { Video, User, Users, Calendar } from "lucide-react"
import { format, isToday, isTomorrow } from "date-fns"

interface Session {
    id: string
    title: string
    scheduled_at: string
    student_name: string
}

export function UpcomingSessions({ sessions }: { sessions: Session[] }) {
    return (
        <section className="flex flex-col grow">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Video className="text-primary size-5" />
                    <h2 className="text-lg font-bold">Upcoming Sessions</h2>
                </div>
                <a className="text-sm text-primary font-medium hover:underline" href="/teacher/calendar">View Calendar</a>
            </div>
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col divide-y">
                {sessions.length > 0 ? sessions.map((session) => {
                    const date = new Date(session.scheduled_at)
                    const dayLabel = isToday(date) ? "Today" : isTomorrow(date) ? "Tomorrow" : format(date, "MMM d")
                    const timeLabel = format(date, "h:mm a")

                    return (
                        <div key={session.id} className="p-4 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center">
                            {/* Date Badge */}
                            <div className={`flex-shrink-0 flex flex-row sm:flex-col items-center sm:justify-center gap-2 sm:gap-0 rounded-lg p-2 sm:size-16 min-w-[100px] sm:min-w-[64px] text-center ${dayLabel === 'Today' ? 'bg-primary/10' : 'bg-muted border border-dashed'}`}>
                                <span className={`text-xs font-bold uppercase ${dayLabel === 'Today' ? 'text-primary' : 'text-muted-foreground'}`}>{dayLabel}</span>
                                <span className="text-sm sm:text-lg font-bold">{timeLabel}</span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold">{session.title}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide bg-blue-100 text-blue-700 dark:bg-blue-900/30`}>
                                        Zoom
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <User size={16} /> Student: {session.student_name}
                                </p>
                            </div>

                            {/* Action */}
                            <div className="mt-2 sm:mt-0">
                                <Button className="w-full sm:w-auto font-bold">Join Class</Button>
                            </div>
                        </div>
                    )
                }) : (
                    <div className="p-8 text-center text-muted-foreground">
                        No upcoming sessions found.
                    </div>
                )}
            </div>
        </section>
    )
}
