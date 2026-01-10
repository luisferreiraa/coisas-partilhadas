"use client"

import { useState } from "react"

export default function SidebarToggle({
    sidebar,
    children
}: {
    sidebar: React.ReactNode
    children: React.ReactNode
}) {
    const [open, setOpen] = useState(false)

    return (
        <div className="relative flex h-screen w-full">
            {/* Botão mobile */}
            <button
                onClick={() => setOpen(!open)}
                className="md:hidden flex items-center justify-center h-4 w-4 rounded-full bg-[#2f2f2f] hover:opacity-80 transition-opacity fixed top-4 left-4 z-50"
            >
            </button>

            {/* SIDEBAR */}
            <aside
                className={`
                    fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40
                    transform transition-transform duration-300
                    ${open ? "translate-x-0" : "-translate-x-full"}
                    md:translate-x-0 md:static md:block
                `}
            >
                {sidebar}
            </aside>

            {/* CONTENT */}
            <main className="flex-1 overflow-y-auto md:ml-10 p-6">
                {children}
            </main>
        </div>
    )
}