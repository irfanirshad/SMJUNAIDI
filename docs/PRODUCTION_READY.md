# Production Ready Checklist

Before deploying **Turbo BabyMart** to production, ensure you have completed the following steps.

## 1. Environment Variables
- [ ] **API URL**: Ensure `NEXT_PUBLIC_API_URL` and `VITE_NEXT_PUBLIC_API_URL` point to your production API domain (e.g., `https://api.yourdomain.com`), not localhost.
- [ ] **Database**: Use a production MongoDB Atlas cluster with proper IP whitelisting.
- [ ] **Payments**: Switch Stripe keys from "Test Mode" to "Live Mode".
- [ ] **Auth**: Update Firebase "Authorized Domains" to include your production domain.

## 2. Security
- [ ] **CORS**: Update `apps/api/.env` `CLIENT_URL` and `ADMIN_URL` to your actual production domains.
- [ ] **Console Logs**: Ensure `NEXT_PUBLIC_SHOW_CONSOLE_WARNING` is set to `true` or remove sensitive logs.

## 3. SEO & Metadata
- [ ] **Sitemap**: Update `apps/web/next-sitemap.config.js` with your production URL.
- [ ] **Robots.txt**: Ensure it allows indexing.
- [ ] **Meta Tags**: check `apps/web/app/layout.tsx` for default title and description.

## 4. Deployment
### Vercel (Frontend & Admin)
- Connect your GitHub repository.
- Add Environment Variables in Vercel Project Settings.
- Deploy `apps/web` and `apps/admin`.

### VPS / Railway / Render (Backend)
- Deploy the `apps/api` directory.
- Ensure the server is running on `NODE_ENV=production`.
- Use a process manager like `pm2` if deploying on a VPS.

## 5. Mobile App
- [ ] **App Icon**: Generate production icons.
- [ ] **Splash Screen**: Ensure it looks good.
- [ ] **Build**: Run `pnpm build:android` or `pnpm build:ios` for release builds.
