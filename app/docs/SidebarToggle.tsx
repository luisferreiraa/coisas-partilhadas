// app/docs/SidebarToggle.tsx

// Directive to mark this module as running on the client side, necessary for hooks like useState.
"use client"

import { useState } from "react" // Imports the useState hook for managing component state.

/**
 * @typedef {Object} SidebarToggleProps
 * @description Defines the props accepted by the SidebarToggle component.
 * @property {React.ReactNode} sidebar - The content to be rendered within the collapsible sidebar (e.g., DocMenu).
 * @property {React.ReactNode} children - The main content of the page, rendered alongside the sidebar.
 */

/**
 * @function SidebarToggle
 * @description A responsive container component that displays content alongside a collapsible sidebar.
 * The sidebar is fixed and hidden on mobile screens, revealing itself upon button press,
 * and is static and always visible on medium (md) screens and above.
 *
 * @param {SidebarToggleProps} props - The component props containing the sidebar and children content.
 * @returns {JSX.Element} The responsive layout structure.
 */
export default function SidebarToggle({
    sidebar,
    children
}: {
    sidebar: React.ReactNode // Type definition for the sidebar content.
    children: React.ReactNode // Type definition for the main content.
}) {
    // State hook to control the visibility of the sidebar on mobile devices.
    const [open, setOpen] = useState(false)

    return (
        <div className="relative flex h-screen w-full">
            {/* Mobile Toggle Button (Visually empty button, typically holds an icon) */}
            <button
                // Toggles the 'open' state, which controls the sidebar's position.
                onClick={() => setOpen(!open)}
                className="md:hidden flex items-center justify-center h-4 w-4 rounded-full bg-[#2f2f2f] hover:opacity-80 transition-opacity fixed top-4 left-4 z-50"
            >
            </button>

            {/* SIDEBAR ASIDE ELEMENT */}
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

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 overflow-y-auto md:ml-10 p-6">
                {children}
            </main>
        </div>
    )
}