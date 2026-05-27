# 💸 Money Manager — Frontend Web App

A modern, responsive, and performance-optimized Single Page Application (SPA) built with **React 19**, **Vite**, and **Tailwind CSS**. It connects to the Money Manager Spring Boot backend to manage profiles, track incomes/expenses, categorize items, and view detailed analytics.

---

## 🚀 Key Features

* **Authentication & Profiles**: Secure registration, login, activation, and forgot-password screens.
* **Dashboard & Analytics**: Rich interactive charts (using Recharts) for monthly income vs. expense.
* **Transaction Tracking**: Add, update, delete, search, and filter expenses and incomes.
* **Categories & Subcategories**: Fully customizable category list with individual icons and color tags.
* **Responsive Design**: Mobile-first premium layout with custom glassmorphism styling.
* **Excel Exports**: Fast data exporting utilizing sheet-based libraries.

---

## 🛠️ Tech Stack & Optimization

* **Core**: React 19, Vite, Tailwind CSS v4, React Router DOM v7, Axios.
* **Visuals & Icons**: Recharts (for charts), Lucide React (for premium icons).
* **Build Chunking & Performance**: 
  Configured in `vite.config.js` to split heavy libraries (`react/react-dom`, `recharts`, `xlsx`, `emoji-picker-react`) into standalone chunks. This guarantees fast page loads and leverages browser caching, maintaining bundle sizes under **500kB**.
* **SPA Routing Fix**: Includes `vercel.json` to handle client-side routing rewrites for sub-paths on Vercel.

---

## 💻 Local Setup & Development

### 1. Prerequisites
Ensure you have **Node.js (v18+ or v20+)** and **npm** installed.

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `VITE_API_BASE_URL` is pointing to your backend endpoint:
```env
VITE_API_BASE_URL=http://localhost:8080/api/v1.0
```

### 3. Install & Start
```bash
# Install dependencies
npm install

# Run the development server (runs at http://localhost:5173 by default)
npm run dev
```

### 4. Build for Production
```bash
npm run build
```
This outputs minified, chunked assets to the `dist/` directory.

---

## ☁️ Production Deployment on Vercel

The frontend is ready for zero-config deployment on Vercel.

### Option A: Via Vercel CLI
```bash
# Install Vercel CLI globally (if not already installed)
npm install -g vercel

# Run vercel deploy from the frontend folder
vercel
```

### Option B: Via Vercel Web Dashboard (GitHub integration)
1. Push this frontend directory to its own GitHub repository.
2. Link the repository in the Vercel Dashboard.
3. Configure the following settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `./` (or the folder containing `package.json`)
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
   * **Environment Variables**: Add `VITE_API_BASE_URL` pointing to your deployed Render backend (e.g. `https://money-manager-backend.onrender.com/api/v1.0`).

---

## 📂 Project Structure

```
money-manager-frontend/
├── dist/                # Minified production build assets
├── public/              # Static public resources (logos, background images)
├── src/
│   ├── assets/          # Shared asset media
│   ├── components/      # Reusable UI components (Navbar, Sidebar, Cards, Loader)
│   ├── layout/          # Layout wrappers (MainLayout, AuthLayout)
│   ├── pages/           # Pages (Dashboard, Expenses, Incomes, Categories, Profile, Admin)
│   ├── utils/           # Helper scripts and Axios configs
│   ├── App.jsx          # Root App component and routing definitions
│   └── main.jsx         # App entry point
├── vercel.json          # SPA routing configuration rules
├── vite.config.js       # Vite build, plugins, and custom chunk configurations
└── package.json         # Dependencies & scripts
```
