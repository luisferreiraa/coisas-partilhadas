import { verifyJwt } from "./jwt"

export function requireAuth(req: Request) {
    const auth = req.headers.get("authorization")

    if (!auth) {
        throw new Error("Unauthorized")
    }

    const token = auth.replace("Bearer ", "")
    return verifyJwt(token) as {
        sub: string
        username: string
    }
}