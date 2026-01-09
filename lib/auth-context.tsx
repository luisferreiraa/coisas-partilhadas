// lib/auth-context.tsx

"use client"

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react"

// Defines the shape of the user object retrieved after successful authentication.
export type User = {
    id: string
    username: string
}

// Defines the structure of the autenthication context and methods.
type AuthContextType = {
    user: User | null       // The authenticated user object, or null if unauthorized.
    isAuthenticated: boolean        // Boolean flag indicating the authentication status.
    // Function to handle the login process, expecting username/password, returns success status.
    login: (username: string, password: string) => Promise<boolean>
    // Function to handle the logout process.
    logout: () => Promise<void>
    // Function to re-fetch the user details.
    refreshUser: () => Promise<void>
}

// Creates the React Context object, initialized to undefined.
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    // State to hold the current authenticated user data.
    const [user, setUser] = useState<User | null>(null)
    // State to track if the initial authentication check is still pending.
    const [isLoading, setIsLoading] = useState(true)

    /**
     * Fetches the current user details from the server's "/api/auth/me" endpoint.
     * This is used to check for an existing session on application load.
     * @returns {Promise<void>}
     */
    const refreshUser = async () => {
        // Sends a GET request to the 'me' endpoint.
        try {
            const res = await fetch("/api/auth/me", {
                // credentials: include is essential to send the HTTP-only cookie along with the request.
                credentials: "include",
            })

            // If the response is not OK, the user is not authenticated.
            if (!res.ok) {
                setUser(null)
                return
            }

            // Parses the successful response and sets the user state.
            const data = await res.json()
            setUser(data.user)
        } catch (error) {
            console.error("Erro ao obter utilizador:", error)
            // Ensures the user state is null on network or parsing errors.
            setUser(null)
        }
    }

    // Effect Hook: Runs once on component mount to perform the initial session check.
    useEffect(() => {
        // Calls refreshUser and uses .finally() to set isLoading to false regardless of success or failure.
        refreshUser().finally(() => setIsLoading(false))
    }, [])      // Empty dependency array ensures it runs only once.

    /**
     * Handles the user login process by sending credentials to the server.
     * @param {string} username The user's provided username.
     * @param {string} password The user's provided password.
     * @returns {Promise<boolean>} True if login was successful, false otherwise.
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
                credentials: "include",     // Required to accept the Set-Cookie header from the server.
                body: JSON.stringify({ username, password }),       // Sends credentials to the server.
            })

            // If login failed (e.g., 401 Unauthorized), return false.
            if (!res.ok) return false

            // Parses the response (which should contain user data) and sets the state.
            const data = await res.json()
            setUser(data.user)

            return true
        } catch (error) {
            console.error("Erro no login:", error)
            return false
        }
    }

    /**
     * Handles the user logout process by informing the server to delete the session cookie.
     * @returns {Promise<void>}
     */
    const logout = async () => {
        try {
            // Sends a POST request to the logout endpoint. The server will respond by expiring the cookie.
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            })
        } finally {
            // Regardless of the server response, immediately clear the local user state to log out the client.
            setUser(null)
        }
    }

    // Memoized value object containing the state and methods for the context provider.
    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,        // Converts 'user' (object or null) to a boolean.
        login,
        logout,
        refreshUser,
    }

    // Renders nothing while the initial session check is ongoing to prevent flicker/inconsistent state.
    if (isLoading) {
        return null
    }

    // Provides the authentication context value to the children components.
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

/**
 * Custom hook to consume the authentication context.
 * * @returns {AuthContextType} The authentication context object.
 * @throws {Error} Throws an error if called outside of the AuthProvider.
 */
export function useAuth() {
    // Accesses the context value.
    const context = useContext(AuthContext)

    // Guards against usage outside the provider, ensuring 'context' is defined.
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }

    return context
}

