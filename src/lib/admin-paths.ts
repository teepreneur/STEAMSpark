"use client"

/**
 * Admin path helper - returns correct paths for both localhost and admin subdomain
 * On localhost: returns /admin/... paths
 * On admin subdomain: returns /... paths (without /admin prefix)
 * 
 * This uses a simple check that works during hydration to avoid mismatches.
 */

function checkIsAdminSubdomain(): boolean {
    if (typeof window === 'undefined') return false
    const hostname = window.location.hostname
    return hostname.includes('admin.') || hostname.startsWith('admin.')
}

export function useAdminPaths() {
    // Check on every call - this is stable and works with SSR
    const isAdminSubdomain = checkIsAdminSubdomain()

    const getPath = (path: string): string => {
        if (isAdminSubdomain) {
            // Remove /admin prefix for subdomain
            return path.replace(/^\/admin/, '') || '/'
        }
        return path
    }

    return { isAdminSubdomain, getPath }
}

/**
 * Static version for server components or non-hook usage
 * Returns paths that work on both environments via middleware rewrite
 */
export function getAdminPath(path: string, isSubdomain: boolean): string {
    if (isSubdomain) {
        return path.replace(/^\/admin/, '') || '/'
    }
    return path
}
