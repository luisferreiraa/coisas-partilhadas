// // lib/auth-context.tsx

// "use client"

// import {
//     createContext,      // Core React function to create a Context object.
//     useContext,         // Hook to consume the context value in descendant components.
//     useEffect,          // Hook for performing side effects.
//     useState,           // Hook for managing local component state.
//     type ReactNode,     // Type definition for React children.
// } from "react"

// /**
//  * @typedef {Object} User
//  * @description Defines the structure for the authenticated user object.
//  * This data is typically stored in state and persisted in local Storage.
//  * @property {string} id - The unique identifier for the user (sub claim from JWT).
//  * @property {string} username - The user's unique username.
//  */
// export type User = {
//     id: string
//     username: string
// }

// /**
//  * @typedef {Object} AuthContextType
//  * @description Defines the shape of the data methods provided by the AuthContext,
//  * @property {User | null} user - The current authenticated user object, or null if not logged in.
//  * @property {string | null} token - The JWT token used for API authorization, or null.
//  * @property {boolean} isAuthenticated - Derived state: true if both user and token exist.
//  * @property {(username: string, password: string) => Promise<boolean>} login - Function to handle user login, returning success status.
//  * @property {() => void} logout - Function to handle user logout and clear credentials.
//  */
// type AuthContextType = {
//     user: User | null
//     token: string | null
//     isAuthenticated: boolean
//     login: (username: string, password: string) => Promise<boolean>
//     logout: () => void
// }

// // Creates the context object. The initial value is set to indefined
// // and consuming components must handle this possibility or rely on the provider.
// const AuthContext = createContext<AuthContextType | undefined>(undefined)

// /**
//  * @function AuthProvider
//  * @description The main provider component responsible for managing authentication state,
//  * handling persistence (via localStorage), and providing the context to children.
//  * @param {Object} props - Component properties.
//  * @param {ReactNode} props.children - The child components wrapped by this provider.
//  * @returns {JSX.Element | null} The Context Provider component, or null during initial loading.
//  */
// export function AuthProvider({ children }: { children: ReactNode }) {
//     // State to hold the authenticated user's data.
//     const [user, setUser] = useState<User | null>(null)
//     // State to hold the JWT token.
//     const [token, setToken] = useState<string | null>(null)
//     // State to track the initial check for persisted credentials.
//     const [isLoading, setIsLoading] = useState(true)

//     // Effects runs once on component mount ([]) to check for persisted credentials.
//     useEffect(() => {
//         const storedUser = localStorage.getItem("cp:user")
//         const storedToken = localStorage.getItem("cp:token")

//         // If both token and user data are found in localStorage, restore the session.
//         if (storedUser && storedToken) {
//             setUser(JSON.parse(storedUser))
//             setToken(storedToken)
//         }

//         // Marks the loading process as complete, allowing the app to render.
//         setIsLoading(false)

//         // CRITICAL MISSING IMPROVEMENT: This implementation relies on localStorage, which is vulnerable
//         // to XSS attacks. For professional security, tokens should preferably be stored in
//         // HttpOnly cookies managed by the API route.
//     }, [])

//     const login = async (username: string, password: string): Promise<boolean> => {
//         try {
//             const res = await fetch("/api/auth/login", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({ username, password }),
//             })

//             if (!res.ok) return false

//             const data = await res.json()

//             const loggedUser: User = data.user
//             const jwtToken: string = data.token

//             setUser(loggedUser)
//             setToken(jwtToken)

//             localStorage.setItem("cp:user", JSON.stringify(loggedUser))
//             localStorage.setItem("cp:token", jwtToken)

//             return true
//         } catch (err) {
//             console.error("Erro no login:", err)
//             return false
//         }
//     }

//     const logout = () => {
//         setUser(null)
//         setToken(null)

//         localStorage.removeItem("cp:user")
//         localStorage.removeItem("cp:token")
//     }

//     const value: AuthContextType = {
//         user,
//         token,
//         isAuthenticated: !!user && !!token,
//         login,
//         logout,
//     }

//     if (isLoading) {
//         return null
//     }

//     return (
//         <AuthContext.Provider value={value}>
//             {children}
//         </AuthContext.Provider>
//     )
// }

// export function useAuth() {
//     const context = useContext(AuthContext)

//     if (!context) {
//         throw new Error("useAuth must be used within an AuthProvider")
//     }

//     return context
// }

// lib/auth-context.tsx

"use client"

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react"

/**
 * Represents the authenticated user returned by the backend.
 * IMPORTANT: This object is NOT a source of truth for authentication.
 * The real auth state is validated server-side via HttpOnly cookies.
 */
export type User = {
    id: string
    username: string
}

/**
 * Authentication context contract.
 * NOTE:
 * - No token is exposed to the frontend
 * - Authentication is cookie-based (HttpOnly)
 */
type AuthContextType = {
    user: User | null
    isAuthenticated: boolean
    login: (username: string, password: string) => Promise<boolean>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    /**
     * Loads the authenticated user from the backend using HttpOnly cookies.
     * This is the ONLY trusted way to restore a session.
     */
    const refreshUser = async () => {
        try {
            const res = await fetch("/api/auth/me", {
                credentials: "include", // 👈 required for cookies
            })

            if (!res.ok) {
                setUser(null)
                return
            }

            const data = await res.json()
            setUser(data.user)
        } catch (error) {
            console.error("Erro ao obter utilizador:", error)
            setUser(null)
        }
    }

    /**
     * Initial authentication check on app load.
     */
    useEffect(() => {
        refreshUser().finally(() => setIsLoading(false))
    }, [])

    /**
     * Performs login.
     * The backend must:
     * - validate credentials
     * - set an HttpOnly cookie with the JWT
     * - return the user object (NO TOKEN)
     */
    const login = async (
        username: string,
        password: string
    ): Promise<boolean> => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // 👈 essential
                body: JSON.stringify({ username, password }),
            })

            if (!res.ok) return false

            const data = await res.json()
            setUser(data.user)

            return true
        } catch (error) {
            console.error("Erro no login:", error)
            return false
        }
    }

    /**
     * Logs out securely by invalidating the cookie on the backend.
     */
    const logout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            })
        } finally {
            setUser(null)
        }
    }

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
    }

    // Prevents UI flicker and unauthorized rendering
    if (isLoading) {
        return null
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }

    return context
}

