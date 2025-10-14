# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript application built with Vite, using shadcn/ui components and Tailwind CSS. The project appears to be "Vox Operis" - a web application with authentication, dashboard functionality, and various content pages.

## Development Commands

- `npm run dev` - Start development server (runs on port 8080)
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Architecture

### Project Structure
- `src/` - Main source directory
  - `components/` - React components including page components and UI library
    - `ui/` - shadcn/ui component library
    - Page components: `Home.tsx`, `Dashboard.tsx`, `Auth.tsx`, `Features.tsx`, `Blog.tsx`, `About.tsx`
  - `hooks/` - Custom React hooks
  - `lib/` - Utilities and shared logic
  - `pages/` - Route-specific pages (e.g., `NotFound.tsx`)

### Key Technologies & Libraries
- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite with SWC plugin
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Routing**: React Router DOM v6
- **State Management**: React Query (@tanstack/react-query)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Themes**: next-themes for dark mode support

### Application Flow
The app uses a simple authentication state managed in `App.tsx`. Routes are protected based on `isAuthenticated` state:
- Unauthenticated users see Home → Auth flow
- Authenticated users are redirected to Dashboard
- Protected route at `/dashboard/*` requires authentication

### Configuration Files
- `vite.config.ts` - Vite configuration with path aliases (`@` → `./src`)
- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Tailwind with custom theme and CSS variables
- `eslint.config.js` - ESLint with TypeScript and React plugins
- `tsconfig.*.json` - TypeScript configurations for app and build

### Path Aliases
The project uses `@/` as alias for `src/` directory:
- `@/components` → `src/components`
- `@/lib` → `src/lib`  
- `@/hooks` → `src/hooks`

## Development Notes

### Styling System
- Uses CSS variables defined in `src/index.css` for theming
- Tailwind configured with custom color palette based on CSS variables
- Dark mode support via `next-themes` with class-based toggling

### Component Patterns
- Extensive use of shadcn/ui components for consistent UI
- Custom hooks in `src/hooks/` directory
- Utility functions in `src/lib/utils.ts` using `clsx` and `tailwind-merge`

### Build Configuration
- Development server runs on port 8080 with host "::" 
- Uses `lovable-tagger` component tagger in development mode
- SWC used for fast React compilation