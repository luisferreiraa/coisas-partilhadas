# Code Analysis: Favorites API Route (*route.ts*)

This module defines a Next.js API Route Handler responsible for managing the **favorites** functionality (retrieving and toggling item status) for specific users. It leverages the Prisma ORM for secure and efficient database operations.

## 1. Overview and Purpose

The *app/api/favorites/route.ts* file implements two HTTP methods, *GET* and *POST*, to act as a **backend interface** for the client-side favorites feature.

- **Role**: CRUD (Create, Read, Delete) operations on the *Favorite* model.
- **Architecture**: Implements the standard Next.js App Router API Route pattern, exporting functions named after HTTP methods (*GET, POST*).
- **Key Features**: The *POST* request implements a "toggle logic", performing either a create or a delete operation based on the current state of the record.

## 2. Structure and Dependencies

### Dependencies

*NextResponse* | *next/server* - Utility for creating structured HTTP responses, including JSON serialization and status codes.

*prisma* | *@/lib/prisma* - The initialized Prisma client instance used to interact with the database tables.

## 3. GET Request Handler (Retrieve Favorites)

The *GET* handler retrieves all favorited item IDs for a given user.

### A. Parameter Extraction and Validation

1. **Extraction**: The handler extracts the *username* from the request URL's query parameters (*searchParams*).
2. **Validation**: It enforces the presence of the *username* parameter. If missing, it rerturns a *400 Bad Request* with a clear error message (*"Username obrigatório"*).

### B. Database Query (Read)

```
const favorites = await prisma.favorite.findMany({
    where: { username },
    select: { itemId: true },
})
```

- *findMany*: Retrieves all matching records.
- **Filtering**: The *where: { username }* clause efficiently filters the database for records belonging onnly to the specified user.
- **Optimization**: The *select: { itemId: true }* instruction ensures the query only retrieves the essential *itemId* column, minimizing data transfer and maximizing database performance.

### C. Response

The final result is mapped into a clean, simple array of strings (*favorites.map(f => f.itemId)*), which is returned to the client as JSON (*NextResponse.json(...)*).

## 4. POST Request Handler (Toggle Favorite Status)

The *POST* handler manages the creation or deletion of a favorite record.

### A. Body Extraction and Validation

1. **Extraction**: It extracts *username* and *itemId* from the request body using *await req.json()*.
2. **Validation**: It checks for the presence of both *username* and *itemId*, returning a *400 Bad Request* if either is missing (*"Dados em falta"*).

### B. Existence Check

```
const existing = await prisma.favorite.findUnique({
    where: {
        username_itemId: { username, itemId },
    },
})
```

- **Composite Key**: The query relies on a **composite unique constraint** defined in the Prisma schema (*@unique([username, itemId])*). This ensures that no user can favorite the same item more than once, and it provides an optimized way to check for the existence of the specific relationship.

### C. Toggle Logic (Upsert Pattern)

The core of the *POST* handler is the conditional logic to either delete or create the record:

1. **IF Exists (Unfavorite/Delete)**:

   - If *existing* is found, *prisma.favorite.delete* is called using the record's primary *id*.
   - The function returns a success response with the status *{ favorited: false }*.

2. **IF NOT Exists (Favorite/Create)**:
   - If *existing* is null, *prisma.favorite.create* is called with the provided *username* and *itemId*.
   - The function returns a success responsee with the status *{ favorited: true }*.

This "toggle" pattern simplifies the client-side logic, as the client only needs to call the *POST* endpoint regardless of the item's current status.