"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

export function LoginForm() {
    const [name, setName] = useState("")
    const { login } = useAuth()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            login(name.trim())
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-secondary/5 to-accent/10 p-4">
            <Card className="w-full max-w-md border-2">
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-3xl font-bold text-balance">Coisas Partilhadas</CardTitle>
                    <CardDescription className="text-base">Partilha as tuas descobertas favoritas</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">O teu nome</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Como te chamas?"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>
                        <Button type="submit" className="w-full h-11 text-base font-medium" disabled={!name.trim()}>
                            Entrar
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
