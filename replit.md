# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a mobile app (Expo) for BOOOMERANGS clothing brand.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### BOOOMERANGS Mobile App (`artifacts/booomerangs`)
- **Type**: Expo (React Native + TypeScript)
- **Preview path**: `/`
- **Backend**: https://booomerangs.ru/api (external, not managed here)
- **Auth**: httpOnly cookies via axios withCredentials
- **Storage**: expo-secure-store for sessionId (cart), AsyncStorage for favorites
- **Theme**: Dark (#000000 bg, #ffffff foreground, #111111 cards)
- **Navigation**: 4 tabs (Каталог, Корзина, Избранное, Профиль) + product/[id], orders, checkout screens

### Key Files
- `app/_layout.tsx` — Root layout with providers (Auth, Favorites, Cart, QueryClient)
- `app/(tabs)/_layout.tsx` — Tab bar config with cart badge
- `context/AuthContext.tsx` — Auth state (login/register/logout via cookies)
- `context/CartContext.tsx` — Cart state with sessionId logic (guest vs logged-in)
- `context/FavoritesContext.tsx` — Favorites persisted via AsyncStorage
- `lib/api.ts` — axios instance pointing to https://booomerangs.ru/api
- `lib/types.ts` — TypeScript types (Order, CdekData, RawOrderItem, User with loyalty fields) + formatPrice helper

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
