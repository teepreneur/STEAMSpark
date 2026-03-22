"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createParentAndStudent } from "@/app/admin/actions/users"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ChevronLeft, Loader2, UserPlus, GraduationCap, AlertCircle, CheckCircle2 } from "lucide-react"
import { getAdminHref } from "@/lib/admin-paths"
import Link from "next/link"

export default function NewParentPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        const formData = new FormData(e.currentTarget)
        const result = await createParentAndStudent(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else if (result.success) {
            setSuccess(`Parent account created successfully! Temporary password: ChangeMe123!`)
            setTimeout(() => {
                router.push(getAdminHref('/admin/users/parents'))
            }, 3000)
        }
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

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-slate-950 px-2 text-muted-foreground font-medium flex items-center gap-2">
                                    <GraduationCap className="size-4" /> Optional Child Info
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2 md:col-span-1">
                                <Label htmlFor="student_name">Child's Name</Label>
                                <Input id="student_name" name="student_name" placeholder="e.g. Tommy" className="bg-slate-50 dark:bg-slate-900" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="student_age">Age</Label>
                                <Input id="student_age" name="student_age" type="number" min="4" max="18" placeholder="e.g. 10" className="bg-slate-50 dark:bg-slate-900" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="student_grade">Grade</Label>
                                <Input id="student_grade" name="student_grade" placeholder="e.g. 5th Grade" className="bg-slate-50 dark:bg-slate-900" />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg flex items-start gap-3 mt-4 text-sm font-medium border border-red-200">
                                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                                <p>{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 rounded-lg flex items-start gap-3 mt-4 text-sm font-medium border border-green-200">
                                <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
                                <p>{success}</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-slate-50 dark:bg-slate-900/50 py-4 flex justify-end gap-3 border-t">
                        <Button variant="outline" type="button" onClick={() => router.back()} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !!success} className="min-w-[140px]">
                            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <UserPlus className="size-4 mr-2" />}
                            Create Account
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
