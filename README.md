# QuduHub Admin Frontend Architecture 🛡️

Welcome to the **QuduHub Admin Frontend**. This application serves as the central command center for the QuduHub platform, allowing administrators and staff to manage universities, courses, subjects, chapters, and core educational resources (Rich text notes, PDFs, PYQs).

This frontend is designed for rapid data entry, featuring a slide-over master-detail layout, a powerful block-based rich text editor, and deep integration with our Cloudflare Worker edge backend.

---

## 1. System Architecture & Tech Stack

### Core Technologies
- **Framework:** [Next.js (App Router)](https://nextjs.org/) for server-side rendering, routing, and fast performance.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) for rapid, utility-first UI development.
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) with `persist` middleware for lightweight, local-storage-backed state.
- **Rich Text Editor:** [Tiptap](https://tiptap.dev/) (headless prose-mirror based editor) customized heavily for educational content.
- **Icons & Animations:** [Lucide React](https://lucide.dev/) for crisp SVGs and standard CSS transitions for snappy interactions.

### UI/UX Architecture (Master-Detail & Slide-Over)
The admin panel is built around a highly efficient **Master-Detail Layout**:
- The main view typically contains a heavily optimized `DataTable` or grid of entities (Universities, Courses, Subjects, Resources).
- Clicking an entity does *not* navigate away from the page context. Instead, it triggers a unified `SlideOverDrawer` component.
- The `SlideOverDrawer` mounts a unified `DataEntryForm` or specific editor view from the right side of the screen, allowing admins to rapidly edit, save, and dismiss without losing their place in the data table.

---

## 2. State Management (Zustand Deep Dive)

State is highly localized via React Hooks, with global state reserved strictly for authentication and cross-cutting concerns.

### `useAuthStore` (`src/lib/store.ts`)
We use Zustand to manage the critical path of the admin session:
- **Session & Identity:** `sessionToken` and `user` object (containing `email`, `role`, and `scope`) are persisted to `localStorage` using Zustand's `persist` middleware. This ensures the admin stays logged in across hard refreshes.
- **Toast Notifications:** A centralized toast notification system. `addToast` generates a unique ID, appends the toast to the state array, and sets a 4-second timeout that automatically calls `removeToast` to prevent memory leaks from stale DOM elements.

*(Note: Multi-tab document caching and complex viewer states are handled in the **Student Workspace Frontend**, whereas the Admin Frontend relies on instantaneous slide-over drawers for focused, single-item editing).*

---

## 3. Core UI/UX Features & Engineering

### Custom Tiptap Editor & Media Synchronization
The `TiptapEditor.tsx` is the most complex component in the admin panel. 
- It features custom nodes (`CustomImageNodeView`, `CalloutNodeView`, `CustomVideoNodeView`, `MultiSolutionNodeView`).
- **Zero-Bloat Synchronization:** When an admin uploads an image, it uses `ImageUploader.tsx` to push the file to the Cloudflare R2 bucket via the backend API. If the admin clicks the trash icon on the image *inside* the editor, the node is removed from local state. The final JSON diffing and actual R2 garbage collection are executed safely on the backend upon submission, preventing accidental data loss if the admin cancels the edit.

### The Slide-Over Drawer
`SlideOverDrawer.tsx` acts as the primary interaction surface for CRUD operations. It uses a fixed position overlay with CSS transforms (`translate-x-full` to `translate-x-0`) to slide in smoothly. It receives generic `children` (typically a `DataEntryForm`), keeping the logic perfectly decoupled.

### Hierarchical Breadcrumb Navigation
Because the database is deeply nested (University ➔ Course ➔ Subject ➔ Chapter ➔ Resource), the `Breadcrumb.tsx` component parses the nested routing structure and provides instantaneous back-navigation to parent entities, reducing cognitive load during deep data entry sessions.

---

## 4. Folder Structure & Key Components

The `src/` directory is organized using the Next.js App Router structure combined with a flat component hierarchy.

```text
src/
├── app/
│   ├── admin/            # Core dashboard and hierarchy routes (Universities, Courses, etc.)
│   ├── team/             # Staff and permission management
│   ├── hq/               # God-mode / super-admin views
│   └── (public)/         # Login and public-facing authentication routes
├── components/
│   └── admin/
│       ├── AdminShell.tsx       # The master layout wrapper, sidebar, and navbar
│       ├── DataTable.tsx        # Reusable, sortable table for entity listing
│       ├── SlideOverDrawer.tsx  # The right-side master-detail drawer
│       ├── DataEntryForm.tsx    # Generic dynamic form engine for CRUD ops
│       ├── ImageUploader.tsx    # Direct-to-R2 upload component
│       ├── TiptapEditor.tsx     # The rich text engine
│       └── tiptap/              # Custom node views and extensions for Tiptap
└── lib/
    ├── api.ts                   # Centralized Fetch wrapper configured for the CF backend
    └── store.ts                 # Zustand stores (Auth, Toasts)
```

---

## 5. API Integration

Communication with the Cloudflare Worker backend is centralized in `src/lib/api.ts`.
- **Protocol:** Standard Web `fetch` API wrapped in custom interceptors.
- **Base URL:** Defined via `NEXT_PUBLIC_API_URL` (points to the Worker edge URL).
- **Authentication:** The `api.ts` wrapper automatically reads the `sessionToken` from `useAuthStore.getState()` and injects it into the `Authorization: Bearer <token>` header of every outgoing request.
- **Error Handling:** Centralized interception catches `401 Unauthorized` errors and automatically logs the user out, redirecting them to the login screen.

---

## 6. Local Setup & Development

### Prerequisites
Ensure you have `pnpm` installed on your machine.

### Installation
```bash
pnpm install
```

### Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8787/api
# Replace with your local Cloudflare Worker URL or Production URL
```

### Running the Local Dev Server
```bash
pnpm run dev
```
The admin frontend will start on `http://localhost:3000`.

---

## 7. Deployment

This application is optimized for deployment on **Cloudflare Pages** or **Vercel**.

Because this is a Next.js App Router project:
1. Push your code to GitHub.
2. Connect the repository to your hosting provider (Cloudflare Pages or Vercel).
3. Ensure the Build Command is set to `pnpm run build` and the Output Directory is `.vercel/output/static` (for CF Pages) or default for Vercel.
4. Add the `NEXT_PUBLIC_API_URL` environment variable in the dashboard.
5. Deploy! The frontend will be served blazingly fast via global CDNs.