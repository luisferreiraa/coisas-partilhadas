// lib/types.tsx

export type ItemType = "livro" | "filme" | "serie" | "curso" | "app" | "website" | "lista" | "local" | "evento"

export type Item = {
    id: string
    type: ItemType
    title: string
    description: string
    theme: string[]
    addedById: string
    addedBy?: {
        id: string
        username: string
    }
    url?: string[]
    filePath?: string[]
    addedAt: string
}

export type ItemWithFavorite = Item & {
    isFavorite: boolean
}

// Adicione este tipo para atualização
export type UpdateItemData = Partial<Omit<Item, 'id' | 'addedAt'>> & {
    removeFile?: string
}

// Tipo para criação
export type CreateItemData = Omit<Item, "id" | "addedAt">

export const ITEM_TYPES: { value: ItemType; label: string; icon: string, color: string }[] = [
    { value: "livro", label: "Livros", icon: "📚", color: "#66c5cc" },
    { value: "filme", label: "Filmes", icon: "🎬", color: "#f6cf71" },
    { value: "serie", label: "Séries", icon: "📺", color: "#f89c74" },
    { value: "app", label: "Apps", icon: "📱", color: "#dcb0f2" },
    { value: "website", label: "Websites", icon: "🌐", color: "#87c55f" },
    { value: "lista", label: "Listas", icon: "📝", color: "#9eb9f3" },
    { value: "curso", label: "Cursos", icon: "👩‍🎓", color: "#fe88b1" },
    { value: "local", label: "Locais", icon: "📍", color: "#c9db74" },
    { value: "evento", label: "Eventos", icon: "🎉", color: "#8be0a4" },
]
