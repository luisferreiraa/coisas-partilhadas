// components/dashboard.tsx

"use client"        // Marks this component as a Client Component, essential for using hooks and interactivity.

import { useEffect, useState } from "react"     // Import React hooks for side effects and state management.
import { Button } from "@/components/ui/button"     // Reusable button component.
import { Input } from "@/components/ui/input"       // Reusable input component (used for search).
import { useAuth } from "@/lib/auth-context"        // Custom hook for authentication context (user data, logout funcion).
import { useItems } from "@/lib/items-context"      // Custom hook for item data and filtering state management.
import { ItemCard } from "@/components/item-card"       // Component used to display individual items.
import { ItemDialog } from "@/components/item-dialog"       // Modal component for adding/editing items.
import { ITEM_TYPES, ItemType } from "@/lib/types"      // Type definitions and constants for item types.
import { LogOut, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react"      // Icons for UI elements.
import { Badge } from "@/components/ui/badge"       // Component for displaying category or filter tags.

// Constant defining the number of items to display per page for pagination.
const ITEMS_PER_PAGE = 9

/**
 * @function Dashboard
 * @description The maion layout component for the application. It manages the display of
 * items, search and filtering controls, pagination, and user authentication actions (logout).
 * 
 * @returns {JSX.Element} The rendered dashboard interface. 
 */
export function Dashboard() {
    // Destructure user data and the logout function from the authentication context.
    const { user, logout } = useAuth()

    // Destructure item data, filters, and state setters from the items context.
    const {
        filteredItems,      // Array of items after all filtering/searching is applied.
        selectedType,       // Current filter value for item type.
        setSelectedType,    // Setter for the item type filter.
        selectedTheme,      // Current filter value for item theme.
        setSelectedTheme,   // Setter for the item theme filter.
        searchQuery,        // Current value for the search query.
        setSearchQuery,     // Setter for the search query.
        themes,             // Array of unique themes available in the current item set.
        showFavorites,      // Boolean state to filter by favorite items.
        setShowFavorites,   // Setter for the showFavorites state.
    } = useItems()

    // Local state to control the visibility of the Add/Edit Item modal dialog.
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    // Local state to track the current page number for pagination.
    const [currentPage, setCurrentPage] = useState(1)

    // Effect to reset the current page to 1 whenever any filtering or searching criteria changes.
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, selectedType, selectedTheme, showFavorites])       // Dependencies that trigger a page reset.

    // Derived value: Calculate the total number of pages required based on filtered items and items per page.
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)

    // Derived value: Slice the filtered items to get only the items for the current page.
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,     // Start index for the slice.
        currentPage * ITEMS_PER_PAGE            // End index for the slice.
    )

    return (
        <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5">
            {/* Header section: Fixed at the top and blurred for a modern look. */}
            <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Title and user greeting */}
                        <div>
                            <h1 className="text-2xl font-bold">Coisas Partilhadas</h1>
                            <p className="text-sm text-muted-foreground">
                                Olá, {user?.name}
                            </p>
                        </div>
                        {/* Action buttons (Add Item and Logout) */}
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar
                            </Button>
                            <Button onClick={logout} variant="outline" size="icon">
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-4 mb-8">
                    {/* Search Input Field */}
                    <div className="relative">
                        {/* Search Icon placed inside the input. */}
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}        // Update search query state on input change.
                            className="pl-10 h-11"
                        />
                    </div>

                    {/* Item Type Filters (Type: All, Favorites, Specific Types) */}
                    <div className="flex flex-wrap gap-2">
                        <Badge
                            variant={selectedType === "all" ? "default" : "outline"}
                            className="cursor-pointer px-4 py-2"
                            onClick={() => setSelectedType("all")}
                        >
                            Todos
                        </Badge>
                        {/* Favorites Filter Toggle */}
                        <div className="flex flex-wrap gap-2">
                            <Badge
                                variant={showFavorites ? "default" : "outline"}
                                className="cursor-pointer px-4 py-2"
                                onClick={() => setShowFavorites((prev) => !prev)}       // Toggle favorite filter state.
                            >
                                ⭐ Favoritos
                            </Badge>
                        </div>
                        {/* Dynamic Item Type Filters */}
                        {ITEM_TYPES.map((type) => (
                            <Badge
                                key={type.value}
                                variant={selectedType === type.value ? "default" : "outline"}
                                className="cursor-pointer px-4 py-2"
                                onClick={() =>
                                    setSelectedType(type.value as ItemType)     // Set the item type filter state.
                                }
                            >
                                {type.icon} {type.label}
                            </Badge>
                        ))}
                    </div>

                    {/* Theme Filters (Conditionally rendered if themes exist) */}
                    {themes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {/* All Themes Filter */}
                            <Badge
                                variant={selectedTheme === "all" ? "secondary" : "outline"}
                                className="cursor-pointer px-4 py-2"
                                onClick={() => setSelectedTheme("all")}
                            >
                                Todas as temáticas
                            </Badge>
                            {/* Dynamic Theme Filters */}
                            {themes.map((theme) => (
                                <Badge
                                    key={theme}
                                    variant={
                                        selectedTheme === theme
                                            ? "secondary"
                                            : "outline"
                                    }
                                    className="cursor-pointer px-4 py-2"
                                    onClick={() => setSelectedTheme(theme)}     // Set the specific theme filter state.
                                >
                                    {theme}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Conditional Rendering based on filtered items count */}
                {paginatedItems.length === 0 ? (
                    // Displayed when noo items match the current filters/search.
                    <div className="text-center py-16">
                        <p className="text-muted-foreground text-lg mb-4">
                            Nenhum item encontrado
                        </p>
                        <Button
                            onClick={() => setIsDialogOpen(true)}       // Suggest adding an item.
                            variant="outline"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar o primeiro item
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Item Grid: Displays the paginated items */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedItems.map((item) => (
                                <ItemCard key={item.id} item={item} />
                            ))}
                        </div>

                        {/* Pagination Controls (Conditionally rendered if more than 1 page exists) */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-8">
                                {/* Previous Page Button */}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === 1}        // Disabled on the first page.
                                    onClick={() =>
                                        setCurrentPage((p) => p - 1)    // Decrement page number.
                                    }
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>

                                {/* Page Indicator */}
                                <span className="text-sm text-muted-foreground">
                                    Página {currentPage} de {totalPages}
                                </span>

                                {/* Next Page Button */}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === totalPages}       // Disabled on the past page.
                                    onClick={() =>
                                        setCurrentPage((p) => p + 1)        // Increment page number.
                                    }
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Item Add/Edit Dialog: Placed outside the main content flow. */}
            <ItemDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    )
}

