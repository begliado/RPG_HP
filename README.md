# Hogwarts RPG Asynchrone

## Setup

1. Crée les **Secrets** GitHub (`Settings > Secrets and variables > Actions`) :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Depuis GitHub UI, **Add file > Create new file** pour chacun des fichiers listés :
   - `.env.local.example`
   - `index.html`
   - `package.json`
   - `vite.config.js`
   - `tailwind.config.js`
   - `postcss.config.js`
   - `src/index.css`
   - `src/main.jsx`
   - `src/App.jsx`
   - `README.md`

3. Active **GitHub Pages** (Settings > Pages) :
   - Source : branche `main`
   - Dossier : `/ (root)`

4. (Optionnel) Lance un **Codespace** (Code > Codespaces) pour tester en ligne :
   ```bash
   npm install
   npm run dev
