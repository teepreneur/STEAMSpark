"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { TeacherSidebar } from "./teacher-sidebar"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export function TeacherMobileNav() {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    // Close sheet when route changes
    useEffect(() => {
        setOpen(false)
    }, [pathname])

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="size-6" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r border-border w-64 max-w-xs">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">Mobile navigation menu for Teacher Portal</SheetDescription>

                {/* Render Sidebar inside Sheet, overriding hidden class */}
                <TeacherSidebar className="flex w-full h-full static border-none" />
            </SheetContent>
        </Sheet>
    )
}
