// lib/items-context

// Directive indicating this module should be treated as client-side code
// enabling the use of hooks and interactivity.
"use client"

import {
    createContext,      // Function to create a new React Context object.
    useContext,     // Hook to consume context values within functional components.
    useState,       // Hook to manage local component state.
    useEffect,      // Hook to manage side effects, like data fetching on mount.
    type ReactNode,     // Type for content passed to the component (children).
} from "react"
// Import type definitions for the Item entity and data transfer objects (DTOs).
import { Item, ItemType, UpdateItemData, CreateItemData } from "./types"

/**
 * Defines the structure of the data and functions provided by the Items Context.
 * This contract specifies what consumers of the context can access.
 */
type ItemsContextType = {
    items: Item[]       // The complete, unfiltered list of all items retrieved from the API.
    addItem: (item: Omit<CreateItemData, "id" | "addedAt">, file?: File) => Promise<void>       // Sends a request to the API to create a new item.
    updateItem: (id: string, item: UpdateItemData, file?: File) => Promise<void>            // Sends a request to the API to update an existing item.
    deleteItem: (id: string) => Promise<void>       // Sends a request to the API to delete an item.
    filteredItems: Item[]       // The list of items after applying type, theme, and search filters.
    selectedType: ItemType | "all"      // The currently active filter for item type.
    setSelectedType: (type: ItemType | "all") => void       // Function to set the active type filter.
    selectedTheme: string       //The currently active filter for theme.
    setSelectedTheme: (theme: string) => void       // Function to set the active theme filter.
    searchQuery: string     // The current text query used for searching item title and description.
    setSearchQuery: (query: string) => void     // Function to set the search query.
    themes: string[]        // A dynamically generated list of all unique themes present in the current 'items' data.
}

// Create the context object, initialized with 'undefined'.
// This is the object that components will import and pass to useContext.
const ItemsContext = createContext<ItemsContextType | undefined>(undefined)

/**
 * The main provider component that manages the state, logic, and CRUD operations
 * for the items data, making them available to all descendant components.
 * 
 * @param {object} props - Component properties.
 * @param {ReactNode} props.children - The child components to be wrapped by the provider.
 * @returns {JSX.Element} The Context Provider wrapping the children.
 */
export function ItemsProvider({ children }: { children: ReactNode }) {
    // State holding the core data: the full list of items.
    const [items, setItems] = useState<Item[]>([])
    // State for filtering by item type ("all" initially).
    const [selectedType, setSelectedType] = useState<ItemType | "all">("all")
    // State for filtering by theme ("all" initially).
    const [selectedTheme, setSelectedTheme] = useState<string>("all")
    // State for text search queries.
    const [searchQuery, setSearchQuery] = useState("")

    // --- Load Items from database (API) ---

    // useEffect hook runs once on component mount to fetch initial data.
    useEffect(() => {
        const loadItems = async () => {
            try {
                // Fetch all items frm the serverless API enpoint.
                const res = await fetch("/api/items")

                // Check for HTTP errors.
                if (!res.ok) throw new Error("Erro ao carregar items")

                // Parse the JSON response body.    
                const data = await res.json()

                // Update the state with the fetched list of items.
                setItems(data)
            } catch (err) {
                // Log any errors that ocurred during the fetch or parsing.
                console.error(err)
            }
        }

        loadItems()     // Empty dependency arrary ensures this runs only once on mount.
    }, [])

    // --- CRUD Operations ---

    /**
     * Handles the creation of a new item.
     * It uses FormData to correctly handle both text fields and file uploads.
     * 
     * @param itemData - Object containing item properties. 
     * @param file - Optional file to upload.
     * @returns {Promise<void>}
     */
    const addItem = async (itemData: Omit<CreateItemData, "id" | "addedAt">, file?: File) => {
        try {
            // Create a FormData object to send multipart/form-data
            const formData = new FormData()

            // Append all item data fields to the FormData.
            formData.append("type", itemData.type)
            formData.append("title", itemData.title)
            formData.append("description", itemData.description)
            formData.append("theme", itemData.theme)
            formData.append("addedBy", itemData.addedBy)

            // Conditionally append optional fields.
            if (itemData.url) formData.append("url", itemData.url)
            if (file) formData.append("file", file)

            // Send POST request to the API to create a resource.
            const res = await fetch("/api/items", {
                method: "POST",
                body: formData,     // FormData handles setting the Content-Type header.
            })

            if (!res.ok) throw new Error("Erro ao criar item")

            // Receiive the newly created item (including its generated ID and timestamp).
            const newItem: Item = await res.json()

            // Optimistically update the local state by adding the new item to the beginning of the list.
            setItems((prev) => [newItem, ...prev])
        } catch (err) {
            console.error(err)
        }
    }

    /**
     * Handles updating an existing item by ID.
     * It also uses FormData and supports updating fields, uploading a new file, or removing an existing file.
     * 
     * @param id - The ID of the item to update. 
     * @param updatedData - The data fields to modify.
     * @param file - Optional new file to attach.
     * @returns {Promise<void>}
     */
    const updateItem = async (id: string, updatedData: UpdateItemData, file?: File) => {
        try {
            // Use FormData for potential file transfer or to send JSON-like data with file removal flag.
            const formData = new FormData()

            // Iterate through updateData object and append all non-null/non-undefined fields to FormData.
            Object.entries(updatedData).forEach(([key, value]) => {
                // Exclude 'removeFile' from the general loop as it's handled separately below.
                if (value !== undefined && value !== null && key !== 'removeFile') {
                    // Convert value to string for FormData.
                    formData.append(key, String(value))
                }
            })

            // Explicitly handle the boolean flag for removing the existing file.
            if (updatedData.removeFile) {
                formData.append("removeFile", updatedData.removeFile)
            }

            // Append the new file if provided.
            if (file) formData.append("file", file)

            // Send PUT request to the item-specific API endpoint.
            const res = await fetch(`/api/items/${id}`, {
                method: "PUT",
                body: formData,
            })

            if (!res.ok) throw new Error("Erro ao atualizar item")

            // Receive the fully updated item object.
            const updatedItem: Item = await res.json()

            // Update the local state by replacing the old item object with the new one.
            setItems((prev) =>
                prev.map((item) => (item.id === id ? updatedItem : item))
            )
        } catch (err) {
            console.error(err)
        }
    }

    /**
     * Handles the deletion if an item by ID.
     * 
     * @param id - The ID of the item to delete.
     * @return {Promise<void>} 
     */
    const deleteItem = async (id: string) => {
        try {
            // Send DELETE request to the item-specific API endpoint.
            const res = await fetch(`/api/items/${id}`, {
                method: "DELETE",
            })

            if (!res.ok) throw new Error("Erro ao apagar item")

            // Optimistically update the local state by filtering out the deleted item.
            setItems((prev) => prev.filter((item) => item.id !== id))
        } catch (err) {
            console.error(err)
        }
    }

    // --- Derived State ---

    // Calculates a unique, sorted list of all themes present in the 'items' array.
    const themes = Array.from(new Set(items.map((item) => item.theme))).sort()

    // Filters the main 'items' array based on the current filtering state (type, theme, search).
    const filteredItems = items.filter((item) => {

        // 1. Check if the item type matches the selected filter ("all" matches everything).
        const typeMatch = selectedType === "all" || item.type === selectedType

        // 2. Check if the item theme matches the selected filter ("all" matches everything).
        const themeMatch = selectedTheme === "all" || item.theme === selectedTheme

        // 3. Check if the search query is found in the title or description (case-sensitive).
        const searchMatch =
            searchQuery === "" ||       // If query is empty, it always matches.
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())

        // An item is included in the filtered list only if ALL conditions are true.
        return typeMatch && themeMatch && searchMatch
    })

    // Render the context provider, passing the state, setters, and derived values.
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

/**
 * Custom hook to consume the Items Context.
 * Simplifies accessing the context values and ensures the consumer is properly nested.
 * @returns {ItemsContextType} - The context value.
 * @throws {Error} - If used outside of an ItemsProvider.
 */
export function useItems() {
    // Attempt to retrieve the context value.
    const context = useContext(ItemsContext)

    // Safety check: ensure the context is not undefined.
    if (!context) {
        throw new Error("useItems must be used within an ItemsProvider")
    }
    return context
}