# Code Analysis and Best Practices: Prisma Schema (*schema.prisma*)

This file defines the data models and their relationships using Prisma Schema Language (PSL). It serves as the single source of truth for the application's database structure, enabling the generation of a type-safe database client (Prisma Client).

## 1. Overview and Purpose

The schema defines three core entities: *User*, *Item*, and *Favorite*. It establishes a secure one-to-many relationship between *User* and *Item*, and a many-to-many relationship (modeled explicitly via the *Favorite* table) between *User* and *Item*.

- **Database Provider**: PostgreSQL (*provider = "postgresql"*).

- **Client Generation**: Configured to output the generated client code to the local path *../app/generated/prisma*.

## 2. Model Structure and Relationships

### A. User Model

**Field**: id

**Type**: String

**Attributes**: @id @default(cuid())

**Description**: Unique identifier, generated using CUID (a collision-resistant identifier).

---

**Field**: username

**Type**: String

**Attributes**: @unique

**Description**: The user's chosen display name, must be unique across the application.

---

**Field**: password

**Type**: String

**Attributes**: (None)

**Description**: Stores the user's password hash.

---

**Field**: createdAt

**Type**: DateTime

**Attributes**: @default(now())

**Description**: Timestamp of user creation.

---

**Field**: items

**Type**: Item[]

**Attributes**: @relation("UserItems")

**Description**: Relation field: List of items added by this user (One-to-Many).

---

**Field**: favorites

**Type**: Favorite[]

**Attributes**: (None)

**Description**: Relation field: List of items favorited by this user (One-to-Many through the join table).

### B. Item Model

**Field**: id

**Type**: String

**Attributes**: @id @default(cuid())

**Description**: Unique identifier for the shared item.

---

**Field**: type, title, description

**Type**: String

**Attributes**: (None)

**Description**: Core item metadata.

---

**Field**: theme, url, filePath

**Type**: String[]

**Attributes**: (None)

**Description**: Array fields for tags, links, and file references (S3 paths).

---

**Field**: addedAt

**Type**: DateTime

**Attributes**: @default(now())

**Description**: Timestamp of item creation.

---

**Field**: addedById

**Type**: String

**Attributes**: (Foreign Key)

**Description**: Foreign key pointing to the User who added the item.

---

**Field**: addedBy

**Type**: User

**Attributes**: @relation("UserItems", ...)

**Description**: Relation field: The User object that owns this item (Many-to-One).

---

**Field**: favorites

**Type**: Favorite[]

**Attributes**: (None)

**Description**: Relation field: List of Favorite records linked to this item.

### C. Favorite Model (Explicit Join Table)

This model implements the many-to-many relationship between *User* and *Item*.

**Field**: id

**Type**: String

**Attributes**: @id @default(cuid())

Unique identifier for the favorite record.

---

**Field**: userId, itemId

**Type**: String

**Attributes**: (Foreign Keys)

**Description**: Keys linking to the User and Item models.

---

**Field**: @@unique

**Type**: (Index)

**Attributes**: [userId, itemId]

**Description**: CRITICAL: Enforces that a user can only favorite a specific item once.

---

**Field**: item

**Type**: Item

**Attributes**: @relation(..., onDelete: Cascade)

**Description**: CRITICAL: If an item is deleted, all associated Favorite records are automatically deleted (Cascading Delete).

## 3. Recommendations for Improvement (Security and Database Design)

### A. Security (CRITICAL)

**Area**: Password Storage

**Current Schema**: password String

**Recommendation**: Add Hashing Information: While the String type is correct for storing the hash, consider adding a comment or field to document the hashing algorithm used (e.g., passwordHash String // bcrypt hash). Security Logic: The application logic MUST use a slow hashing function (like Argon2 or bcrypt) and NEVER store the plaintext password.

---

**Area**: Indexing

**Current Schema**: Only explicit indexes are id and username.

**Recommendation**: Add Essential Indexes: Queries often filter by user ID and creation time. Consider adding indexes on frequently queried non-unique fields: @@index([addedById]) on the Item model, and @@index([userId]) on the Favorite model (although the @@unique already covers this).

---

**Area**: Sensitive Data Exposure

**Current Schema**: User model contains password.

**Recommendation**: Prisma Select: In application code, always use select: { password: false, ... } in all Prisma queries involving users to prevent accidentally fetching the password hash and logging/exposing it.

### B. Database Design and Best Practices

**Area**: Typing Item Fields

**Current Schema**: type String

**Recommendation**: Use Enums: Since ItemType has a predefined set of values (e.g., "livro", "filme"), define a Prisma enum (e.g., enum ItemTypeEnum { BOOK, MOVIE, ... }) and reference it in the Item model: type ItemTypeEnum. This enforces data integrity at the database level.

---

**Area**: Array Field Usage

**Current Schema**: theme String[], url String[], filePath String[]

**Recommendation**: Consider Normalization: While PostgreSQL supports array types, sometimes it's cleaner to normalize complex data. If themes and URLs are frequently searched, filtered, or grow large, consider creating separate one-to-many models (e.g., ItemTheme and ItemUrl) for better query performance and scalability.

---

**Area**: Default ID Type

**Current Schema**: Uses cuid() for all IDs.

**Recommendation**: Consistency with Database: CUIDs are excellent, but if you anticipate extremely high growth or want a more native approach, consider using UUIDs (@default(uuid())) or native integers if CUIDs are not required. Sticking to one ID type is key.

---

**Area**: Client Output Path

**Current Schema**: output = "../app/generated/prisma"

**Recommendation**: Standardization: While technically correct, a more common and often simpler path is output = "./node_modules/.prisma/client", allowing the client to be imported using standard package resolution (@prisma/client). This path requires manual adjustment to the Next.js project structure.

