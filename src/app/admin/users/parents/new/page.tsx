"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createParentAndStudent } from "@/app/admin/actions/users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { 
    ChevronLeft, Loader2, UserPlus, GraduationCap, 
    AlertCircle, CheckCircle2, Copy, ExternalLink, Phone, MapPin 
} from "lucide-react"
import { getAdminHref } from "@/lib/admin-paths"
import Link from "next/link"

export default function NewParentPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successData, setSuccessData] = useState<{
        password: string;
        link: string;
        email: string;
    } | null>(null)
    const [copied, setCopied] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const result = await createParentAndStudent(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else if (result.success) {
            // Get full URL for onboarding link
            const baseUrl = window.location.origin;
            const fullLink = `${baseUrl}${result.onboardingLink}`;
            
            setSuccessData({
                password: 'ChangeMe123!',
                link: fullLink,
                email: result.email || ''
            })
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href={getAdminHref('/admin/users/parents')}>
                        <ChevronLeft className="size-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Add New Parent</h1>
                    <p className="text-muted-foreground">Concierge creation of a parent profile and child.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="shadow-sm border-0 border-t-4 border-t-primary rounded-xl overflow-hidden">
                    <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-8">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <UserPlus className="size-5 text-primary" />
                            Parent Details
                        </CardTitle>
                        <CardDescription>
                            This will create a new user account with a temporary password (ChangeMe123!).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 -mt-4 bg-white dark:bg-slate-950 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full Name *</Label>
                                <Input id="full_name" name="full_name" required placeholder="e.g. Jane Doe" className="bg-slate-50 dark:bg-slate-900" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address *</Label>
                                <Input id="email" name="email" type="email" required placeholder="jane@example.com" className="bg-slate-50 dark:bg-slate-900" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="phone_number" className="flex items-center gap-2">
                                    <Phone className="size-3.5 text-muted-foreground" /> Phone Number
                                </Label>
                                <Input id="phone_number" name="phone_number" placeholder="e.g. +233 24 123 4567" className="bg-slate-50 dark:bg-slate-900" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="country" className="flex items-center gap-2">
                                        <MapPin className="size-3.5 text-muted-foreground" /> Country
                                    </Label>
                                    <Input id="country" name="country" placeholder="e.g. Ghana" className="bg-slate-50 dark:bg-slate-900" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City / Town</Label>
                                    <Input id="city" name="city" placeholder="e.g. Accra" className="bg-slate-50 dark:bg-slate-900" />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg flex items-start gap-3 mt-4 text-sm font-medium border border-red-200">
                                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        {successData && (
                            <div className="mt-4 space-y-4">
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 rounded-lg flex items-start gap-3 text-sm font-medium border border-green-200">
                                    <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">Account created successfully!</p>
                                        <p className="mt-1 font-normal opacity-90">Temporary Password: <span className="font-mono font-bold">{successData.password}</span></p>
                                    </div>
                                </div>

                                <div className="p-6 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                            <GraduationCap className="size-4" /> Share Onboarding Link
                                        </h3>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                                            onClick={() => window.open(successData.link, '_blank')}
                                        >
                                            <ExternalLink className="size-3.5 mr-2" />
                                            Preview
                                        </Button>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Copy this link and send it to the parent. It allows them to fill out their child's profile details which will sync to their account.
                                    </p>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono truncate flex items-center">
                                            {successData.link}
                                        </div>
                                        <Button 
                                            type="button"
                                            onClick={() => copyToClipboard(successData.link)}
                                            className="shrink-0"
                                        >
                                            {copied ? <CheckCircle2 className="size-4 mr-2" /> : <Copy className="size-4 mr-2" />}
                                            {copied ? "Copied" : "Copy Link"}
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-center pt-2">
                                    <Button variant="link" asChild>
                                        <Link href={getAdminHref('/admin/users/parents')}>
                                            Go to Parent Management
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-slate-50 dark:bg-slate-900/50 py-4 flex justify-end gap-3 border-t">
                        <Button variant="outline" type="button" onClick={() => router.back()} disabled={loading}>
                            {successData ? "Close" : "Cancel"}
                        </Button>
                        {!successData && (
                            <Button type="submit" disabled={loading} className="min-w-[140px]">
                                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <UserPlus className="size-4 mr-2" />}
                                Create Account
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
