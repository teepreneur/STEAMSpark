"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function NewTicketPage() {
    const router = useRouter()
    const supabase = createClient()
    const { toast } = useToast()

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        subject: "",
        description: "",
        priority: "medium",
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error("User not authenticated")
            }

            const { error } = await supabase
                .from('support_tickets')
                .insert({
                    created_by: user.id,
                    subject: formData.subject,
                    description: formData.description,
                    priority: formData.priority,
                    status: 'open',
                })

            if (error) throw error

            toast({
                title: "Success",
                description: "Ticket created successfully",
            })

            router.push("/teacher/support")
            router.refresh()
        } catch (error) {
            console.error("Error creating ticket:", error)
            toast({
                title: "Error",
                description: "Failed to create ticket",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/teacher/support">
                        <ArrowLeft className="size-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold">Create New Ticket</h1>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                            id="subject"
                            required
                            placeholder="Brief summary of the issue"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                            value={formData.priority}
                            onValueChange={(value) => setFormData({ ...formData, priority: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            required
                            placeholder="Detailed description of the issue..."
                            className="min-h-[150px]"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/teacher/support">
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                            Submit Ticket
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
