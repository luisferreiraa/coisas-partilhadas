// components/login-form.tsx

"use client"

import type React from "react" // Imports React types, typically used for type hints like React.FormEvent.
import { useState } from "react" // Imports the useState hook for managing component state.
import { Button } from "@/components/ui/button" // UI component for interactive buttons.
import { Input } from "@/components/ui/input" // UI component for form text inputs.
import { Label } from "@/components/ui/label" // UI component for input labels.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card" // UI components for displaying content in a structured card.
import { useAuth } from "@/lib/auth-context" // Custom hook to access authentication methods (specifically the `login` function).

/**
 * @function LoginForm
 * @description A client component that renders a complete user login interface,
 * handling local state for credentials and submitting them via the authentication context.
 * @returns {JSX.Element} The rendered login card interface.
 * while the `login` function is processing (especially if it were an asynchronous API call).
 */
export function LoginForm() {
    // State hook for managing the user name input value.
    const [name, setName] = useState("")
    // State hook for managing the password input value.
    const [password, setPassword] = useState("")
    // State hook for displaying authentication or validation errors to the user.
    const [error, setError] = useState("")
    // Destructures the login function from the authentication context.
    const { login } = useAuth()

    /**
     * @function handleSubmit
     * @description Handles the form submission event.
     * It performs client-side validation, calls the context's login method, and manages error display.
     * @param {React.FormEvent} e - The form event object.
     */
    const handleSubmit = (e: React.FormEvent) => {
        // Prevent the default browser form submission behavior.
        e.preventDefault()

        // Basic client-side validation: ensures both fields are not empty after trimming whitespace.
        if (name.trim() && password.trim()) {
            // Calls the login function from the auth context. 
            const success = login(name.trim(), password.trim())
            // If login fails (returns false), set the specific error message.
            if (!success) {
                setError("Nome ou password incorretos")
            } else {
                // If login is successful, clear any previous error message.
                setError("")
            }
        }
    }

    // Component rendering starts here.
    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/10 via-secondary/5 to-accent/10 p-4">
            <Card className="w-full max-w-md border-2">
                <CardHeader className="space-y-2 text-center">
                    {/* Application Title */}
                    <CardTitle className="text-3xl font-bold text-balance">Coisas Partilhadas</CardTitle>
                    {/* Application Subtitle/Description */}
                    <CardDescription className="text-base">Partilha as tuas descobertas favoritas</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* The main login form. */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">O teu nome</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Como te chamas?"
                                value={name}
                                // Update the name state on every input change.
                                onChange={(e) => setName(e.target.value)}
                                required        // Browser-level required validation.
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
                                // Update the password state on every input change.
                                onChange={(e) => setPassword(e.target.value)}
                                required        // Browser-level required validation.
                                className="h-11"
                            />
                        </div>

                        {/* Conditional rendering for the error message, displayed in red. */}
                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-medium"
                            // Button is disabled if either input field is empty (after trimming).
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

