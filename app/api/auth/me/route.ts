// app/api/auth/me/route.ts

import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import prisma from "@/lib/prisma"

const JWT_SECRET = process.env.JWT_SECRET!

export async function GET(req: Request) {
    try {
        const cookieHeader = req.headers.get("cookie")

        if (!cookieHeader) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
            )
        }

        const token = cookieHeader
            .split("; ")
            .find(row => row.startsWith("cp:token="))
            ?.split("=")[1]

        if (!token) {
            return NextResponse.json(
                { error: "Token em falta" },
                { status: 401 }
            )
        }

        const payload = jwt.verify(token, JWT_SECRET) as {
            sub: string
        }

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                username: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: "Utilizador não encontrado" },
                { status: 401 }
            )
        }

        return NextResponse.json({ user })
    } catch (error) {
        return NextResponse.json(
            { error: "Sessão inválida ou expirada" },
            { status: 401 }
        )
    }
}
