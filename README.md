# 🖥️ QuduHub Admin Frontend (Dumb UI)
**Client-Side UI, Role-Based Rendering & API Communication**

## 🏗️ 1. Architecture Overview
This is a purely static Next.js application (`output: 'export'`) hosted on Cloudflare Pages. It contains **no backend logic, no database drivers, and no secrets**. It serves purely as the visual interface for the QuduHub team.

## 🔐 2. Authentication & Role-Based UI
We use `@supabase/supabase-js` purely for client-side authentication (Google OAuth). 
*   **The Session:** Once logged in, the Supabase session provides a JWT.
*   **The API Handshake:** The frontend immediately sends this JWT to the backend (`GET NEXT_PUBLIC_API_URL/api/team/me`).
*   **Role-Based Rendering:** The backend returns the user's `role` and `scope`. The UI uses this state globally (via Zustand or Context) to conditionally render the interface:
    *   `FOUNDER` / `SUPER_ADMIN`: Sees all tabs (Dashboard, Revenue, Team Management, Content Upload).
    *   `EDITOR`: Only sees the "Content Upload" tab. Revenue and Team tabs are completely hidden from the DOM.

## 📡 3. Data Fetching Strategy
Since this is a static app, all data fetching happens strictly on the client side using standard `fetch` (or SWR/React Query).
*   Every `fetch` request to `NEXT_PUBLIC_API_URL` MUST include the Supabase JWT in the `Authorization: Bearer <token>` header.
*   **No Direct DB Access:** The frontend NEVER talks to Supabase tables, D1, or R2 directly. It only talks to the Hono API Worker.

## 🛡️ 4. File Upload Process
When an admin uploads a PDF:
1. The frontend collects the File and Metadata (Course, Subject, etc.).
2. It packages this into a `FormData` object.
3. It sends a `POST` request to the backend API.
4. The backend handles the actual R2 upload and D1 insertion.

## 🚀 5. Environment Variables
Requires a `.env.local` file:
*   `NEXT_PUBLIC_SUPABASE_URL`: For initiating login.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Client-safe key for login.
*   `NEXT_PUBLIC_API_URL`: Points to the Hono backend (e.g., `http://localhost:8787` for local dev).