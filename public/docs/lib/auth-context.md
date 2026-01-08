# Code Analysis: Authentication Context Provider (*lib/auth-context.tsx*)

The *lib/auth-context.tsx* module establishes the application's client-side authentication layer using React Context. It manages the user session state, providing functions for mock login and logout, and implements persistence using the browser's *localStorage*.

## 1. Overview and Purpose

The *AuthProvider* component serves as a **Mock Authentication Manager**. While it establishes the correct structural pattern for handling state (Provider/Consumer), the actual credential verification and session ID generation are kept simple and **insecure** for demonstration or development purposes.

- **Role**: Session State Management and Persistence.
- **Architecture**: Client Component using React Context for global state distribution.
- **Key Feature**: Persists the user session (*User* object) across page reloads using *localStorage*.

## 2. Structure and Dependencies

*React Hooks* | *react* - *useState*, *useEffect*, *createContext*, *useContext* for state management, side effects, and context creation.

### Data Structures

*User* | *id, name* - Represents the currently logged-in user. The *id* is a non-unique, client-side generated timestamp.

*AuthContextType* | *user, login, logout* - Defines the publicly exposed state and actions of the context.

## 3. Core State and Persistence

### A. Initial State and *useEffect*

1. **State**: The *user* state is initialized to *null*.
2. **Persistence Check**: The *useEffect* hook runs once on mount to check *localStorage* for the key "*coisas-partilhadas-user*".
3. **Session Restoration**: If data is found, it is parsed and used to hydrate the *user* state, effectively restoring the session from the previous page visit.

### B. Mock User Data

The application relies on a hardcoded, in-memory array for credential matching:

```
const USERS = [
    { name: "[REDACTED_NAME]", password: "1234" },
    { name: "[REDACTED_NAME]", password: "abcd" },
]
```

**Security Implication**: In a production application, this array would be replaced entirely by an asynchronous API call to a backend authentication service (e.g., JWT token exchange, OAuth flow) which verifies credentials against a secure database.

## 4. Authentication Logic (*login* and *logout*)

### A. *login* Function

The *login* function implements the mock authentication:

1. **Credential Check**: It uses *Array.find()* to perform an exact match against the hardcoded *USERS* list based on the provided *name* and *password*.
2. **ID Generation (Insecure)**: Upon success, it creates a new *User* object. The id is set using *Date.now().toString()*. This ID is n**ot cryptographically secure or globally unique** and is unsuitable for identifying users in a multi-device or production environment.
3. **Session Save**: The *newUser* object is saved to *localStorage* and set in the React state.

**Security Improvement Needed**: The current implementation bypasses crucial security steps: hashing passwords, using secure tokens (JWTs), and performing validation server-side.

### B. *logout* Function

The *logout* function securely terminates the client-side session:

1. **State Cleared**: *setUser(null)*.
2. **Persistence Removed**: *localStorage.removeItem("coisas-partilhadas-user")*. This clears the persistent session data.

## 5. Custom Hook (*useAuth*)

The *useAuth* hook simplifies consuming the context:

```
export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
```

- **Role**: Encapsulates the *useContext* call.

- **Safety**: Includes a mandatory check to ensure the component is nested within the *AuthProvider*, throwing an explicit error otherwise.