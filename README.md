# Relay landing page

The public site for Relay: home, the four feature pages, and the help center.
Split out of [R-E-L-A-Y](https://github.com/AyushDas4890/R-E-L-A-Y) so it can ship on its own.

```bash
npm install
npm run dev     # http://localhost:5174
npm run build
npm test
```

"Log in" and "Get started" send people to the Relay app. Set `VITE_APP_URL` (see `.env.example`) to change where.

Deploy as its own Vercel project; every path is a real route, so `vercel.json` rewrites everything to `index.html`.

Note: `styles.css`, `apple-shell.css` and `apple-app.css` are copied from the app so the pages look identical;
they still carry app-only rules that can be pruned later.
