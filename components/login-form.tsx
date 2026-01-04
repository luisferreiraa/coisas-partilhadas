// components/login-form.tsx

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
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")   // Mensagem de erro
    const { login } = useAuth()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim() && password.trim()) {
            const success = login(name.trim(), password.trim())
            if (!success) {
                setError("Nome ou password incorretos")
            } else {
                setError("") // limpa erro se login OK
            }
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

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="A tua password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-medium"
                            disabled={!name.trim() || !password.trim()}
                        >
                            Entrar
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

