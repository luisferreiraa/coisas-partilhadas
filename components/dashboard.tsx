// components/dashboard.tsx

"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useItems } from "@/lib/items-context"
import { ItemCard } from "@/components/item-card"
import { ItemDialog } from "@/components/item-dialog"
import { ITEM_TYPES, ItemType } from "@/lib/types"
import { LogOut, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const ITEMS_PER_PAGE = 9

export function Dashboard() {
    const { user, logout } = useAuth()

    const {
        filteredItems,
        selectedType,
        setSelectedType,
        selectedTheme,
        setSelectedTheme,
        searchQuery,
        setSearchQuery,
        themes,
    } = useItems()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)

    // Sempre que os filtros mudam, voltar à primeira página
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, selectedType, selectedTheme])

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)

    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    return (
        <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/5">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">Coisas Partilhadas</h1>
                            <p className="text-sm text-muted-foreground">
                                Olá, {user?.name}
                            </p>
                        </div>
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

            {/* Conteúdo */}
            <div className="container mx-auto px-4 py-8">
                {/* Pesquisa */}
                <div className="space-y-4 mb-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-11"
                        />
                    </div>

                    {/* Tipos */}
                    <div className="flex flex-wrap gap-2">
                        <Badge
                            variant={selectedType === "all" ? "default" : "outline"}
                            className="cursor-pointer px-4 py-2"
                            onClick={() => setSelectedType("all")}
                        >
                            Todos
                        </Badge>
                        {ITEM_TYPES.map((type) => (
                            <Badge
                                key={type.value}
                                variant={selectedType === type.value ? "default" : "outline"}
                                className="cursor-pointer px-4 py-2"
                                onClick={() =>
                                    setSelectedType(type.value as ItemType)
                                }
                            >
                                {type.icon} {type.label}
                            </Badge>
                        ))}
                    </div>

                    {/* Temáticas */}
                    {themes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            <Badge
                                variant={selectedTheme === "all" ? "secondary" : "outline"}
                                className="cursor-pointer px-4 py-2"
                                onClick={() => setSelectedTheme("all")}
                            >
                                Todas as temáticas
                            </Badge>
                            {themes.map((theme) => (
                                <Badge
                                    key={theme}
                                    variant={
                                        selectedTheme === theme
                                            ? "secondary"
                                            : "outline"
                                    }
                                    className="cursor-pointer px-4 py-2"
                                    onClick={() => setSelectedTheme(theme)}
                                >
                                    {theme}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Lista */}
                {paginatedItems.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground text-lg mb-4">
                            Nenhum item encontrado
                        </p>
                        <Button
                            onClick={() => setIsDialogOpen(true)}
                            variant="outline"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar o primeiro item
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedItems.map((item) => (
                                <ItemCard key={item.id} item={item} />
                            ))}
                        </div>

                        {/* Paginação */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-8">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === 1}
                                    onClick={() =>
                                        setCurrentPage((p) => p - 1)
                                    }
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>

                                <span className="text-sm text-muted-foreground">
                                    Página {currentPage} de {totalPages}
                                </span>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={currentPage === totalPages}
                                    onClick={() =>
                                        setCurrentPage((p) => p + 1)
                                    }
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ItemDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        </div>
    )
}

