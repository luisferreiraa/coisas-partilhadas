# Code Analysis and Best Practices: Item Card Component (*item-card.tsx*)

This module defines the *ItemCard* component, a client-side component responsible for rendering a condensed, interactive summary of a single item. It integrates multiple actions (edit, delete, favorite, download, share) and manages local state for modals and popovers.

## 1. Overview and Purpose

The *ItemCard* is central to the dashboard view, providing users with quick access to item details and functionalities. It demonstrates advanced client-side logic by orchestrating complex interactions, such as:

- Initiating secure file downloads via an API proxy.

- Managing local UI state for confirmation dialogs and popovers.

- Integrating with global context to trigger data modifications (delete, favorite toggle).

- **Role**: Display a single item summary and all associated action controls.

- **Architecture**: Client Component (using *"use client"*).

- **Key Feature**: High interactivity achieved through local state and integration with global item and authentication contexts.

## 2. Structure and Dependencies

useAuth | @/lib/auth-context - Accesses the current user ID for potential permission checks (though currently unused for gating).

useItems | @/lib/items-context - Provides functions like deleteItem and toggleFavorite to modify the global item state.

UI Components | @/components/ui/* - Provides the structured layout (Card, AlertDialog) and styled elements (Button, Badge).

Icons | lucide-react - Provides visual cues for actions (Edit, Trash, Download, Heart).

ItemDialog | @/components/item-dialog - The modal used for the edit action.

### Helper Functions (Local)

The component includes several local functions to enhance display and functionality:

- **downloadItem(itemId, fileUrl)**: An async function that hits the */api/items/[id]/download* route to get a pre-signed URL, and then navigates the user to that URL to start the download.

- *getFileName(filePath)*: Attempts to clean the S3 key/path to return a user-friendly filename, assuming a UUID prefix separated by a hyphen.

- *getFileIcon(filePath)*: Selects a *lucide-react* icon based on the file extension (currently only checking for 'pdf').

- *formatType(type)*: Capitalizes the first letter of the item type for display.

- *handleCopyLink(itemId)*: Copies the item's permalink to the clipboard and provides simple *alert()* feedback.

## 3. Recommendations for Improvement (Security and Robustness)

### A. Critical Security & Robustness Issues

**Area**: Missing Authorization Gate

**Current State**: The Edit, Delete, and Favorite buttons are always rendered, and actions are triggered, **regardless of whether the current user owns the item or is an admin**.

**Recommendation**: **Implement Access Control** (CRITICAL): These buttons (Edit, Delete) must be conditionally rendered. Use the *user* object from *useAuth()* to check: *if (user && (user.id === item.addedById))*

---

**Area**: Alert/Confirm Usage

**Current State**: Uses browser-native *alert()* for copy feedback and API errors (*Erro ao gerar download*).

**Recommendation**: **Replace Native Dialogs** (MANDATORY): **Do not use *alert()*, *confirm()*, or *window.alert()*** in this environment. Replace them with custom, styled message/toast components (e.g., from the UI library) to ensure the user receives feedback without breaking the iFrame context.

---

**Area**: File Name Extraction

**Current State**: *getFileName* relies on a highly specific, custom delimiter *(-)* in the filename format.

**Recommendation**: *Store Original Filename in DB*: The most robust solution is to modify the API *POST/PUT* routes to store the user-provided original filename (e.g., *originalName: string*) in the Prisma record. Use this stored property for display, instead of relying on parsing the S3 key.

---

**Area**: S3 Key Parsing Security

**Current State**: The *getFileName* logic is complex and error-prone if the S3 key format changes.

**Recommendation**: Simplify Key Handling: Ensure the S3 key generation on the server follows a strict pattern (e.g., always *UUID/original_name*), or use the recommendation above to store the name separately.

### B. User Experience and Best Practices

**Area**: Share Popover Logic

**Current State**: Uses local state (*isShareOpen*) to show/hide a custom dropdown menu. The menu does not close when clicking outside the card.

**Recommendation**: **Implement Close-on-Click-Outside**: Use the *useRef* hook and a click listener on the document body to automatically close the share popover when the user clicks anywhere outside of the popover element.

---

**Area**: Download Feedback

**Current State**: The card gives no visual feedback while the *downloadItem* function is fetching the pre-signed URL.

**Recommendation**: **Add Loading State**: Introduce a local *isDownloading* state to the *ItemCard*. Set it to *true* when *downloadItem* is called and *false* in the *finally* block of the *async* function. Disable the download button and show a spinner while loading.

---

**Area**: Theme Overflow

**Current State**: Uses a complex <div> with group-hover:block for the theme overflow tooltip.

**Recommendation**: **Use a Dedicated Tooltip Component**: Replace the manual CSS tooltip with a dedicated, accessible tooltip component from the UI library (e.g., *shadcn/ui's* Tooltip component) for standardized behavior and ARIA attributes.

---

**Area**: Date Formatting

**Current State**: Uses *toLocaleDateString("pt-PT", ...)* directly.

**Recommendation**: **Centralize Date Formatting**: Move this formatting logic into a reusable utility function (*formatDate(date)*) to ensure consistency across the application and simplify localization changes.