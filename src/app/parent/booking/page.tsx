"use client"

import {
    Download, DollarSign, Calendar, AlertCircle, ChevronDown,
    CalendarDays, Filter, MoreVertical, Search, Plus,
    MessageSquare, HelpCircle, Check, X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const bookings = [
    {
        id: 1,
        title: "Robotics 101: Intro",
        tutor: "Sarah Jenkins",
        date: "Oct 24, 2023",
        time: "4:00 PM - 5:30 PM",
        price: 45.00,
        status: "Upcoming",
        color: "blue"
    },
    {
        id: 2,
        title: "Chemistry Fun Lab",
        tutor: "Dr. Arinze",
        date: "Oct 28, 2023",
        time: "10:00 AM - 11:30 AM",
        price: 50.00,
        status: "Upcoming",
        color: "purple"
    },
    {
        id: 3,
        title: "Python for Kids",
        tutor: "Michael Chen",
        date: "Oct 15, 2023",
        time: "3:30 PM - 5:00 PM",
        price: 40.00,
        status: "Completed",
        color: "green"
    },
    {
        id: 4,
        title: "Bridge Building",
        tutor: "Amanda Lee",
        date: "Oct 10, 2023",
        time: "4:00 PM - 5:30 PM",
        price: 35.00,
        status: "Cancelled",
        color: "gray"
    }
]

export default function BookingPage() {
    return (
        <div className="flex flex-col gap-8">
            {/* Header / Search (Mobile only mainly, or supplemental) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <Input className="pl-10" placeholder="Search classes..." />
                </div>
                <Button className="font-bold">
                    <Plus className="mr-2 size-4" /> Book New Class
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Main Content */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Page Heading */}
                    <div className="flex flex-wrap justify-between items-end gap-4 pb-2 border-b border-border">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">My Bookings & Payments</h1>
                            <p className="text-muted-foreground">Manage your child&apos;s sessions, view invoices, and track payment history.</p>
                        </div>
                        <Button variant="outline" className="gap-2 font-bold">
                            <Download className="size-5" />
                            Download All Invoices
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                            <div className="flex items-center gap-2">
                                <DollarSign className="text-primary size-5" />
                                <p className="text-muted-foreground text-sm font-medium">Total Spent (YTD)</p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">$1,240.00</p>
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="text-primary size-5" />
                                <p className="text-muted-foreground text-sm font-medium">Upcoming Sessions</p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">4</p>
                        </div>
                        <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="text-orange-500 size-5" />
                                <p className="text-muted-foreground text-sm font-medium">Pending Refunds</p>
                            </div>
                            <p className="text-2xl font-bold text-foreground">1</p>
                        </div>
                    </div>

                    {/* Tabs & Filters Container */}
                    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                        {/* Tabs */}
                        <div className="border-b border-border px-4 md:px-6">
                            <div className="flex gap-6 overflow-x-auto">
                                <button className="border-b-[3px] border-primary text-foreground pb-[13px] pt-4 min-w-max text-sm font-bold">
                                    Active Bookings
                                </button>
                                <button className="border-b-[3px] border-transparent text-muted-foreground hover:text-primary pb-[13px] pt-4 min-w-max transition-colors text-sm font-bold">
                                    Past History
                                </button>
                                <button className="border-b-[3px] border-transparent text-muted-foreground hover:text-primary pb-[13px] pt-4 min-w-max transition-colors text-sm font-bold">
                                    Refund Requests
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-3 p-4 md:p-6 border-b border-border bg-muted/30">
                            <Button variant="outline" className="h-9 gap-2 font-medium bg-background">
                                Child: All <ChevronDown className="size-4 text-muted-foreground" />
                            </Button>
                            <Button variant="outline" className="h-9 gap-2 font-medium bg-background">
                                Date Range <CalendarDays className="size-4 text-muted-foreground" />
                            </Button>
                            <Button variant="outline" className="h-9 gap-2 font-medium bg-background">
                                Status: Any <Filter className="size-4 text-muted-foreground" />
                            </Button>
                            <div className="ml-auto flex items-center">
                                <button className="text-primary text-sm font-bold hover:underline">Clear Filters</button>
                            </div>
                        </div>

                        {/* Bookings Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/30 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                                        <th className="p-4 md:pl-6">Class & Tutor</th>
                                        <th className="p-4">Date & Time</th>
                                        <th className="p-4">Price</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 md:pr-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {bookings.map((booking) => (
                                        <tr key={booking.id} className="group hover:bg-muted/30 transition-colors">
                                            <td className="p-4 md:pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-10 rounded-lg flex items-center justify-center text-primary ${booking.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                                            booking.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                                                                booking.color === 'green' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        <span className="font-bold text-lg">{booking.title[0]}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-sm">{booking.title}</p>
                                                        <p className="text-xs text-muted-foreground">Tutor: {booking.tutor}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-foreground font-medium">{booking.date}</p>
                                                <p className="text-xs text-muted-foreground">{booking.time}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-bold text-foreground">${booking.price.toFixed(2)}</p>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant={booking.status === 'Completed' ? 'default' : booking.status === 'Cancelled' ? 'secondary' : 'outline'} className={
                                                    booking.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                                                        booking.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : ''
                                                }>
                                                    {booking.status === 'Upcoming' && <span className="size-1.5 rounded-full bg-blue-500 mr-1.5"></span>}
                                                    {booking.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 md:pr-6 text-right">
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <MoreVertical className="size-4 text-muted-foreground" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between border-t border-border p-4">
                            <p className="text-xs text-muted-foreground">Showing 1-4 of 12 bookings</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled>Previous</Button>
                                <Button variant="outline" size="sm">Next</Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar (Chat & Support) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Chat Widget */}
                    <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col h-[480px]">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30 rounded-t-xl">
                            <h3 className="font-bold text-foreground">Chat with Tutors</h3>
                            <MessageSquare className="size-5 text-muted-foreground cursor-pointer" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Message 1 */}
                            <div className="flex gap-3 cursor-pointer p-2 hover:bg-muted/50 rounded-lg transition-colors group">
                                <div className="relative">
                                    <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-muted-foreground">SJ</div>
                                    <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-background rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-sm font-bold text-foreground truncate">Sarah Jenkins</p>
                                        <span className="text-[10px] text-muted-foreground">10:23 AM</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate group-hover:text-foreground">Hi! Looking forward to seeing Alex at Robotics today.</p>
                                </div>
                            </div>
                            {/* Message 2 */}
                            <div className="flex gap-3 cursor-pointer p-2 hover:bg-muted/50 rounded-lg transition-colors group">
                                <div className="relative">
                                    <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-muted-foreground">MC</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <p className="text-sm font-bold text-foreground truncate">Michael Chen</p>
                                        <span className="text-[10px] text-muted-foreground">Yesterday</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate group-hover:text-foreground">Python homework attached. Let me know if...</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-border bg-muted/30 rounded-b-xl">
                            <Button className="w-full font-bold gap-2">
                                <MessageSquare className="size-4" /> Start New Message
                            </Button>
                        </div>
                    </div>

                    {/* Support Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-[#101922] to-[#2c3e50] dark:from-black dark:to-[#1e2732] rounded-xl p-6 text-white shadow-md">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10 pointer-events-none">
                            <HelpCircle className="size-32" />
                        </div>
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="size-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                <HelpCircle className="size-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">Need Help?</h3>
                                <p className="text-sm text-gray-300">Have questions about billing, refunds, or technical issues?</p>
                            </div>
                            <Button variant="secondary" className="w-full font-bold">
                                Contact Support
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
