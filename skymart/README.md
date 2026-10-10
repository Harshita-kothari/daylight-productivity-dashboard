# SkyMart — local authentication

Requires Node.js 22.13 or newer (uses built-in SQLite).

From this folder run `npm install`. Start `npm run server` in one terminal and `npm run dev -- --port 5175` in another. Open http://127.0.0.1:5175/register.

Accounts persist in `data/accounts.sqlite`. Passwords use scrypt with random per-account salts. Sessions use random tokens in HttpOnly, SameSite cookies; only token hashes are stored in SQLite. Registration signs in immediately, and sessions last seven days. Sign-out invalidates the server session. There is no email verification or password recovery in this local version.

The API binds only to 127.0.0.1:3001. Vite forwards `/api` to it. Both processes must run for accounts to work. The Vercel website still serves the previously deployed demo; a public deployment requires a hosted backend and durable database. Do not deploy this SQLite API as a Vercel function.

Run `npm run build` to check the frontend. With the API running, `node verify-auth.mjs` checks registration, duplicate rejection, incorrect passwords, sessions, logout, and saved-account login. Each test run creates an account named Verification Account with an example.com address.

The `data/` folder is excluded from Git and Vercel uploads. Keep it to preserve local accounts.

## Shopping pages

After signing in, `/home` displays the personalized dashboard, cart totals, category shortcuts, and five top-rated products. `/shop` contains 20 sample products with search, category filters, and price/rating sorting. Product cards open detail dialogs. `/about` contains store information.

Cart quantities and sample orders are stored per local account in this browser. The cart supports removal and quantity changes. Review Order can save a clearly labeled sample order; it does not accept payments or arrange delivery. Sample catalog data is bundled from Fake Store API; product images load from that provider.

## Public preview

The Vercel deployment uses `VITE_PUBLIC_PREVIEW=true` at build time. Visitors browse Home, Shop, About, product details, cart, and sample order review as guests. Public registration and sign-in display a clear message rather than simulate accounts. Local development retains real SQLite authentication.
