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
 * @description Client component for user authentication interface.
 */
export function LoginForm() {
    // State to hold the current value of the username input field.
    const [username, setUsername] = useState("")
    // State to hold the current value of the password input field.
    const [password, setPassword] = useState("")
    // State to store and display any error messages during input validation or authentication.
    const [error, setError] = useState("")
    // State to manage the loading status (e.g., when waiting for the server response).
    const [isLoading, setIsLoading] = useState(false)
    // Destructures the 'login' function from the authentication context.
    const { login } = useAuth()

    /**
     * @function handleSubmit
     * @description Handles form submission and authentication.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        // Prevents the default browser form submission behavior (page reload).
        e.preventDefault()

        // Clears any previous error message before starting a new attempt.
        setError("")

        // Client-side validation: Checks if both fields are non-empty after trimming whitespace.
        if (!username.trim() || !password.trim()) {
            setError("Por favor, preencha todos os campos")
            return
        }

        // Activates the loading state to disable inputs and show feedback.
        setIsLoading(true)

        try {
            // Calls the login function from the AuthContext, passing trimmed credentials.
            // This function handles the API call and setting the global user state.
            const success = await login(username.trim(), password.trim())

            // Checks the result returned by the context's login function.
            if (!success) {
                setError("Nome de utilizador ou password incorretos")
            }
            // Note: If 'success' is true, the component automatically re-renders based on global state
            // (e.g., the parent component will redirect or show the main app content).
        } catch (err) {
            // Handles unexpected errors (e.g., network failure, unhandled server exception).
            console.error("Erro no login:", err)
            setError("Erro ao conectar ao servidor. Tente novamente.")
        } finally {
            // Deactivates the loading state, whether the attempt succeeded or failed.
            setIsLoading(false)
        }
    }

    return (
        // Main container for the form, styled to center the content on the screen.
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-secondary/5 to-accent/10 p-4">
            {/* Card component acts as the visual container for the login form. */}
            <Card className="w-full max-w-md border-2 shadow-lg">
                {/* Header section of the card with title and description. */}
                <CardHeader className="space-y-2 text-center">
                    <CardTitle className="text-3xl font-bold">Coisas Partilhadas</CardTitle>
                    <CardDescription className="text-base">
                        Partilha as tuas descobertas favoritas
                    </CardDescription>
                </CardHeader>
                {/* Content section containing the form elements. */}
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username Input Field */}
                        <div className="space-y-2">
                            <Label htmlFor="username">Nome de utilizador</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="O teu nome de utilizador"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value)
                                    setError("")
                                }}
                                disabled={isLoading}
                                required
                                className="h-11"
                                autoComplete="username"
                            />
                        </div>

                        {/* Password Input Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="A tua password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setError("")
                                }}
                                disabled={isLoading}
                                required
                                className="h-11"
                                autoComplete="current-password"
                            />
                        </div>

                        {/* Error Message Display */}
                        {error && (
                            // Conditional rendering of the error box if the 'error' state is non-empty.
                            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-medium"
                            disabled={!username.trim() || !password.trim() || isLoading}
                        >
                            {/* Dynamic button text based on the loading state. */}
                            {isLoading ? "A entrar..." : "Entrar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}