/**
 * Admin path helper - SIMPLE inline function, no hooks needed
 * Use this in all admin pages instead of useAdminPaths hook
 */

export function getAdminHref(basePath: string): string {
    if (typeof window === 'undefined') return basePath
    const isAdminSubdomain = window.location.hostname.includes('admin.') || window.location.hostname.startsWith('admin.')
    // basePath should NOT include /admin prefix - just /dashboard, /users/teachers, etc.
    if (basePath.startsWith('/admin')) {
        basePath = basePath.replace('/admin', '')
    }
    return isAdminSubdomain ? basePath : `/admin${basePath}`
}
