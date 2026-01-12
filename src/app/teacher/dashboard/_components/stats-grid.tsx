import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Users, Star, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

interface StatsProps {
    earnings: number
    activeStudents: number
    pendingEnrollments: number
    rating: number
    completedSessions: number
}

export function StatsGrid({ earnings, activeStudents, pendingEnrollments, rating, completedSessions }: StatsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Earnings */}
            <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
                    <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                        <Wallet size={18} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">GHS {earnings.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">From bookings</p>
                </CardContent>
            </Card>

            {/* Active Students with Pending Highlight */}
            <Link href={pendingEnrollments > 0 ? "/teacher/students?filter=pending" : "/teacher/students"}>
                <Card className={pendingEnrollments > 0 ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 cursor-pointer hover:shadow-md transition-shadow" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
                        <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                            <Users size={18} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeStudents}</div>
                        {pendingEnrollments > 0 ? (
                            <div className="flex items-center gap-1.5 mt-1">
                                <Clock size={12} className="text-red-600" />
                                <p className="text-xs font-bold text-red-600">{pendingEnrollments} pending approval</p>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground mt-1">Enrolled</p>
                        )}
                    </CardContent>
                </Card>
            </Link>

            {/* Average Rating */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
                    <div className="size-8 rounded-lg flex items-center justify-center text-amber-500">
                        <Star size={18} className="text-amber-500" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {rating > 0 ? rating.toFixed(1) : "New"}
                        {rating > 0 && <span className="text-sm font-normal text-muted-foreground ml-1">/ 5.0</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">From reviews</p>
                </CardContent>
            </Card>

            {/* Sessions Completed */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Sessions Completed</CardTitle>
                    <div className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                        <CheckCircle size={18} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{completedSessions}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total</p>
                </CardContent>
            </Card>
        </div>
    )
}

