// components/dashboard.tsx

"use client"

import { useState } from "react"        // Import the useState hook for managing local component state.
import { Button } from "@/components/ui/button"     // UI component for interactive buttons.
import { Input } from "@/components/ui/input"       // UI component for text input fields.
import { useAuth } from "@/lib/auth-context"        // Custom hook to access authentication state.
import { useItems } from "@/lib/items-context"      // Custom hook to access application data and filtering logic.
import { ItemCard } from "@/components/item-card"       // Component used to display a single shared item.
import { ItemDialog } from "@/components/item-dialog"       // Modal dialog used for creating or editing items.
import { ITEM_TYPES, ItemType } from "@/lib/types"      // Type definitions for item categories and constants.
import { LogOut, Plus, Search } from "lucide-react"     // Icons used throughout the dashboard UI.
import { Badge } from "@/components/ui/badge"       // UI component for displaying tags or filter status.

/**
 * @function Dashboard
 * @description The main component for the application's user interface.
 * It integrates authentication status, item data, filtering, and the item list display.
 * @returns {JSX.Element} The rendered dashboard UI.
 */
export function Dashboard() {
    // Access authentication context for user data and the logout action.
    const { user, logout } = useAuth()

    // Access item context for state related to the data, filtering, and search.
    const {
        filteredItems,      // The list of items currently visible after filtering and searching.
        selectedType,       // The currently active filter for item type.
        setSelectedType,    // Function to change the item type filter.
        selectedTheme,      // The currently active filter for item theme/category.
        setSelectedTheme,   // Function to change the name filter.
        searchQuery,        // The current text entered in the search bar.
        setSearchQuery,     // Function to update the search query state.
        themes,             // Dynamically derived list of all unique themes from the items.
    } = useItems()

    // Local state to control the visibility of the Add/Edit Item dialog modal.
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    return (
        // Main container with full height and a custom background color/gradient for aesthetics.
        <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5">
            {/* --- Header Section (Sticky) --- */}
            <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Title and User Greeting */}
                        <div>
                            <h1 className="text-2xl font-bold text-balance">Coisas Partilhadas</h1>
                            {/* Display the logged-in user's name */}
                            <p className="text-sm text-muted-foreground">Olá, {user?.name}</p>
                        </div>
                        {/* Action Buttons: Add Item and Logout */}
                        <div className="flex items-center gap-2">
                            {/* Button to open the dialog for adding a new item */}
                            <Button onClick={() => setIsDialogOpen(true)} size="default">
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar
                            </Button>
                            {/* Button to initiate the user logout process */}
                            <Button onClick={logout} variant="outline" size="icon">
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Main Content Area (Search and Filter) --- */}
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-4 mb-8">
                    {/* Search Input Field */}
                    <div className="relative">
                        {/* Search icon positioned absolutely inside the input area */}
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar..."
                            value={searchQuery}
                            // Update the context's search query state on every input chanege.
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11"
                        />
                    </div>

                    {/* Item Type Filters (Badges) */}
                    <div className="flex flex-wrap gap-2">
                        {/* 'All' filter badge for item type */}
                        <Badge
                            // Apply 'default' variant if 'all' is selected, otherwise 'outline'.
                            variant={selectedType === "all" ? "default" : "outline"}
                            className="cursor-pointer px-4 py-2 text-sm"
                            onClick={() => setSelectedType("all")}
                        >
                            Todos
                        </Badge>
                        {/* Map over predefined item types to create individual filter badges. */}
                        {ITEM_TYPES.map((type) => (
                            <Badge
                                key={type.value}
                                variant={selectedType === type.value ? "default" : "outline"}
                                className="cursor-pointer px-4 py-2 text-sm"
                                // Set the selected type filter using the context setter.
                                onClick={() => setSelectedType(type.value as ItemType)}
                            >
                                {type.icon} {type.label}
                            </Badge>
                        ))}
                    </div>

                    {/* Theme Filters (Badges) - Only displayed if there are themes available. */}
                    {themes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {/* 'All Themes' filter badge. */}
                            <Badge
                                // Use 'secondary' variant for theme filters when active.
                                variant={selectedTheme === "all" ? "secondary" : "outline"}
                                className="cursor-pointer px-4 py-2 text-sm"
                                onClick={() => setSelectedTheme("all")}
                            >
                                Todas as temáticas
                            </Badge>
                            {/* Map over the dynamically derived unique themes. */}
                            {themes.map((theme) => (
                                <Badge
                                    key={theme}
                                    variant={selectedTheme === theme ? "secondary" : "outline"}
                                    className="cursor-pointer px-4 py-2 text-sm"
                                    // Set the selected theme filter using the context setter.
                                    onClick={() => setSelectedTheme(theme)}
                                >
                                    {theme}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* --- Item Display or Fallback Message --- */}
                {filteredItems.length === 0 ? (
                    // Display a centered message when no items match the current filters/search.
                    <div className="text-center py-16">
                        <p className="text-muted-foreground text-lg mb-4">Nenhum item encontrado</p>
                        {/* Call-to-acton button to add the first item. */}
                        <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar o primeiro item
                        </Button>
                    </div>
                ) : (
                    // Display items in a responsive grid (1 column on mobile, up to 3 on desktop).
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Map over the filtered items to render an ItemCard for each one. */}
                        {filteredItems.map((item) => (
                            <ItemCard key={item.id} item={item} />
                        ))}
                    </div>
                )}
            </div>

            {/* --- The Item Dialog Component --- */}
            {/* The dialog component for adding/editing items, controlled by local state. */}
            <ItemDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    )
}
