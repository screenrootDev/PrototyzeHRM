# 🤖 PrototyzeHRM: Project Intelligence (AI Context)

This document provides essential context for AI assistants to understand the PrototyzeHRM codebase, its architecture, and specific implementation patterns.

## 🏗️ Core Architecture (The Stack)
- **Backend**: Laravel 12.0 (PHP 8.2+)
- **Frontend**: React 19.0 (TypeScript)
- **Bridge**: Inertia.js 2.0 (Classic monolith routing with SPA feel)
- **Styling**: Tailwind CSS v4.0 (CSS-first engine)
- **Build System**: Vite 6.0

## 🎨 UI & Design Philosophy
- **Component Library**: Based on **Radix UI** primitives for accessibility.
- **Icons**: Always use **Lucide React**.
- **Active States**: High-contrast active states are preferred. 
    - *Pattern*: `bg-primary/10 border border-primary/30 text-primary font-bold`.
    - *Sidebar*: Side-indicator bars or full borders for active navigation.
- **Responsiveness**: Mobile-first, but optimized for complex enterprise dashboards.

## 📂 Key Directory Map
- `resources/js/pages/`: Contains Inertia page components (The "Views").
- `resources/js/components/`: Shared UI components (Commonly using `shadcn/ui` style patterns).
- `app/Http/Controllers/`: Backend logic and data provisioning.
- `app/Models/`: Database schemas and relationships.
- `routes/web.php`: Entry points and Inertia routing.
- `resources/js/utils/helpers.ts`: Global utility functions (e.g., `getImagePath`).

## 🛠️ Critical Patterns to Follow

### 1. Navigation & Routing
- Use `Link` from `@inertiajs/react` for internal navigation.
- Use the `route()` helper (Ziggy) for URL generation: `route('settings.index')`.

### 2. Assets & Media
- **Never** hardcode paths. Always use the `getImagePath()` helper from `@/utils/helpers`.
- Default storage path: `storage/media/`.

### 3. State Management
- Use **Inertia Shared Data** (via `HandleInertiaRequests` middleware) for global state like `auth`, `globalSettings`, and `permissions`.
- Use React hooks (`useState`, `useEffect`, `useMemo`) for local component state.

### 4. Internationalization
- Use the `useTranslation` hook from `react-i18next`.
- Key pattern: `const { t } = useTranslation();` -> `t('Your Text Here')`.

## 📜 Coding Conventions
- **Naming**: PascalCase for React components, camelCase for variables/functions.
- **Styling**: Use Tailwind utility classes. Avoid custom CSS files unless absolutely necessary for complex animations.
- **Icons**: Clone icons when injecting into components to ensure consistent sizing:
  ```tsx
  {React.cloneElement(icon, { className: "h-4 w-4 mr-3" })}
  ```

## ⚠️ Known Implementation Details
- **Settings Dashboard**: Uses a single-page scrolling layout with an internal sub-navigation and a "Manual Scroll Lock" to prevent UI flickers.
- **Timezones**: Standardized to `Asia/Kolkata`.
- **Date Previews**: Typically set to future years (e.g., 2026) for demo consistency.

---
*Last Updated: May 2026*
