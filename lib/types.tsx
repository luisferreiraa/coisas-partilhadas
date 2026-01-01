export type ItemType = "livro" | "filme" | "serie" | "curso" | "app" | "website" | "local" | "evento"

export type Item = {
    id: string
    type: ItemType
    title: string
    description: string
    theme: string
    addedBy: string
    url?: string
    filePath?: string
    addedAt: string
}

// Adicione este tipo para atualização
export type UpdateItemData = Partial<Omit<Item, 'id' | 'addedAt'>> & {
    removeFile?: string
}

// Tipo para criação
export type CreateItemData = Omit<Item, "id" | "addedAt">

export const ITEM_TYPES: { value: ItemType; label: string; icon: string }[] = [
    { value: "livro", label: "Livros", icon: "📚" },
    { value: "filme", label: "Filmes", icon: "🎬" },
    { value: "serie", label: "Séries", icon: "📺" },
    { value: "app", label: "Apps", icon: "📱" },
    { value: "website", label: "Websites", icon: "🌐" },
    { value: "curso", label: "Cursos", icon: "👩‍🎓" },
    { value: "local", label: "Locais", icon: "📍" },
    { value: "evento", label: "Eventos", icon: "🎉" },
]
