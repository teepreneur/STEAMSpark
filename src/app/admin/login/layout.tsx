export default function AdminLoginLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // No sidebar for login page - just render children directly
    return <>{children}</>
}
