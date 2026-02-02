"use client"

/**
 * Admin path helper - returns correct paths for both localhost and admin subdomain
 * On localhost: returns /admin/... paths
 * On admin subdomain: returns /... paths (without /admin prefix)
 */
export function useAdminPaths() {
    const isAdminSubdomain = typeof window !== 'undefined' &&
        (window.location.hostname.includes('admin.') || window.location.hostname.startsWith('admin.'))

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
