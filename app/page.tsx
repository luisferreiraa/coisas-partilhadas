// app/page.tsx

// This file defines the root page component of the application. It serves as an authentication gate,
// routing the user to either the login form or the main dashboard based on their session status.

"use client"

import { useAuth } from "@/lib/auth-context" // Imports a custom hook designed to access the global authentication context and retrieve the current user's state.
import { LoginForm } from "@/components/login-form" // Imports the component responsible for displaying the user authentication interface.
import { Dashboard } from "@/components/dashboard" // Imports the main application component, which is the protected content.

/**
 * @function Home
 * @description The default page component for the root route (`/`). It conditionally renders
 * the appropriate view (login or dashboard) based on the result of the `useAuth` hook.
 * @returns {JSX.Element} Either the LoginForm or the Dashboard component.
 */
export default function Home() {
  // Destructures the `user` object (which could be null, undefined, or the authenticated user object) from the authentication context.
  const { user } = useAuth()

  // Conditional rendering: If the user object is falsy (not logged in), display the login form.
  if (!user) {
    return <LoginForm />
  }

  // If the user object is present (user is successfully authenticated), display the main dashboard.
  return <Dashboard />
}