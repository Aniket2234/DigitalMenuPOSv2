# Replit.md

## Overview

"Mings Chinese Cuisine" is a luxurious, royal-themed restaurant menu web application designed to provide a premium dining experience. It features an elegant, interactive UI for sophisticated menu browsing and ordering. The project aims to offer a modern, authentic design with advanced animations and user-friendly features like a one-click rating system, while supporting both Replit and Vercel deployment strategies. Key capabilities include an integrated customer review system, robust media playback, and consistent menu item sorting.

## User Preferences

Preferred communication style: Simple, everyday language.
UI/UX Preference: Modern, authentic design with sophisticated animations and orange, black, white brand theming. Focus on easy-to-use features like one-click rating system.

## System Architecture

The application follows a traditional client-server architecture with clear separation between frontend and backend, unified by shared TypeScript schemas and a modern orange, black, and white brand theme.

### Frontend Architecture

-   **Framework**: React with TypeScript
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS with custom royal theme variables, Radix UI primitives with shadcn/ui components
-   **State Management**: TanStack Query for server state
-   **Routing**: Wouter for lightweight client-side routing
-   **Animations**: Framer Motion for smooth transitions
-   **UI/UX Decisions**: Elegant, interactive UI with deep midnight blue and golden accents (initial design), later updated to orange, black, and white brand theme. Includes a redesigned welcome page, restaurant logo integration, one-click 5-star rating, social media icons, and enhanced mobile responsiveness. Typography uses Open Sans for categories and menu item names.

### Backend Architecture

-   **Runtime**: Node.js with Express.js
-   **Language**: TypeScript with ES modules
-   **Database**: MongoDB Atlas (mingsdb database) - Shared with existing POS software
-   **Session Storage**: MongoDB-based sessions
-   **API**: RESTful API with JSON responses
-   **Technical Implementations**: Monorepo structure, full type safety across the stack, component-based UI, advanced animation system. Category-based data storage for menu items with automatic collection creation for new categories.
-   **Feature Specifications**: Menu display with category filtering and search, shopping cart functionality, Google review system integration, menu item sorting (Veg items first, then Chicken, then Prawns, then others), IST timezone support, and 5-hour visit count window protection.
-   **Order Storage**: All digital menu orders are stored in a separate collection `digital_menu_customer_orders` to avoid conflicts with the existing POS software that shares the same MongoDB database.

### Deployment Strategy

-   **Development**: `npm run dev` with Vite (frontend) and tsx (backend).
-   **Production**: Supports both Replit and Vercel.
    -   **Replit**: Single Node.js process serving static files and API.
    -   **Vercel**: Frontend static files served via CDN, backend as serverless functions (api/ directory).
-   **Configuration**: Environment variables (e.g., MONGODB_URI), static file serving, API routes.

## External Dependencies

### Frontend Dependencies

-   **UI Framework**: React
-   **State Management**: TanStack React Query
-   **Styling**: Tailwind CSS, Radix UI primitives, clsx, class-variance-authority
-   **Animations**: Framer Motion
-   **Forms**: React Hook Form with Zod validation
-   **Routing**: Wouter

### Backend Dependencies

-   **Server**: Express.js
-   **Database**: Drizzle ORM with @neondatabase/serverless (previously MongoDB Atlas driver), Zod schemas for validation
-   **Session Management**: connect-pg-simple

### Development Tools

-   **Build**: Vite, esbuild
-   **Database**: Drizzle Kit for migrations
-   **Linting**: TypeScript compiler checks
-   **Replit Integration**: Cartographer and error overlay plugins