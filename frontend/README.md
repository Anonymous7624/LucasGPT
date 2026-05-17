# LucasGPT Frontend

React + Vite frontend for LucasGPT.

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173`

## Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:4000
```

For production (GitHub Pages), change to your public backend URL:

```env
VITE_API_BASE_URL=http://YOUR_PUBLIC_IP:4000
```

## Deploy to GitHub Pages

1. Update `VITE_API_BASE_URL` to your production backend URL
2. Update `base` in `vite.config.js` to match your repository name
3. Build: `npm run build`
4. Deploy the `dist/` folder to `gh-pages` branch

See main README for detailed deployment instructions.
