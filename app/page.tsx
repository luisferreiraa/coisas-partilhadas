"use client"

import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  const { user } = useAuth()

  if (!user) {
    return <LoginForm />
  }

  return <Dashboard />
}