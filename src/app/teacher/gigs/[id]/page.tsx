"use client"

import {
    CheckCircle, Shield, GraduationCap, Star, Verified,
    Lightbulb, School, Award, Check, Bolt, User, Users,
    Info, ChevronLeft, ChevronRight, Lock, MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function GigDetailsPage({ params }: { params: { id: string } }) {
    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
            {/* Breadcrumb / Back */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/teacher/gigs" className="hover:text-primary transition-colors">Home</Link>
                <span>/</span>
                <Link href="/teacher/gigs" className="hover:text-primary transition-colors">Tutors</Link>
                <span>/</span>
                <span className="text-foreground font-medium">Sarah Jenkins</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
                {/* Main Content */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* Profile Header */}
                    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="relative shrink-0 mx-auto sm:mx-0">
                                <div className="size-32 rounded-full bg-muted overflow-hidden border-4 border-background shadow-lg">
                                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop')" }}></div>
                                </div>
                                <div className="absolute bottom-1 right-1 bg-card rounded-full p-1 shadow-sm">
                                    <Verified className="size-6 text-green-500 fill-current" />
                                </div>
                            </div>
                            <div className="flex flex-col justify-center text-center sm:text-left flex-1">
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                    <h1 className="text-2xl font-bold text-foreground">Sarah Jenkins</h1>
                                    <CheckCircle className="size-5 text-primary fill-current text-white dark:text-primary-foreground" />
                                </div>
                                <p className="text-muted-foreground text-lg mb-2">MIT Grad Specializing in Robotics & Early Math</p>
                                <div className="flex flex-wrap gap-3 justify-center sm:justify-start mt-2">
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 gap-1 rounded-full px-2.5">
                                        <Shield className="size-3 fill-current" /> Background Checked
                                    </Badge>
                                    <Badge variant="secondary" className="bg-blue-100 text-primary hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 gap-1 rounded-full px-2.5">
                                        <GraduationCap className="size-3 fill-current" /> Certified Teacher
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 divide-x divide-border mt-8 border-t border-border pt-6">
                            <div className="flex flex-col items-center px-4">
                                <div className="flex items-center gap-1 text-foreground font-bold text-xl">
                                    4.9 <Star className="size-4 text-amber-400 fill-current" />
                                </div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Rating</span>
                            </div>
                            <div className="flex flex-col items-center px-4">
                                <div className="text-foreground font-bold text-xl">124</div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Reviews</span>
                            </div>
                            <div className="flex flex-col items-center px-4">
                                <div className="text-foreground font-bold text-xl">500+</div>
                                <span className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Hours Taught</span>
                            </div>
                        </div>
                    </div>

                    {/* About Me */}
                    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                        <h3 className="text-lg font-bold text-foreground mb-4">About Me</h3>
                        <div className="text-muted-foreground space-y-4 leading-relaxed">
                            <p>Hi! I&apos;m Sarah. I believe every student can master code if they&apos;re given the right tools and encouragement. I graduated from MIT in 2018 with a B.S. in Computer Science, where I discovered my passion for teaching while volunteering at local coding bootcamps.</p>
                            <p>My teaching methodology focuses on project-based learning. Whether we are tackling Algebra II or building a Python script to automate a Minecraft server, I ensure the concepts stick by applying them to real-world scenarios. I specialize in breaking down complex topics into manageable pieces.</p>
                        </div>
                        <div className="mt-6 pt-6 border-t border-border">
                            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Subjects & Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {['Python', 'Scratch', 'Robotics (LEGO Spike)', 'Calculus I', 'Algebra', 'Physics'].map((skill) => (
                                    <Badge key={skill} variant="secondary" className="rounded-lg px-3 py-1.5 text-sm font-medium">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Credentials */}
                    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                        <h3 className="text-lg font-bold text-foreground mb-4">Credentials & Education</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-primary">
                                    <School className="size-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground">Massachusetts Institute of Technology (MIT)</h4>
                                    <p className="text-sm text-muted-foreground">B.S. Computer Science • 2014 - 2018</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-primary">
                                    <Award className="size-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-foreground">Google Certified Educator</h4>
                                    <p className="text-sm text-muted-foreground">Level 2 Certification • Issued 2019</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Packages */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-foreground px-1">Session Packages</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Intro */}
                            <div className="bg-card border border-border rounded-xl p-5 hover:border-primary transition-colors cursor-pointer group">
                                <h4 className="text-muted-foreground font-medium text-sm mb-2">Intro Session</h4>
                                <div className="text-2xl font-bold text-foreground mb-4">$30<span className="text-sm font-normal text-muted-foreground">/30m</span></div>
                                <ul className="text-sm space-y-2 mb-4">
                                    <li className="flex gap-2 items-center"><Check className="size-4 text-green-500" /> Quick Assessment</li>
                                    <li className="flex gap-2 items-center"><Check className="size-4 text-green-500" /> Goal Setting</li>
                                </ul>
                            </div>
                            {/* Standard */}
                            <div className="bg-card border-2 border-primary rounded-xl p-5 relative shadow-md">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full">Most Popular</div>
                                <h4 className="text-primary font-bold text-sm mb-2">Standard</h4>
                                <div className="text-2xl font-bold text-foreground mb-4">$45<span className="text-sm font-normal text-muted-foreground">/60m</span></div>
                                <ul className="text-sm space-y-2 mb-4">
                                    <li className="flex gap-2 items-center"><Check className="size-4 text-green-500" /> 1-on-1 Tutoring</li>
                                    <li className="flex gap-2 items-center"><Check className="size-4 text-green-500" /> Session Notes</li>
                                    <li className="flex gap-2 items-center"><Check className="size-4 text-green-500" /> Homework Help</li>
                                </ul>
                            </div>
                            {/* Deep Dive */}
                            <div className="bg-card border border-border rounded-xl p-5 hover:border-primary transition-colors cursor-pointer group">
                                <h4 className="text-muted-foreground font-medium text-sm mb-2">Deep Dive</h4>
                                <div className="text-2xl font-bold text-foreground mb-4">$80<span className="text-sm font-normal text-muted-foreground">/90m</span></div>
                                <ul className="text-sm space-y-2 mb-4">
                                    <li className="flex gap-2 items-center"><Check className="size-4 text-green-500" /> Exam Prep</li>
                                    <li className="flex gap-2 items-center"><Check className="size-4 text-green-500" /> Project Review</li>
                                    <li className="flex gap-2 items-center"><Check className="size-4 text-green-500" /> Recording Included</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="bg-card rounded-xl p-6 border border-border shadow-sm mb-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-foreground">What Parents Say</h3>
                            <Button variant="link" className="text-primary text-sm font-medium">View all 124 reviews</Button>
                        </div>
                        <div className="space-y-6">
                            {/* Review 1 */}
                            <div className="flex gap-4 pb-6 border-b border-border last:border-0 last:pb-0">
                                <div className="size-10 rounded-full bg-orange-100 shrink-0 overflow-hidden">
                                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554151228-14d9def656ec?q=80&w=200&auto=format&fit=crop')" }}></div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-foreground">Jane Doe</span>
                                        <span className="text-xs text-muted-foreground">• 2 weeks ago</span>
                                    </div>
                                    <div className="flex items-center gap-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="size-3 text-amber-400 fill-current" />)}
                                    </div>
                                    <p className="text-sm text-foreground/80">Sarah was amazing with my son. He was struggling with Algebra basics, but after just 3 sessions he&apos;s confident and actually enjoying math. The robotics examples really helped!</p>
                                </div>
                            </div>
                            {/* Review 2 */}
                            <div className="flex gap-4 pb-6 border-b border-border last:border-0 last:pb-0">
                                <div className="size-10 rounded-full bg-blue-100 shrink-0 overflow-hidden">
                                    <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&auto=format&fit=crop&q=60')" }}></div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-foreground">Michael Smith</span>
                                        <span className="text-xs text-muted-foreground">• 1 month ago</span>
                                    </div>
                                    <div className="flex items-center gap-1 mb-2">
                                        {[1, 2, 3, 4].map((i) => <Star key={i} className="size-3 text-amber-400 fill-current" />)}
                                        <Star className="size-3 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-foreground/80">Great tutor. Very knowledgeable about Python. Sometimes the connection was a bit laggy but Sarah made up for it with great notes.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Booking (Sticky) */}
                <div className="lg:col-span-4 relative">
                    <div className="sticky top-8 space-y-4">
                        <div className="bg-card rounded-xl border border-border shadow-lg p-6 overflow-hidden">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Starting at</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-foreground">$45</span>
                                        <span className="text-muted-foreground">/ hour</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded text-amber-700 dark:text-amber-300 text-xs font-bold">
                                    <Bolt className="size-4 fill-current" /> Fast Response
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2 pb-2">
                                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">Booking Type</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="cursor-pointer border border-primary/50 bg-primary/5 p-3 rounded-lg flex flex-col items-center justify-center text-primary h-full transition-all">
                                            <User className="size-6 mb-1" />
                                            <span className="text-xs font-bold text-center">1-on-1 Session</span>
                                        </div>
                                        <div className="cursor-pointer border border-border hover:border-primary/50 bg-card p-3 rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:text-foreground h-full transition-all">
                                            <Users className="size-6 mb-1" />
                                            <span className="text-xs font-bold text-center">Group Class</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">Select Package</span>
                                    <Select defaultValue="standard">
                                        <SelectTrigger className="w-full bg-muted/50 h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Standard Session (60m) - $45</SelectItem>
                                            <SelectItem value="intro">Intro Session (30m) - $30</SelectItem>
                                            <SelectItem value="deep">Deep Dive (90m) - $80</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-foreground uppercase tracking-wide">Date & Time</span>
                                    <div className="border border-border rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-3">
                                            <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronLeft className="size-4" /></Button>
                                            <span className="text-sm font-bold">October 2023</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6"><ChevronRight className="size-4" /></Button>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-muted-foreground">
                                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d}>{d}</span>)}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 text-center text-sm text-foreground">
                                            <span className="text-muted-foreground/30">29</span>
                                            <span className="text-muted-foreground/30">30</span>
                                            <button className="hover:bg-muted rounded py-1">1</button>
                                            <button className="bg-primary text-primary-foreground rounded py-1 font-bold shadow-md">2</button>
                                            <button className="hover:bg-muted rounded py-1">3</button>
                                            <button className="hover:bg-muted rounded py-1">4</button>
                                            <span className="text-muted-foreground/30">5</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <Button variant="outline" className="border-primary bg-primary/10 text-primary font-bold">10:00 AM</Button>
                                        <Button variant="outline" className="text-muted-foreground">2:30 PM</Button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-dashed border-border space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Session Fee</span>
                                    <span>$45.00</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Service Fee</span>
                                    <span>$2.50</span>
                                </div>
                                <div className="flex justify-between text-base font-bold text-foreground pt-2">
                                    <span>Total</span>
                                    <span>$47.50</span>
                                </div>
                            </div>

                            <Button className="w-full mt-6 h-12 text-lg font-bold shadow-lg">Book Session</Button>
                            <p className="text-xs text-center text-muted-foreground mt-3">You won&apos;t be charged yet</p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-center gap-2 text-muted-foreground text-xs font-medium">
                            <Lock className="size-4" /> Payments secured by Stripe
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
