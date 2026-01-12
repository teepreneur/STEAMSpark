"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Atom } from "lucide-react"

export default function SignupPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [fullName, setFullName] = useState("")
    const [role, setRole] = useState<"parent" | "teacher">("parent")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // 1. Sign up user
        const { data: { user }, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                },
            },
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        if (user) {
            // 2. Create Profile
            // We trigger this manually here, though a Database Trigger is often better.
            // Since we are not using triggers yet, we insert directly (assuming user works, but RLS might block if not logged in properly yet?)
            // Actually, Supabase signUp creates the user. If email confirmation is off, they are logged in.
            // If email confirmation is on, we can't insert into profiles as the user unless RLS allows it based on user.id (which exists).

            // Let's assume Email Confirmation might be on or off. 
            // A robust way: The user is created. We try to insert the profile.

            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: email,
                    role: role,
                    full_name: fullName,
                    // defaults
                    avatar_url: '',
                    bio: role === 'teacher' ? 'New Teacher' : null,
                    subjects: role === 'teacher' ? [] : null,
                })

            if (profileError) {
                console.error("Profile creation failed:", profileError)
                // Non-blocking for now, can be fixed by user later or backend trigger
            }

            router.push(role === 'teacher' ? '/teacher/dashboard' : '/parent/dashboard')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-1 flex flex-col items-center text-center">
                    <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                        <Atom size={32} />
                    </div>
                    <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                    <CardDescription>
                        Join STEAM Spark as a parent or educator
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSignup}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label>I am a...</Label>
                            <RadioGroup defaultValue="parent" value={role} onValueChange={(v) => setRole(v as "parent" | "teacher")} className="grid grid-cols-2 gap-4">
                                <div>
                                    <RadioGroupItem value="parent" id="role-parent" className="peer sr-only" />
                                    <Label
                                        htmlFor="role-parent"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer"
                                    >
                                        <span className="mb-2 text-2xl">👨‍👩‍👧‍👦</span>
                                        Parent
                                    </Label>
                                </div>
                                <div>
                                    <RadioGroupItem value="teacher" id="role-teacher" className="peer sr-only" />
                                    <Label
                                        htmlFor="role-teacher"
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer"
                                    >
                                        <span className="mb-2 text-2xl">🎓</span>
                                        Teacher
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullname">Full Name</Label>
                            <Input
                                id="fullname"
                                placeholder="John Doe"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Must be at least 6 characters.</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full font-bold" type="submit" disabled={loading}>
                            {loading ? "Creating account..." : "Sign Up"}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <a href="/login" className="font-medium text-primary hover:underline">
                                Sign in
                            </a>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
