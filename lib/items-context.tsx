// // lib/items-context

// // Directive indicating this module should be treated as client-side code
// // enabling the use of hooks and interactivity.
// "use client"

// import {
//     createContext,      // Function to create a new React Context object.
//     useContext,     // Hook to consume context values within functional components.
//     useState,       // Hook to manage local component state.
//     useEffect,      // Hook to manage side effects, like data fetching on mount.
//     type ReactNode,     // Type for content passed to the component (children).
// } from "react"
// // Import type definitions for the Item entity and data transfer objects (DTOs).
// import { Item, ItemType, UpdateItemData, CreateItemData, ItemWithFavorite } from "./types"
// import { useAuth } from "./auth-context"        // Custom hook to access authentication information (user data).

// /**
//  * Defines the structure of the data and functions provided by the Items Context.
//  * This contract specifies what consumers of the context can access.
//  */
// type ItemsContextType = {
//     items: ItemWithFavorite[]       // The complete, unfiltered list of all items retrieved from the API, including the 'isFavorite' flag.
//     addItem: (item: Omit<CreateItemData, "id" | "addedAt">, files?: File[]) => Promise<void>       // Sends a request to the API to create a new item.
//     updateItem: (id: string, item: UpdateItemData, files?: File[]) => Promise<void>            // Sends a request to the API to update an existing item by ID.
//     deleteItem: (id: string) => Promise<void>       // Sends a request to the API to delete an item by ID.
//     filteredItems: ItemWithFavorite[]       // The list of items after applying type, theme, and search filters.
//     selectedType: ItemType | "all"      // The currently active filter for item type ('all' is the default/no filter).
//     setSelectedType: (type: ItemType | "all") => void       // Function to set the active type filter.
//     selectedTheme: string       //The currently active filter for theme ('all' is the default/no filter).
//     setSelectedTheme: (theme: string) => void       // Function to set the active theme filter.
//     searchQuery: string     // The current text query used for searching item title and description.
//     setSearchQuery: (query: string) => void     // Function to set the search query.
//     themes: string[]        // A dynamically generated, sorted list of all unique themes present across all current items.
//     pagination: {
//         page: number        // The current page number being displayed.
//         totalPages: number      // The total number of pages available for the current item set.
//     }
//     setPage: (page: number) => void     // Function to change the current pagination page.
//     toggleFavorite: (itemId: string) => Promise<void>       // Function to add or remove an item from the user's favorites list via API.
//     showFavorites: boolean      // Boolean state indicating whether the results should be filtered to show only favorites.
//     setShowFavorites: React.Dispatch<React.SetStateAction<boolean>>     // Setter function to toggle the favorite filter state.
// }

// // Create the context object, initialized with 'undefined'.
// // This is the object that components will import and pass to useContext.
// const ItemsContext = createContext<ItemsContextType | undefined>(undefined)

// /**
//  * The main provider component that manages the state, logic, and CRUD operations
//  * for the items data, making them available to all descendant components.
//  * 
//  * @param {object} props - Component properties.
//  * @param {ReactNode} props.children - The child components to be wrapped by the provider.
//  * @returns {JSX.Element} The Context Provider wrapping the children.
//  */
// export function ItemsProvider({ children }: { children: ReactNode }) {
//     // State holding the core data: the full list of items, including favorite status.
//     const [items, setItems] = useState<ItemWithFavorite[]>([])
//     // State for filtering by item type ("all" initially).
//     const [selectedType, setSelectedType] = useState<ItemType | "all">("all")
//     // State for filtering by theme ("all" initially).
//     const [selectedTheme, setSelectedTheme] = useState<string>("all")
//     // State for text search queries.
//     const [searchQuery, setSearchQuery] = useState("")
//     // State to toggle filtering by user favorites.
//     const [showFavorites, setShowFavorites] = useState(false)
//     // State for the current page in the pagination system (controlled by the Dashboard component).
//     const [page, setPage] = useState(1)
//     // State for the total number of pages available (set after API response).
//     const [totalPages, setTotalPages] = useState(1)
//     // Access the current authenticated user details.
//     const { user, isAuthenticated } = useAuth()

//     // --- Data Loading and Synchronization ---

//     /**
//      * Effect hook to fetch items and synchronize favorite status whenever the page number or user changes.
//      * This effect handles the primary data loading for the application.
//      */
//     useEffect(() => {

//         if (!user || !isAuthenticated) {
//             setItems([])
//             setTotalPages(1)
//             return
//         }

//         const loadItems = async () => {

//             const ITEMS_PER_PAGE = 10        // Define the size of the pagination windown.

//             try {
//                 // 1. Fetch the paginated list of items from the API.
//                 const res = await fetch(`/api/items?page=${page}&pageSize=${ITEMS_PER_PAGE}`, {
//                     credentials: "include"
//                 })

//                 if (!res.ok) throw new Error("Erro ao carregar items")      // Handle non-2xx status codes.

//                 const data = await res.json()

//                 // Safety check for valid API response structure.
//                 if (!Array.isArray(data.items)) {
//                     console.error("Resposta inválida da API:", data)
//                     setItems([])
//                     setTotalPages(1)
//                     return
//                 }

//                 // 2. If a user is authenticated, fetch their favorites to enrich the item data.
//                 if (user && isAuthenticated) {
//                     // Fetch the list of favorited item IDs for the current user.
//                     const favRes = await fetch(`/api/favorites`, {
//                         credentials: "include"
//                     })

//                     if (!favRes.ok) throw new Error("Erro ao carregar favorites")

//                     const favoriteIds: string[] = await favRes.json()

//                     // Merge item data with favorite status.
//                     const itemsWithFavorites = data.items.map((item: Item) => ({
//                         ...item,
//                         isFavorite: favoriteIds.includes(item.id),      // Set the flag based on the fetched IDs.
//                     }))

//                     setItems(itemsWithFavorites)
//                 } else {
//                     // If no user is logged in, use the raw item data (isFavorite will be undefined/false-by-default).
//                     setItems(data.items)
//                 }
//                 // Update the total pages for pagination display.
//                 setTotalPages(data.pagination.totalPages ?? 1)
//             } catch (err) {
//                 console.error("Erro no loadItems:", err)
//                 setItems([])
//                 setTotalPages(1)
//             }
//         }

//         loadItems()
//     }, [page, user, isAuthenticated])        // Re-run effect when current page or authenticated user changes.


//     /**
//      * @function toggleFavorite
//      * @description Toggles the favorite status of a specific item for the current user.
//      * It makes a POST request to the favorites API and optimistically updates the local state.
//      * @param {string} itemId - The ID of the item to favorite/unfavorite. 
//      * @returns {Promise<void>}
//      */
//     const toggleFavorite = async (itemId: string) => {
//         if (!user || !isAuthenticated) return       // Cannot toggle favorite if no user is logged in.

//         await fetch("/api/favorites", {
//             method: "POST",
//             credentials: "include",
//             body: JSON.stringify({ itemId }),
//         })

//         // Optimistically update the local state: invert the 'isFavorite' status for the toggled item.
//         setItems((prev) =>
//             prev.map((item) =>
//                 item.id === itemId
//                     ? { ...item, isFavorite: !item.isFavorite }     // Toggle the flag.
//                     : item
//             )
//         )
//     }

//     // --- CRUD Operations ---

//     /**
//      * @function addItem
//      * @description Handles the creation of a new item.
//      * It uses FormData to correctly handle both text fields and file uploads to the API.
//      * 
//      * @param {Omit<CreateItemData, "id" | "addedAt">} itemData - Object containing item properties (excluding auto-generated fields).
//      * @param {Files[]} [files] - Optional array of files to upload with the item.
//      * @returns {Promise<void>}
//      */
//     const addItem = async (itemData: Omit<CreateItemData, "id" | "addedAt">, files?: File[]) => {

//         if (!isAuthenticated) {
//             console.error("Não autenticado")
//             return
//         }

//         try {
//             // Initialize FormData to send a multipart/form-data request, necessary for files.
//             const formData = new FormData()

//             // Append required string fields.
//             formData.append("type", itemData.type)
//             formData.append("title", itemData.title)
//             formData.append("description", itemData.description)
//             // formData.append("addedBy", itemData.addedBy)

//             // Append "theme" field(s). Handles both single string and array of themes.
//             if (Array.isArray(itemData.theme)) {
//                 itemData.theme.forEach((t) => formData.append("theme", t))
//             } else {
//                 formData.append("theme", itemData.theme)
//             }

//             // Append 'url' field(s). Handles both single string and array of URLs.
//             if (itemData.url) {
//                 if (Array.isArray(itemData.url)) {
//                     itemData.url.forEach((link) => formData.append("url", link))
//                 } else {
//                     formData.append("url", itemData.url)
//                 }
//             }

//             // Append any files provided to the FormData object under the 'files' key.
//             if (files && files.length > 0) {
//                 files.forEach((file) => {
//                     formData.append("files", file)
//                 })
//             }

//             // Send a POST request to the API to create the item.
//             const res = await fetch("/api/items", {
//                 method: "POST",
//                 credentials: "include",
//                 body: formData,     // FormData handles the content type headers automatically.
//             })

//             if (!res.ok) throw new Error("Erro ao criar item")

//             // Receive the newly created item (including its generated ID).
//             const newItem: Item = await res.json()
//             // Update the local state: prepend the new item (initially not marked as favorite) to the list.
//             setItems((prev) => [
//                 {
//                     ...newItem,
//                     isFavorite: false,      // New items start as not favorited.
//                 },
//                 ...prev,
//             ])
//         } catch (err) {
//             console.error(err)
//         }
//     }


//     /**
//      * @function updateItem
//      * @description Handles updating an existing item by ID.
//      * It uses FormData and supports updating fields, uploading a new file, or removing an existing file.
//      * 
//      * @param {string} id - The ID of the item to update. 
//      * @param {UpdateItemData} updatedData - The data fields to modify, including an optional 'removeFile' flag.
//      * @param {File[]} [files] - Optional new file(s) to attach (replaces existing file).
//      * @returns {Promise<void>}
//      */
//     const updateItem = async (id: string, updatedData: UpdateItemData, files?: File[]) => {

//         if (!isAuthenticated) {
//             console.error("Não autenticado")
//             return
//         }

//         try {
//             // Initialize FormData for multipart data transfer.
//             const formData = new FormData()

//             Object.entries(updatedData).forEach(([key, value]) => {
//                 if (value === undefined || value === null || key === "removeFile") return

//                 if (Array.isArray(value)) {
//                     value.forEach(v => formData.append(key, v))
//                 } else if (typeof value === "object" && "id" in value) {
//                     formData.append(key, value.id)
//                 } else {
//                     // Aqui adicionamos strings, números, booleans
//                     formData.append(key, value.toString())
//                 }
//             })


//             // Explicitly handle the boolean flag for removing the existing file.
//             if (updatedData.removeFile) {
//                 formData.append("removeFile", updatedData.removeFile)       // Send boolean as string for server processing.
//             }

//             // Append the new file(s) if provided.
//             if (files && files.length > 0) {
//                 files.forEach((file) => {
//                     formData.append("files", file)
//                 })
//             }

//             // Send PUT request to the item-specific API endpoint with the item ID.
//             const res = await fetch(`/api/items/${id}`, {
//                 method: "PUT",
//                 credentials: "include",
//                 body: formData,
//             })

//             if (!res.ok) throw new Error("Erro ao atualizar item")

//             // Receive the fully updated item object from the API.
//             const updatedItem: Item = await res.json()

//             // Update the local state by replacing the old item object with the new one.
//             setItems((prev) =>
//                 prev.map((item) =>
//                     item.id === id
//                         ? { ...updatedItem, isFavorite: item.isFavorite }       // Preserve the local isFavorite state.
//                         : item
//                 )
//             )
//         } catch (err) {
//             console.error(err)
//         }
//     }

//     /**
//      * @function deleteItem
//      * @description Handles the deletion of an item by its ID.
//      * 
//      * @param id - The ID of the item to delete.
//      * @return {Promise<void>} 
//      */
//     const deleteItem = async (id: string) => {

//         if (!isAuthenticated) {
//             console.error("Não autenticado")
//             return
//         }

//         try {
//             // Send DELETE request to the item-specific API endpoint.
//             const res = await fetch(`/api/items/${id}`, {
//                 method: "DELETE",
//                 credentials: "include",
//             })

//             if (!res.ok) throw new Error("Erro ao apagar item")

//             // Optimistically update the local state by filtering out the deleted item.
//             setItems((prev) => prev.filter((item) => item.id !== id))
//         } catch (err) {
//             console.error(err)
//         }
//     }

//     // --- Derived State ---

//     /**
//     * Calculates a unique, sorted list of all themes present in the 'items' array.
//     * This list is used to populate the theme filter options.
//     */
//     const themes: string[] = Array.from(
//         // Use flatMap to combine all theme arrays into a single array before finding unique values.
//         new Set(items.flatMap((item) => item.theme))  // <-- flatMap achata o array
//     ).sort()

//     /**
//      * Filters the main 'items' array based on the current filtering state (type, theme, search, and favorites).
//      */
//     const filteredItems = items.filter((item) => {
//         // 1. Type filter match: matches if 'all' is selected or if the item's type matches the selection.
//         const typeMatch = selectedType === "all" || item.type === selectedType

//         // 2. Theme filter match: matches if 'all' is selected or if the item's theme array includes the selected theme.
//         const themeMatch =
//             selectedTheme === "all" || item.theme.includes(selectedTheme)

//         // 3. Search query match: matches if the query is empty or if the query text is found in the title or description (case-insensitive).
//         const searchMatch =
//             searchQuery === "" ||
//             item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//             item.description.toLowerCase().includes(searchQuery.toLowerCase())

//         // 4. Favorites filter match: matches if 'showFavorites' is false (no filter) or if the item is marked as a favorite.
//         const favoriteMatch =
//             !showFavorites || item.isFavorite === true

//         // An item is included in the filtered list only if ALL conditions are true.
//         return typeMatch && themeMatch && searchMatch && favoriteMatch
//     })

//     // Render the context provider, passing the state, setters, and derived values.
//     return (
//         <ItemsContext.Provider
//             value={{
//                 items,
//                 addItem,
//                 updateItem,
//                 deleteItem,
//                 filteredItems,
//                 selectedType,
//                 setSelectedType,
//                 selectedTheme,
//                 setSelectedTheme,
//                 searchQuery,
//                 setSearchQuery,
//                 themes,
//                 pagination: {
//                     page,
//                     totalPages,
//                 },
//                 setPage,
//                 toggleFavorite,
//                 showFavorites,
//                 setShowFavorites
//             }}
//         >
//             {children}
//         </ItemsContext.Provider>
//     )
// }

// /**
//  * @function useItems
//  * @description Custom hook to consume the Items Context.
//  * Simplifies accessing the context values and ensures the consumer is properly nested.
//  * @returns {ItemsContextType} - The context value containing item data, filters, and manipulation functions.
//  * @throws {Error} - If used outside of an ItemsProvider.
//  */
// export function useItems() {
//     // Attempt to retrieve the context value.
//     const context = useContext(ItemsContext)

//     // Safety check: ensure the context is not undefined (i.e., component is wrapped by the Provider).
//     if (!context) {
//         throw new Error("useItems must be used within an ItemsProvider")
//     }
//     return context
// }

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
    }, [page, selectedType, selectedTheme, searchQuery, showFavorites, user, isAuthenticated])

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

    const deleteItem = async (id: string) => {
        if (!isAuthenticated) {
            console.error("Não autenticado")
            return
        }

        try {
            const res = await fetch(`/api/items/${id}`, {
                method: "DELETE",
                credentials: "include",
            })

            if (!res.ok) throw new Error("Erro ao apagar item")

            // Remove item from local state
            setItems((prev) => prev.filter((item) => item.id !== id))

            // Adjust total items count
            setTotalItems(prev => prev - 1)
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