// app/api/favorites/route.ts

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get("username")

    if (!username) {
        return NextResponse.json(
            { error: "Username obrigatório" },
            { status: 400 }
        )
    }

    const favorites = await prisma.favorite.findMany({
        where: { username },
        select: { itemId: true },
    })

    return NextResponse.json(favorites.map(f => f.itemId))
}

export async function POST(req: Request) {
    const { username, itemId } = await req.json()

    if (!username || !itemId) {
        return NextResponse.json(
            { error: "Dados em falta" },
            { status: 400 }
        )
    }

    const existing = await prisma.favorite.findUnique({
        where: {
            username_itemId: { username, itemId },
        },
    })

    if (existing) {
        await prisma.favorite.delete({
            where: { id: existing.id },
        })
        return NextResponse.json({ favorited: false })
    }

    await prisma.favorite.create({
        data: { username, itemId },
    })

    return NextResponse.json({ favorited: true })
}