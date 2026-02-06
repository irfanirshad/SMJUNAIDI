# Basic Skills Required

To successfully work with **Turbo BabyMart**, you should be comfortable with the following technologies and concepts. This project is a full-stack monorepo, so it covers a wide range of modern web and mobile development skills.

## Core Technologies

### 1. JavaScript & TypeScript
- **JavaScript (ES6+)**: proficiency with modern JavaScript features (User async/await, restructuring, modules).
- **TypeScript**: The entire project uses TypeScript. You should understand types, interfaces, and generics.

### 2. Frontend Development (Web & Admin)
- **React.js**: Functional components, Hooks (`useState`, `useEffect`, `useContext`), and custom hooks.
- **Next.js**: (For the Web Storefront) Understanding of App Router, Server Components vs Client Components, and routing.
- **Vite**: (For the Admin Dashboard) Basic understanding of Vite as a build tool.
- **Tailwind CSS**: Utility-first CSS framework used for styling both the Web and Admin apps.
- **Shadcn UI**: We use Shadcn UI components. Familiarity with how to use and customize them is helpful.

### 3. Backend Development (API)
- **Node.js & Express**: Building RESTful APIs, middleware, and routing.
- **MongoDB & Mongoose**: NoSQL database design, schemas, and queries.

### 4. Mobile Development (Optional)
- **React Native**: If you plan to modify the mobile app (`apps/mobile`), you need to know React Native.
- **Expo / CLI**: Basic understanding of running iOS and Android simulators.

## Key Concepts

### Monorepo Architecture
This project uses **Turborepo** to manage multiple applications and packages in a single repository.
- **Shared Packages**: Code in `packages/` (like config, UI, types) is shared across apps.
- **Workspaces**: Understanding how `npm` workspaces link dependencies.

### Environment Variables
- Managing secrets (API keys, database URIs) using `.env` files.
- Understanding the difference between server-side (hidden) and client-side (exposed) variables.

## Tools & Services

- **Git**: Version control.
- **Stripe**: Payment processing concepts.
- **Cloudinary / AWS S3**: Image storage and upload handling.
- **Firebase Auth**: User authentication flows.
