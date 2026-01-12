import { ParentHeader } from "@/components/layout/parent-header";
import { LiveNotifications } from "@/components/notifications/live-notifications";

export default function ParentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
            <LiveNotifications />
            <ParentHeader />
            <main className="flex-1 flex justify-center w-full py-8 px-4 md:px-8">
                <div className="w-full max-w-[1200px] flex flex-col gap-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

