# If `src/` or other frontend files are missing

Some machines showed `frontend-muzz` with only `package.json`, `vite.config.ts`, and `node_modules` after folder moves or sync issues.

1. Check **OneDrive** → right‑click the folder → **Version history** and restore a version from before the restructure.
2. Or restore from your own backup / zip / another clone of the repo.

After restore you should have `src/`, `index.html`, `public/`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `components.json`, and `vercel.json` next to `package.json`.

The API is always in the sibling folder **`../backend-muzz/`**.
