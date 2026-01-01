"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type User = {
    id: string
    name: string
}

type AuthContextType = {
    user: User | null
    login: (name: string) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const savedUser = localStorage.getItem("coisas-partilhadas-user")
        if (savedUser) {
            setUser(JSON.parse(savedUser))
        }
    }, [])

    const login = (name: string) => {
        const newUser = { id: Date.now().toString(), name }
        setUser(newUser)
        localStorage.setItem("coisas-partilhadas-user", JSON.stringify(newUser))
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
