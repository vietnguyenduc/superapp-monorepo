# Cashflow App (Monorepo Module)

This is the Cashflow module of the Superapp Monorepo, built with React + TypeScript + Vite.

---

## Getting Started

### 1. **Node Version**
- Requires **Node.js >= 18**

### 2. **Install dependencies**
- At monorepo root:
  ```bash
  npm install
  ```
- Or at this app folder only:
  ```bash
  cd apps/cashflow
  npm install
  ```

### 3. **Environment Variables**
- Copy `.env.example` to `.env.local` and fill in your real credentials:
  ```bash
  cp .env.example .env.local
  # Edit .env.local with your Supabase credentials
  ```

### 4. **Development**
```bash
npm run dev
```
- App will run at [http://localhost:5173](http://localhost:5173) (or another port if busy).

### 5. **Build for Production**
```bash
npm run build
```
- Output in `dist/` folder.

### 6. **Preview Production Build**
```bash
npm run preview
```

### 7. **Lint & Format**
```bash
npm run lint         # Check code style (ESLint, may require compatible plugin versions)
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

### 8. **Testing**
```bash
npm run test         # Run all tests (Jest)
```

---

## Monorepo Notes
- Each app/module has its own `package.json`, `.env.local`, and config files.
- Shared code should be placed in `/packages` and imported via relative or alias path.
- Do **not** commit `.env.local` or `node_modules`.

---

## Troubleshooting
- If you see style or build errors, check `tailwind.config.js`, `postcss.config.cjs`, and ensure only one format is present.
- For import errors, check `tsconfig.app.json` and `vite.config.ts` for alias/moduleResolution settings.
- For ESLint errors, ensure plugin versions are compatible with ESLint flat config (v9+).

---

## Author & Contact
- Maintained as part of the Superapp Monorepo.
- For support, contact the monorepo maintainer.


This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
