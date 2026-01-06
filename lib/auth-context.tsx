// lib/auth-context.tsx

"use client"        // Directive indicating that this module should be treated as client-side code, necessary for using hooks (useState, useContext, useEffect).

import {
    createContext, // Function to create a new React Context object.
    useContext,    // Hook to consume context values within functional components.
    useState,      // Hook to manage local component state (e.g., the current user).
    useEffect,     // Hook to manage side effects, such as loading user data from local storage on mount.
    type ReactNode // Type definition for content passed as children to the component.
} from "react"

/**
 * Defines the structure for a user object within the application.
 * Note: the 'id' field is currently generated client-side upon successful login.
 */
type User = {
    id: string
    name: string
}

/**
 * Defines the contract of the data and functions provided by the Auth Context.
 * This specifies what consumers of the context can access.
 */
type AuthContextType = {
    user: User | null
    login: (name: string, password: string) => boolean
    logout: () => void
}

// Create the context object, initialized with 'undefined'.
// Components use this object to access the context data via useContext.
const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USERS = [
    { name: "[REDACTED_NAME]", password: "1234" },
    { name: "[REDACTED_NAME]", password: "abcd" },
]

/**
 * @function AuthProvider
 * @description The main context provider component responsible for managing the
 * user authentication state and session lifecycle (login/logout).
 * It uses client-side localStorage to persist the session across page reloads.
 * 
 * @param {{ children: ReactNode }} props - Component properties.
 * @param {ReactNode} props.children - The child components to be wrapped by the provider.
 * @returns {JSX.Element} The Context Provider wrapping the children.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    // State to hold the current user data. Initializes as null (logged out).
    const [user, setUser] = useState<User | null>(null)

    // Effects hook to check for a previously saved user session upon component mount.
    // This is the mechanism for persisting the session state after a page refresh.
    useEffect(() => {
        // Attempt to retrieve the serialized user object from browser's local storage.
        const savedUser = localStorage.getItem("coisas-partilhadas-user")
        if (savedUser) {
            // If session data is found, parse the JSON string and set the user state.
            setUser(JSON.parse(savedUser))
        }
    }, [])       // Empty dependency array ensures this runs only once on mount.

    /**
     * @function login
     * @description Attempts to log the user in by checking the provided credentials
     * against the hardcoded USERS array.
     * @param {string} name - The username provided by the user.
     * @param {string} password - The password provided by the user.
     * @returns {boolean} Returns true if login is successful, false otherwise.
     * * MISSING: Use of asynchronous API call for authentication and reception of an
     * authorization token (e.g., JWT) instead of in-memory lookup.
     */
    const login = (name: string, password: string) => {
        // Find a matching user in the hardcoded list.
        const matchedUser = USERS.find(u => u.name === name && u.password === password)
        // If no match is found, authentication fails.
        if (!matchedUser) return false

        // Create a new user object. Note: Using Date.now().toString() for ID is not robust or unique across sessions/devices.
        const newUser = { id: Date.now().toString(), name: matchedUser.name }

        // Update the React state with the logged-in user.
        setUser(newUser)
        // Persist the user object in local storage to maintain session across reloads.
        localStorage.setItem("coisas-partilhadas-user", JSON.stringify(newUser))

        return true
    }

    /**
     * @function logout
     * @description Terminates the user session.
     * It clears the local state and removes the persisted session data from local storage.
     * @returns {void}
     */
    const logout = () => {
        // Clear the user state to null.
        setUser(null)
        // Remove the stored user data from local storage.
        localStorage.removeItem("coisas-partilhadas-user")
    }

    // Render the provider, exposing the user state and the login/logout functions to consuming components.
    return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

/**
 * @function useAuth
 * @description Custom hook to easily consume the authentication context.
 * It provides the current authentication state and actions (login/logout) to any component.
 * @returns {AuthContextType} The context value.
 * @throws {Error} If the hook is used outside of an AuthProvider component (e.g., when context is undefined).
 */
export function useAuth() {
    // Attempt to retrieve the context value.
    const context = useContext(AuthContext)
    // Safety check: ensure the context is available.
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

