"use client"

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react"
import { Item, ItemType, UpdateItemData, CreateItemData } from "./types"

type ItemsContextType = {
    items: Item[]
    addItem: (item: Omit<CreateItemData, "id" | "addedAt">, file?: File) => Promise<void>
    updateItem: (id: string, item: UpdateItemData, file?: File) => Promise<void>
    deleteItem: (id: string) => Promise<void>
    filteredItems: Item[]
    selectedType: ItemType | "all"
    setSelectedType: (type: ItemType | "all") => void
    selectedTheme: string
    setSelectedTheme: (theme: string) => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    themes: string[]
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined)

export function ItemsProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<Item[]>([])
    const [selectedType, setSelectedType] = useState<ItemType | "all">("all")
    const [selectedTheme, setSelectedTheme] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")

    /* --------------------------------------------------
     * LOAD ITEMS FROM DATABASE (API)
     * -------------------------------------------------- */
    useEffect(() => {
        const loadItems = async () => {
            try {
                const res = await fetch("/api/items")
                if (!res.ok) throw new Error("Erro ao carregar items")
                const data = await res.json()
                setItems(data)
            } catch (err) {
                console.error(err)
            }
        }

        loadItems()
    }, [])

    /* --------------------------------------------------
     * CRUD OPERATIONS
     * -------------------------------------------------- */

    const addItem = async (itemData: Omit<CreateItemData, "id" | "addedAt">, file?: File) => {
        try {
            const formData = new FormData()
            formData.append("type", itemData.type)
            formData.append("title", itemData.title)
            formData.append("description", itemData.description)
            formData.append("theme", itemData.theme)
            formData.append("addedBy", itemData.addedBy)
            if (itemData.url) formData.append("url", itemData.url)
            if (file) formData.append("file", file)

            const res = await fetch("/api/items", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) throw new Error("Erro ao criar item")

            const newItem: Item = await res.json()
            setItems((prev) => [newItem, ...prev])
        } catch (err) {
            console.error(err)
        }
    }

    const updateItem = async (id: string, updatedData: UpdateItemData, file?: File) => {
        try {
            const formData = new FormData()

            // Adiciona todos os campos do updatedData ao FormData
            Object.entries(updatedData).forEach(([key, value]) => {
                if (value !== undefined && value !== null && key !== 'removeFile') {
                    formData.append(key, String(value))
                }
            })

            if (updatedData.removeFile) {
                formData.append("removeFile", updatedData.removeFile)
            }

            if (file) formData.append("file", file)

            const res = await fetch(`/api/items/${id}`, {
                method: "PUT",
                body: formData,
            })

            if (!res.ok) throw new Error("Erro ao atualizar item")

            const updatedItem: Item = await res.json()
            setItems((prev) =>
                prev.map((item) => (item.id === id ? updatedItem : item))
            )
        } catch (err) {
            console.error(err)
        }
    }

    const deleteItem = async (id: string) => {
        try {
            const res = await fetch(`/api/items/${id}`, {
                method: "DELETE",
            })

            if (!res.ok) throw new Error("Erro ao apagar item")

            setItems((prev) => prev.filter((item) => item.id !== id))
        } catch (err) {
            console.error(err)
        }
    }

    /* --------------------------------------------------
     * DERIVED STATE
     * -------------------------------------------------- */

    const themes = Array.from(new Set(items.map((item) => item.theme))).sort()

    const filteredItems = items.filter((item) => {
        const typeMatch = selectedType === "all" || item.type === selectedType
        const themeMatch = selectedTheme === "all" || item.theme === selectedTheme
        const searchMatch =
            searchQuery === "" ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())

        return typeMatch && themeMatch && searchMatch
    })

    return (
        <ItemsContext.Provider
            value={{
                items,
                addItem,
                updateItem,
                deleteItem,
                filteredItems,
                selectedType,
                setSelectedType,
                selectedTheme,
                setSelectedTheme,
                searchQuery,
                setSearchQuery,
                themes,
            }}
        >
            {children}
        </ItemsContext.Provider>
    )
}

export function useItems() {
    const context = useContext(ItemsContext)
    if (!context) {
        throw new Error("useItems must be used within an ItemsProvider")
    }
    return context
}