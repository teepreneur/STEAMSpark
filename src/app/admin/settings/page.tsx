"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Save, Loader2 } from "lucide-react"

export default function SettingsPage() {
    const [saving, setSaving] = useState(false)

    async function handleSave() {
        setSaving(true)
        // Placeholder for save functionality
        setTimeout(() => setSaving(false), 1000)
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold">Admin Settings</h1>
                <p className="text-muted-foreground">
                    Configure platform settings
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border p-6 space-y-6">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <Settings className="size-5" />
                    Platform Settings
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Platform Name</label>
                        <Input defaultValue="STEAM Spark" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Support Email</label>
                        <Input defaultValue="support@starterstech.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Default Currency</label>
                        <Input defaultValue="GHS" disabled />
                    </div>
                </div>

                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                    Save Settings
                </Button>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 text-center">
                <p className="text-muted-foreground text-sm">
                    More settings coming soon including payment gateway, notification preferences, and branding.
                </p>
            </div>
        </div>
    )
}
