import { TeacherSidebar } from "@/components/layout/teacher-sidebar";
import { TeacherMobileNav } from "@/components/layout/teacher-mobile-nav";
import { LiveNotifications } from "@/components/notifications/live-notifications";
import { SupportWidget } from "@/components/support/support-widget";

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans">
            <LiveNotifications />
            <TeacherSidebar className="hidden md:flex" />
            <div className="flex-1 flex flex-col h-screen relative overflow-y-auto">
                <div className="md:hidden p-4 border-b border-border bg-white dark:bg-[#1a2632] sticky top-0 z-20 flex items-center gap-3">
                    <TeacherMobileNav />
                    <span className="font-bold text-lg">Menu</span>
                </div>
                <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
            <SupportWidget />
        </div>
    );
}
