// lib/items-context.tsx

"use client"

import {
    createContext, // Function to create a new Context object.
    useContext, // Hook to consume a Context object.
    useState, // Hook for managing component local state.
    useEffect, // Hook for performing side effects (like data fetching).
    type ReactNode, // Type definition for children prop.
} from "react"
// Imports required data types from the local types definition file.
import { Item, ItemType, UpdateItemData, CreateItemData, ItemWithFavorite } from "./types"
// Imports the custom authentication hook to check user status.
import { useAuth } from "./auth-context"

// Defines the structure and available functions/ data provided by the ItemContext.
type ItemsContextType = {
    items: ItemWithFavorite[]
    addItem: (item: Omit<CreateItemData, "id" | "addedAt">, files?: File[]) => Promise<void>
    updateItem: (id: string, item: UpdateItemData, files?: File[]) => Promise<void>
    deleteItem: (id: string) => Promise<{ error: string } | undefined>
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

// Creates the context object. The initial value is undefined, indicating no provider is active.
const ItemsContext = createContext<ItemsContextType | undefined>(undefined)

/**
 * @function ItemsProvider
 * @description The main provider component that manages item state, filtering, pagination, and CRUD operations.
 * It provides the state and methods to all consuming components via the ItemsContext.
 *
 * @param {object} props - Component props.
 * @param {ReactNode} props.children - Child elements to be wrapped by the provider.
 * @returns {JSX.Element} The Context Provider component.
 */
export function ItemsProvider({ children }: { children: ReactNode }) {
    // State for the main list of items, initialized as an empty array.
    const [items, setItems] = useState<ItemWithFavorite[]>([])
    // State for the item type filter, defaults to "all".
    const [selectedType, setSelectedType] = useState<ItemType | "all">("all")
    // State for the theme filter, defaults to "all".
    const [selectedTheme, setSelectedTheme] = useState<string>("all")
    // State for the search text input.
    const [searchQuery, setSearchQuery] = useState("")
    // State to toggle between showing all items or only favorites.
    const [showFavorites, setShowFavorites] = useState(false)
    // State for the current page number, defaults to 1.
    const [page, setPage] = useState(1)
    // State for the total number of pages available.
    const [totalPages, setTotalPages] = useState(1)
    // State for the total number of items matching the current filters.
    const [totalItems, setTotalItems] = useState(0)
    // State to hold the list of all available themes.
    const [themes, setThemes] = useState<string[]>([])
    // State to track loading status for data fetching.
    const [isLoading, setIsLoading] = useState(false)
    // Destructures user and authentication status from the AuthContext.
    const { user, isAuthenticated } = useAuth()
    // Key used to force a reload of the items data (e.g., after a successful write operation).
    const [reloadKey, setReloadKey] = useState(0)

    // Effect to load items based on current filters and pagination settings.
    useEffect(() => {
        // Guard clause: If the user is not authenticated, clear the items and reset pagination.
        if (!user || !isAuthenticated) {
            setItems([])
            setTotalPages(1)
            setTotalItems(0)
            return
        }

        /**
        * @async
        * @function loadItems
        * @description Fetches items from the API, applies filters, and updates state.
        * @returns {Promise<void>}
        */
        const loadItems = async () => {
            setIsLoading(true)
            const ITEMS_PER_PAGE = 9

            try {
                // Initializes URLSearchParams object for building the query string.
                const params = new URLSearchParams({
                    page: page.toString(),
                    pageSize: ITEMS_PER_PAGE.toString(),
                })

                // Appends the 'type' filter if it's not set to "all".
                if (selectedType !== "all") {
                    params.append("type", selectedType)
                }

                // Appends the 'theme' filter if it's not set to "all".
                if (selectedTheme !== "all") {
                    params.append("theme", selectedTheme)
                }

                // Appends the 'search' query if it's not empty.
                if (searchQuery.trim() !== "") {
                    params.append("search", searchQuery.trim())
                }

                // Appends the 'showFavorites' flag if the user wants to see only favorites.
                if (showFavorites) {
                    params.append("showFavorites", "true")
                }

                // Fetches data from the /api/items endpoint with the constructed query parameters.
                const res = await fetch(`/api/items?${params.toString()}`, {
                    // Ensures cookies (e.g., auth token) are included in the request.
                    credentials: "include"
                })

                // Checks for HTTP errors.
                if (!res.ok) throw new Error("Erro ao carregar items")

                // Parses the JSON response body.
                const data = await res.json()

                // Data validation: Ensures the returned items array exists.
                if (!Array.isArray(data.items)) {
                    console.error("Resposta inválida da API:", data)
                    setItems([])
                    setTotalPages(1)
                    setTotalItems(0)
                    return
                }

                // Updates the main items state.
                setItems(data.items)
                // Updates pagination metadata, using a default of 1 or 0 if undefined.
                setTotalPages(data.pagination.totalPages ?? 1)
                setTotalItems(data.pagination.totalItems ?? 0)
            } catch (err) {
                // Handles fetch or processing errors.
                console.error("Erro no loadItems:", err)
                setItems([])
                setTotalPages(1)
                setTotalItems(0)
            } finally {
                // Sets loading state to false regardless of success or failure.
                setIsLoading(false)
            }
        }

        // Executes the function to load items.
        loadItems()
        // Dependencies array: Reruns the effect whenever these values change.
    }, [page, selectedType, selectedTheme, searchQuery, showFavorites, user, isAuthenticated, reloadKey])

    // Effect to load the full list of available themes.
    useEffect(() => {
        // Guard clause: Prevents fetching themes if the user is not authenticated.
        if (!user || !isAuthenticated) {
            setThemes([])
            return
        }

        /**
       * @async
       * @function loadThemes
       * @description Fetches all available themes from the API and updates state.
       * @returns {Promise<void>}
       */
        const loadThemes = async () => {
            try {
                // Fetches a large page size of items (or a specific themes endpoint if one existed)
                // to extract all unique themes present in the database.
                const res = await fetch(`/api/items?page=1&pageSize=1000`, {
                    credentials: "include"
                })

                if (!res.ok) return     // Silently exits on fetch error.

                const data = await res.json()

                if (Array.isArray(data.items)) {
                    // Extracts all 'theme' properties from all items, flattens, gets unique values (Set),
                    // and sorts them alphabetically.
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
        // Dependencies array: Reruns the effect only when auth status changes.
    }, [user, isAuthenticated])

    // Effect to reset the page number to 1 whenever a filter or search term changes.
    useEffect(() => {
        setPage(1)
        // Dependencies array: Reruns on changes to filters or search.
    }, [selectedType, selectedTheme, searchQuery, showFavorites])

    /**
   * @async
   * @function toggleFavorite
   * @description Sends a request to the API to change an item's favorite status and updates the local item state.
   * @param {string} itemId - The ID of the item to modify.
   * @returns {Promise<void>}
   */
    const toggleFavorite = async (itemId: string) => {
        // Guard clause: Requires authentication.
        if (!user || !isAuthenticated) return

        try {
            // API Call: Sends a POST request to the favorites endpoint.
            await fetch("/api/favorites", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId }),
            })

            // Optimistic Local State Update: Instantly toggles the isFavorite status in the UI.
            setItems((prev) =>
                prev.map((item) =>
                    item.id === itemId
                        ? { ...item, isFavorite: !item.isFavorite }     // Toggle the flag for the matching item.
                        : item
                )
            )
        } catch (err) {
            console.error("Erro ao toggle favorite:", err)
        }
    }

    /**
   * @async
   * @function refreshThemesIfNew
   * @description Checks if the newly added/updated themes are already in the themes list. If not, it fetches the updated theme list.
   * @param {string[] | string} newThemes - The theme(s) involved in the recent item operation.
   * @returns {Promise<void>}
   */
    const refreshThemesIfNew = async (newThemes: string[] | string) => {
        // Normalizes the input into an array.
        const newThemeArray = Array.isArray(newThemes) ? newThemes : [newThemes]

        // Checks if any of the new themes are missing from the current state.
        const hasNewTheme = newThemeArray.some(t => !themes.includes(t))
        if (!hasNewTheme) return

        try {
            // Re-fetches a full list of items to regenerate the unique themes list.
            const res = await fetch(`/api/items?page=1&pageSize=1000`, {
                credentials: "include"
            });
            if (!res.ok) return

            const data = await res.json()
            if (Array.isArray(data.items)) {
                // Recalculates the unique and sorted theme list.
                const allThemes = Array.from(
                    new Set(data.items.flatMap((item: Item) => item.theme))
                ).sort() as string[]
                setThemes(allThemes)        // Updates the global themes state.
            }
        } catch (err) {
            console.error("Erro ao atualizar themes:", err)
        }
    }

    /**
     * @async
     * @function addItem
     * @description Creates a new item by sending a multipart/form-data request to the API.
     * @param {Omit<CreateItemData, "id" | "addedAt">} itemData - The data for the new item.
     * @param {File[]} [files] - Optional array of File objects.
     * @returns {Promise<void>}
     */
    const addItem = async (itemData: Omit<CreateItemData, "id" | "addedAt">, files?: File[]) => {
        // Guard clause: Requires authentication.
        if (!isAuthenticated) {
            console.error("Não autenticado")
            return
        }

        try {
            // Uses FormData for sending both JSON data and files in a single request.
            const formData = new FormData()
            formData.append("type", itemData.type)
            formData.append("title", itemData.title)
            formData.append("description", itemData.description)

            // Handles appending theme(s) (which can be a string or an array of strings).
            if (Array.isArray(itemData.theme)) {
                itemData.theme.forEach((t) => formData.append("theme", t))
            } else {
                formData.append("theme", itemData.theme)
            }

            // Handles appending URL(s).
            if (itemData.url) {
                if (Array.isArray(itemData.url)) {
                    itemData.url.forEach((link) => formData.append("url", link))
                } else {
                    formData.append("url", itemData.url)
                }
            }

            // Appends file attachments to the FormData object.
            if (files && files.length > 0) {
                files.forEach((file) => formData.append("files", file))
            }

            // API Call: POST request to create the item.
            const res = await fetch("/api/items", {
                method: "POST",
                credentials: "include",
                body: formData,     // FormData is used instead of JSON.stringify.
            })

            if (!res.ok) throw new Error("Erro ao criar item")

            // After creation, reset to the first page (where the new item likely appears)
            setPage(1)
            // Increments reloadKey to trigger the useEffect that fetches the items list.
            setReloadKey((k) => k + 1)

            // Checks if the theme list needs to be updated because of the new item.
            await refreshThemesIfNew(itemData.theme)
        } catch (err) {
            console.error(err)
        }
    }

    /**
     * @async
     * @function updateItem
     * @description Updates an existing item using a PUT request with FormData.
     * @param {string} id - The ID of the item to update.
     * @param {UpdateItemData} updatedData - The fields to update.
     * @param {File[]} [files] - Optional array of new File objects.
     * @returns {Promise<void>}
     */
    const updateItem = async (id: string, updatedData: UpdateItemData, files?: File[]) => {
        // Guard clause: Requires authentication
        if (!isAuthenticated) {
            console.error("Não autenticado")
            return
        }

        try {
            const formData = new FormData()

            // Iterates over the updated data object to append non-null/non-undefined values to FormData.
            Object.entries(updatedData).forEach(([key, value]) => {
                if (value === undefined || value === null || key === "removeFile") return

                // Handles fields that are arrays (e.g., 'theme', 'url').
                if (Array.isArray(value)) {
                    value.forEach(v => formData.append(key, v))
                    // Handles fields that might be a structured object (e.g., if a file object with an ID was used).
                } else if (typeof value === "object" && "id" in value) {
                    formData.append(key, value.id)
                } else {
                    // Handles all other primitive values (string, number, boolean).
                    formData.append(key, value.toString())
                }
            })

            // Appends the specific ID of the file to be removed, if provided.
            if (updatedData.removeFile) {
                formData.append("removeFile", updatedData.removeFile)
            }

            // Appends any new file attachments.
            if (files && files.length > 0) {
                files.forEach((file) => formData.append("files", file))
            }

            // API Call: PUT request to update the specific item.
            const res = await fetch(`/api/items/${id}`, {
                method: "PUT",
                credentials: "include",
                body: formData,
            })

            if (!res.ok) throw new Error("Erro ao atualizar item")

            // Parses the updated item object returned by the server.
            const updatedItem: Item = await res.json()

            // Updates the local state by replacing the old version of the item with the new one.
            setItems((prev) =>
                prev.map((item) =>
                    // Merges the updated data with the existing 'isFavorite' status (since the API response might not include it).
                    item.id === id
                        ? { ...updatedItem, isFavorite: item.isFavorite }
                        : item
                )
            )
        } catch (err) {
            console.error(err)
        }
    }

    /**
     * @async
     * @function deleteItem
     * @description Deletes an item via the API and updates local state, including themes if necessary.
     * @param {string} id - The ID of the item to delete.
     * @returns {Promise<void>}
     */
    const deleteItem = async (id: string) => {
        // Guard clause: Requires authentication.
        if (!isAuthenticated) {
            console.error("Não autenticado")
            return
        }

        try {
            // Finds the item locally before deletion to check its theme(s) later.
            const itemToDelete = items.find(item => item.id === id)
            if (!itemToDelete) return       // Exits if item is not found in local state.

            // Verification: Check if the current user is the owner of the item
            if (itemToDelete.addedBy?.id !== user?.id) {
                return { error: "not_owner" }
            }

            // API Call: DELETE request for the specific item.
            const res = await fetch(`/api/items/${id}`, {
                method: "DELETE",
                credentials: "include",
            })

            if (!res.ok) throw new Error("Erro ao apagar item")

            // Local State Update: Removes the item from the local array.
            const newItems = items.filter(item => item.id !== id)
            setItems(newItems)
            // Decrements the total count of items.
            setTotalItems(prev => prev - 1)

            // Extracts the theme(s) of the deleted item.
            const deletedThemesArray = Array.isArray(itemToDelete.theme) ? itemToDelete.theme : [itemToDelete.theme]

            // Checks if any of the deleted item's themes are no longer present in the remaining items.
            const missingTheme = deletedThemesArray.some(t => !newItems.some(item => item.theme.includes(t)))
            // If a theme is now obsolete, re-fetch the theme list.
            if (missingTheme) {
                const resThemes = await fetch(`/api/items?page=1&pageSize=1000`, {
                    credentials: "include"
                });
                if (!resThemes.ok) return;

                const data = await resThemes.json();
                if (Array.isArray(data.items)) {
                    // Recalculates the unique and sorted theme list based on current data.
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

    // Renders the Context Provider, making all state and methods available to children.
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

/**
 * @function useItems
 * @description A custom hook that simplifies consuming the ItemsContext.
 * @returns {ItemsContextType} The context value containing items state and actions.
 * @throws {Error} If used outside of an ItemsProvider.
 */
export function useItems() {
    // Consumes the context.
    const context = useContext(ItemsContext)
    // Error handling: Ensures the hook is called within the correct provider scope.
    if (!context) {
        throw new Error("useItems must be used within an ItemsProvider")
    }
    return context
}