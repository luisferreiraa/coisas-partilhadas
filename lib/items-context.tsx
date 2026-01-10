// lib/items-context.tsx

"use client"

import {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react"
import { Item, ItemType, UpdateItemData, CreateItemData, ItemWithFavorite } from "./types"
import { useAuth } from "./auth-context"

type ItemsContextType = {
    items: ItemWithFavorite[]
    addItem: (item: Omit<CreateItemData, "id" | "addedAt">, files?: File[]) => Promise<void>
    updateItem: (id: string, item: UpdateItemData, files?: File[]) => Promise<void>
    deleteItem: (id: string) => Promise<void>
    selectedType: ItemType | "all"
    setSelectedType: (type: ItemType | "all") => void
    selectedTheme: string
    setSelectedTheme: (theme: string) => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    themes: string[]
    pagination: {
        page: number
        totalPages: number
        totalItems: number
    }
    setPage: (page: number) => void
    toggleFavorite: (itemId: string) => Promise<void>
    showFavorites: boolean
    setShowFavorites: React.Dispatch<React.SetStateAction<boolean>>
    isLoading: boolean
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined)

export function ItemsProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ItemWithFavorite[]>([])
    const [selectedType, setSelectedType] = useState<ItemType | "all">("all")
    const [selectedTheme, setSelectedTheme] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [showFavorites, setShowFavorites] = useState(false)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [themes, setThemes] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { user, isAuthenticated } = useAuth()
    const [reloadKey, setReloadKey] = useState(0)

    // Load items with filters from API
    useEffect(() => {
        if (!user || !isAuthenticated) {
            setItems([])
            setTotalPages(1)
            setTotalItems(0)
            return
        }

        const loadItems = async () => {
            setIsLoading(true)
            const ITEMS_PER_PAGE = 9

            try {
                // Build query parameters
                const params = new URLSearchParams({
                    page: page.toString(),
                    pageSize: ITEMS_PER_PAGE.toString(),
                })

                if (selectedType !== "all") {
                    params.append("type", selectedType)
                }

                if (selectedTheme !== "all") {
                    params.append("theme", selectedTheme)
                }

                if (searchQuery.trim() !== "") {
                    params.append("search", searchQuery.trim())
                }

                if (showFavorites) {
                    params.append("showFavorites", "true")
                }

                const res = await fetch(`/api/items?${params.toString()}`, {
                    credentials: "include"
                })

                if (!res.ok) throw new Error("Erro ao carregar items")

                const data = await res.json()

                if (!Array.isArray(data.items)) {
                    console.error("Resposta inválida da API:", data)
                    setItems([])
                    setTotalPages(1)
                    setTotalItems(0)
                    return
                }

                setItems(data.items)
                setTotalPages(data.pagination.totalPages ?? 1)
                setTotalItems(data.pagination.totalItems ?? 0)
            } catch (err) {
                console.error("Erro no loadItems:", err)
                setItems([])
                setTotalPages(1)
                setTotalItems(0)
            } finally {
                setIsLoading(false)
            }
        }

        loadItems()
    }, [page, selectedType, selectedTheme, searchQuery, showFavorites, user, isAuthenticated, reloadKey])

    // Load all themes (unfiltered) for the theme selector
    useEffect(() => {
        if (!user || !isAuthenticated) {
            setThemes([])
            return
        }

        const loadThemes = async () => {
            try {
                // Fetch all items to get all possible themes
                const res = await fetch(`/api/items?page=1&pageSize=1000`, {
                    credentials: "include"
                })

                if (!res.ok) return

                const data = await res.json()

                if (Array.isArray(data.items)) {
                    const allThemes = Array.from(
                        new Set(data.items.flatMap((item: Item) => item.theme))
                    ).sort() as string[]
                    setThemes(allThemes)
                }
            } catch (err) {
                console.error("Erro ao carregar temas:", err)
            }
        }

        loadThemes()
    }, [user, isAuthenticated])

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1)
    }, [selectedType, selectedTheme, searchQuery, showFavorites])

    const toggleFavorite = async (itemId: string) => {
        if (!user || !isAuthenticated) return

        try {
            await fetch("/api/favorites", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId }),
            })

            // Optimistically update local state
            setItems((prev) =>
                prev.map((item) =>
                    item.id === itemId
                        ? { ...item, isFavorite: !item.isFavorite }
                        : item
                )
            )
        } catch (err) {
            console.error("Erro ao toggle favorite:", err)
        }
    }

    const refreshThemesIfNew = async (newThemes: string[] | string) => {
        const newThemeArray = Array.isArray(newThemes) ? newThemes : [newThemes]

        const hasNewTheme = newThemeArray.some(t => !themes.includes(t))
        if (!hasNewTheme) return

        try {
            const res = await fetch(`/api/items?page=1&pageSize=1000`, {
                credentials: "include"
            });
            if (!res.ok) return

            const data = await res.json()
            if (Array.isArray(data.items)) {
                const allThemes = Array.from(
                    new Set(data.items.flatMap((item: Item) => item.theme))
                ).sort() as string[]
                setThemes(allThemes)
            }
        } catch (err) {
            console.error("Erro ao atualizar themes:", err)
        }
    }

    const addItem = async (itemData: Omit<CreateItemData, "id" | "addedAt">, files?: File[]) => {
        if (!isAuthenticated) {
            console.error("Não autenticado")
            return
        }

        try {
            const formData = new FormData()
            formData.append("type", itemData.type)
            formData.append("title", itemData.title)
            formData.append("description", itemData.description)

            if (Array.isArray(itemData.theme)) {
                itemData.theme.forEach((t) => formData.append("theme", t))
            } else {
                formData.append("theme", itemData.theme)
            }

            if (itemData.url) {
                if (Array.isArray(itemData.url)) {
                    itemData.url.forEach((link) => formData.append("url", link))
                } else {
                    formData.append("url", itemData.url)
                }
            }

            if (files && files.length > 0) {
                files.forEach((file) => formData.append("files", file))
            }

            const res = await fetch("/api/items", {
                method: "POST",
                credentials: "include",
                body: formData,
            })

            if (!res.ok) throw new Error("Erro ao criar item")

            // Reload items to reflect new item
            setPage(1) // Go to first page to see new item
            setReloadKey((k) => k + 1)

            await refreshThemesIfNew(itemData.theme)
        } catch (err) {
            console.error(err)
        }
    }

    const updateItem = async (id: string, updatedData: UpdateItemData, files?: File[]) => {
        if (!isAuthenticated) {
            console.error("Não autenticado")
            return
        }

        try {
            const formData = new FormData()

            Object.entries(updatedData).forEach(([key, value]) => {
                if (value === undefined || value === null || key === "removeFile") return

                if (Array.isArray(value)) {
                    value.forEach(v => formData.append(key, v))
                } else if (typeof value === "object" && "id" in value) {
                    formData.append(key, value.id)
                } else {
                    formData.append(key, value.toString())
                }
            })

            if (updatedData.removeFile) {
                formData.append("removeFile", updatedData.removeFile)
            }

            if (files && files.length > 0) {
                files.forEach((file) => formData.append("files", file))
            }

            const res = await fetch(`/api/items/${id}`, {
                method: "PUT",
                credentials: "include",
                body: formData,
            })

            if (!res.ok) throw new Error("Erro ao atualizar item")

            const updatedItem: Item = await res.json()

            // Update item in local state
            setItems((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? { ...updatedItem, isFavorite: item.isFavorite }
                        : item
                )
            )
        } catch (err) {
            console.error(err)
        }
    }

    // const deleteItem = async (id: string) => {
    //     if (!isAuthenticated) {
    //         console.error("Não autenticado")
    //         return
    //     }

    //     try {

    //         const itemToDelete = items.find(item => item.id === id)
    //         if (!itemToDelete) return;

    //         const res = await fetch(`/api/items/${id}`, {
    //             method: "DELETE",
    //             credentials: "include",
    //         })

    //         if (!res.ok) throw new Error("Erro ao apagar item")

    //         // Remove item from local state
    //         setItems((prev) => prev.filter((item) => item.id !== id))

    //         // Adjust total items count
    //         setTotalItems(prev => prev - 1)
    //         await refreshThemesIfMissing(itemToDelete.theme)
    //     } catch (err) {
    //         console.error(err)
    //     }
    // }

    const deleteItem = async (id: string) => {
        if (!isAuthenticated) {
            console.error("Não autenticado")
            return
        }

        try {
            const itemToDelete = items.find(item => item.id === id)
            if (!itemToDelete) return;

            const res = await fetch(`/api/items/${id}`, {
                method: "DELETE",
                credentials: "include",
            })

            if (!res.ok) throw new Error("Erro ao apagar item")

            const newItems = items.filter(item => item.id !== id)
            setItems(newItems)
            setTotalItems(prev => prev - 1)

            const deletedThemesArray = Array.isArray(itemToDelete.theme) ? itemToDelete.theme : [itemToDelete.theme]

            const missingTheme = deletedThemesArray.some(t => !newItems.some(item => item.theme.includes(t)))
            if (missingTheme) {
                const resThemes = await fetch(`/api/items?page=1&pageSize=1000`, {
                    credentials: "include"
                });
                if (!resThemes.ok) return;

                const data = await resThemes.json();
                if (Array.isArray(data.items)) {
                    const allThemes = Array.from(
                        new Set(data.items.flatMap((item: Item) => item.theme))
                    ).sort() as string[];
                    setThemes(allThemes);
                }
            }

        } catch (err) {
            console.error(err)
        }
    }

    return (
        <ItemsContext.Provider
            value={{
                items,
                addItem,
                updateItem,
                deleteItem,
                selectedType,
                setSelectedType,
                selectedTheme,
                setSelectedTheme,
                searchQuery,
                setSearchQuery,
                themes,
                pagination: {
                    page,
                    totalPages,
                    totalItems,
                },
                setPage,
                toggleFavorite,
                showFavorites,
                setShowFavorites,
                isLoading,
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