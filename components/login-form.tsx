// components/login-form.tsx

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle } from "lucide-react"

/**
 * @function LoginForm
 * @description Client component for user authentication interface
 */
export function LoginForm() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()

    /**
     * @function handleSubmit
     * @description Handles form submission and authentication
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Limpar erro anterior
        setError("")

        // Validação básica
        if (!username.trim() || !password.trim()) {
            setError("Por favor, preencha todos os campos")
            return
        }

        setIsLoading(true)

        try {
            // Chamar login (agora é async)
            const success = await login(username.trim(), password.trim())

            if (!success) {
                setError("Nome de utilizador ou password incorretos")
            }
        } catch (err) {
            console.error("Erro no login:", err)
            setError("Erro ao conectar ao servidor. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-secondary/5 to-accent/10 p-4">
            <Card className="w-full max-w-md border-2 shadow-lg">
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-3xl font-bold">Coisas Partilhadas</CardTitle>
                    <CardDescription className="text-base">
                        Partilha as tuas descobertas favoritas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Nome de utilizador</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="O teu nome de utilizador"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value)
                                    setError("")  // Limpar erro ao digitar
                                }}
                                disabled={isLoading}
                                required
                                className="h-11"
                                autoComplete="username"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="A tua password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setError("")  // Limpar erro ao digitar
                                }}
                                disabled={isLoading}
                                required
                                className="h-11"
                                autoComplete="current-password"
                            />
                        </div>

                        {/* Mensagem de erro estilizada */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-medium"
                            disabled={!username.trim() || !password.trim() || isLoading}
                        >
                            {isLoading ? "A entrar..." : "Entrar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}