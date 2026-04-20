# Web Project (Next.js)

This is the web application for the **BookYourStay** platform.  
It is part of the monorepo located under `/apps/web`.

---

## 🚀 Getting Started

Run the development server:

npm run dev  
# or  
yarn dev  
# or  
pnpm dev  
# or  
bun dev  

Open http://localhost:3000 in your browser to see the result.  
You can start editing the homepage by modifying `app/page.tsx`. The page auto‑updates as you edit.

This project uses next/font to automatically optimize and load Geist.

---

## 📂 Project Structure

- `/src/app` → Next.js App Router pages and layouts  
- `/components` → shared UI components  
- `/lib` → utilities and hooks  
- `/types` → TypeScript type definitions  
- `/styles` → global styles  

---

## 🧩 Architectural Guidelines

All code in this project MUST follow the conventions defined in the global AGENTS.md file located in the root of the repository.

Key principles include:
- **Separation of Concerns (SoC)** — keep logic, UI, and types separated.  
- **Do Not Repeat Yourself (DRY)** — reuse components and utilities, avoid duplication.  
- **Type System Rules** — types must be centralized, well‑named, and documented.  

---

## 📖 Learn More

- Next.js Documentation  
- Learn Next.js  
- Next.js GitHub Repository  

---

## 📦 Deployment

The easiest way to deploy your Next.js app is via the Vercel Platform.  
See the Next.js deployment docs for more details.

---

## 📖 References

- Next.js Documentation  
- AGENTS.md — global architectural rules
