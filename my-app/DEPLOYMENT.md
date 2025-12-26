# Deployment Guide

This React application is ready to be deployed on various hosting platforms.

## Prerequisites

1. Build the application:
```bash
cd my-app
npm run build
```

This creates a `dist` folder with the production-ready files.

## Hosting Options

### Option 1: Vercel (Recommended - Easiest)

1. Install Vercel CLI (optional, you can also use the web interface):
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd my-app
vercel
```

Or use the web interface:
- Go to [vercel.com](https://vercel.com)
- Sign up/login
- Click "New Project"
- Import your Git repository or drag & drop the `dist` folder
- Vercel will auto-detect the settings from `vercel.json`

**Note:** The `vercel.json` file is already configured for React Router.

### Option 2: Netlify

1. Install Netlify CLI (optional):
```bash
npm i -g netlify-cli
```

2. Deploy:
```bash
cd my-app
netlify deploy --prod --dir=dist
```

Or use the web interface:
- Go to [netlify.com](https://netlify.com)
- Sign up/login
- Drag & drop the `dist` folder
- Or connect your Git repository

**Note:** The `netlify.toml` file is already configured for React Router.

### Option 3: GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to `package.json`:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

3. Deploy:
```bash
npm run deploy
```

4. Enable GitHub Pages in your repository settings and set source to `gh-pages` branch.

### Option 4: Other Static Hosting

You can upload the `dist` folder to any static hosting service like:
- AWS S3 + CloudFront
- Firebase Hosting
- Surge.sh
- Cloudflare Pages

Just make sure to configure redirects so React Router works correctly (all routes redirect to `index.html`).

## Important Notes

- The application uses React Router, so make sure redirects are configured (already done for Vercel and Netlify)
- Update the API endpoint in `statement.jsx` when you have a backend
- Environment variables can be added through your hosting platform's dashboard

## Quick Deploy Commands

**Vercel:**
```bash
npm i -g vercel && cd my-app && vercel
```

**Netlify:**
```bash
npm i -g netlify-cli && cd my-app && npm run build && netlify deploy --prod --dir=dist
```

