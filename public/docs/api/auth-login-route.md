# Code Analysis and Best Practices: Login API Route (route.ts)

This module defines a Next.js API Route Handler for the */api/auth/login* endpoint, implementing the core logic for user authentication. It uses industry-standard practices for password hashing (bcrypt) and session management (JWTs stored in secure, HTTP-only cookies).

## 1. Overview and Purpose

The *app/api/auth/login/route.ts* file handles HTTP POST requests, verifying user credentials against the database and issuing a signed JSON Web Token (JWT) upon successful authentication.

- **Role**: User Authentication (Login).

- **Architecture**: Next.js App Router API Route.

- **Key Feature**: Secure authentication workflow using hashed passwords and HTTP-only cookies for session management.

## 2. Structure and Dependencies

NextResponse | next/server - Utility for creating structured HTTP responses, including setting headers and cookies.

bcrypt | bcrypt - Library used to securely compare the submitted password against the stored hash.

jsonwebtoken | jsonwebtoken - Used to create and sign the JWT, establishing a verifiable user session token.

prisma | @/lib/prisma - The ORM client for querying the User record in the database.

## 3. Login Workflow Logic (*POST* Handler)

The handler executes a robust, sequential authentication process:

1. **Input Extraction**: Extracts *username* and *password* from the JSON request body.

2. **Input Validation**: Checks for the presence of both credentials, returning *400 Bad Request* if either is missing.

3. **User Retrieval**: Queries the database for the user record by *username*.

4. **Existence Check**: Returns *401 Unauthorized* if no user is found. Crucially, it uses the same generic error message ("Credenciais inválidas") as the password check to prevent username enumeration attacks.

5. **Password Verification**: Uses *bcrypt.compare(password, user.password)* to safely check the password without exposing the hash or the plain-text password.

6. **Password Check**: Returns *401 Unauthorized* if the password comparison fails.

7. **JWT Generation**: If verification succeeds, a JWT is signed with the user's *id* and *username* as claims (sub and username). The token expires in 7 days (*expiresIn: "7d"*).

8. **Cookie Setting (Security)**: The JWT is stored in an HTTP-only cookie named "cp:token".

   - *httpOnly: true*: Prevents client-side JavaScript access, mitigating Cross-Site Scripting (XSS) attacks from stealing the token.

   - *secure: process.env.NODE_ENV === "production"*: Ensures the cookie is only sent over HTTPS in production environments.

9. **Response**: The function returns the user's sanitized data (*id* and *username*) along with the authentication cookie set in the response headers.

## 4. Recommendations for Improvement (Security and Best Practices)

While the implementation is generally solid, especially regarding the use of bcrypt and HTTP-only cookies, several improvements can be made:

### A. Security Improvements

**Area**: Error Timing 

**Current State**: Returns errors immediately upon failure (user not found, password mismatch).

**Recommendation**: Implement a timing attack mitigation strategy. If the user is not found, use a placeholder hash or a delay to ensure the API response time is similar for "User not found" and "Wrong password" errors. This prevents attackers from easily inferring which usernames exist.

---

**Area**: User ID in JWT

**Current State**: Includes sub: user.id and username: user.username.

**Recommendations**: Minimize claims. The username is redundant if the front end only needs the id. A smaller payload is generally better. The token should only contain the minimum information necessary for backend services to authenticate the user (the sub/id).

---

JWT Secret Management

Uses process.env.JWT_SECRET!.

Ensure the secret is very long, random, and stored securely (e.g., in a dedicated secret manager). A weak or predictable secret makes the tokens easy to forge.

---

Rate Limiting

None apparent in the code.

Implement IP-based rate limiting on the login route. This prevents brute-force password guessing attacks. A failure response should include a Retry-After header if the limit is exceeded.

---

Password Hashing

Assumes passwords were hashed successfully upon user creation.

The password hashing function should always use a high cost factor (e.g., bcrypt rounds 12 or more) to increase the time needed for verification, further hindering brute-force attacks.