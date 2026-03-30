# LumenIQ

A React + TypeScript application built with Vite. Modern UI with Tailwind CSS and reusable React components.


## Frontend
### Quick Start

Make sure you have Node.js (18+) installed, then:

```bash
cd LumenIQ/Frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:single` - Build a single HTML file
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Tech Stack

Built with React 19, TypeScript, Vite, Tailwind CSS, Radix UI, and Lucide React. Includes custom Vite plugins for handling Figma-generated imports and version specifiers.

## Backend

FastAPI service. Requires **Python 3.11+**.

### Quick Start

From the repository root:

```bash
cd Backend
python3 -m venv .venv
source .venv/bin/activate 
pip install -r requirements.txt
cp .env.example .env        # then edit .env with your keys and secrets
python main.py
```

The API listens on **http://localhost:8080**. Interactive docs: **http://localhost:8080/docs** (disabled in production).

To run with backend directly (equivalent options):
```bash
uvicorn main:application --host 0.0.0.0 --port 8080 --reload
```

