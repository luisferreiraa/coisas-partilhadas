// lib/auth-server.ts
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET!

type JwtPayload = {
    sub: string
    username: string
}

export async function getUserFromRequest(): Promise<JwtPayload> {
    const cookieStore = await cookies()
    const token = cookieStore.get("cp:token")?.value

    if (!token) {
        throw new Error("Not authenticated")
    }

    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload
    } catch {
        throw new Error("Invalid token")
    }
}
