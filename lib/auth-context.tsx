// lib/auth-context.tsx

"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type User = {
    id: string
    name: string
}

type AuthContextType = {
    user: User | null
    login: (name: string, password: string) => boolean  // retorna true se login OK, false caso contrário
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Utilizadores pré-definidos
const USERS = [
    { name: "[REDACTED_NAME]", password: "1234" },
    { name: "[REDACTED_NAME]", password: "abcd" },
]

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const savedUser = localStorage.getItem("coisas-partilhadas-user")
        if (savedUser) {
            setUser(JSON.parse(savedUser))
        }
    }, [])

    const login = (name: string, password: string) => {
        const matchedUser = USERS.find(u => u.name === name && u.password === password)
        if (!matchedUser) return false  // login falhou

        const newUser = { id: Date.now().toString(), name: matchedUser.name }
        setUser(newUser)
        localStorage.setItem("coisas-partilhadas-user", JSON.stringify(newUser))
        return true
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem("coisas-partilhadas-user")
    }

    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

