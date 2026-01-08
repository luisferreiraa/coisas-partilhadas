// app/api/favorites/route.ts

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth-server"

export async function GET(req: Request) {
    try {
        const user = await getUserFromRequest()

        const favorites = await prisma.favorite.findMany({
            where: { userId: user.sub },  // ✅ Usar sub do JWT
            select: { itemId: true },
        })

        return NextResponse.json(favorites.map(f => f.itemId))
    } catch (error) {
        console.error("Error fetching favorites:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch favorites" },
            { status: 401 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const user = await getUserFromRequest()

        const { itemId } = await req.json()

        if (!itemId) {
            return NextResponse.json(
                { error: "itemId obrigatório" },
                { status: 400 }
            )
        }

        const existing = await prisma.favorite.findUnique({
            where: {
                userId_itemId: { userId: user.sub, itemId },  // ✅ Usar sub
            },
        })

        if (existing) {
            await prisma.favorite.delete({
                where: { id: existing.id },
            })
            return NextResponse.json({ favorited: false })
        }

        await prisma.favorite.create({
            data: { userId: user.sub, itemId },  // ✅ Usar sub
        })

        return NextResponse.json({ favorited: true })
    } catch (error) {
        console.error("Error toggling favorite:", error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to toggle favorite" },
            { status: 500 }
        )
    }
}