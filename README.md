# Handwriting Digitizer V1

A full-stack application that converts handwritten notebook pages into editable digital text using OCR. Features a human-in-the-loop correction workflow and a personal correction profile that improves accuracy over time.

---

## Features

- **OCR Processing** — Tesseract-powered text extraction from handwritten images
- **Confidence Scoring** — Words colour-coded by confidence (high / medium / low)
- **Interactive Review** — Click any word to correct it inline
- **Personal Correction Memory** — Your corrections are remembered and auto-suggested on future uploads
- **Export** — Download digitized documents as TXT, Markdown, or PDF
- **User Identity** — Lightweight username-based sessions (no auth required)
- **Dark Mode** — Full dark/light theme support
- **Responsive** — Works on desktop, tablet, and mobile

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                   Browser                   │
│         React + Vite + Tailwind CSS         │
│              port 5000 (dev)                │
└────────────────────┬────────────────────────┘
                     │ HTTP / REST
┌────────────────────▼────────────────────────┐
│            Backend (Node.js + Express)      │
│                  port 3001                  │
│                                             │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │ Upload Svc   │  │ Correction Memory   │  │
│  │ Document Svc │  │ Export Service      │  │
│  │ User Svc     │  │ OCR Client          │  │
│  └──────┬───────┘  └──────────┬──────────┘  │
│         │                     │             │
└─────────┼─────────────────────┼─────────────┘
          │                     │
┌─────────▼──────────┐  ┌───────▼─────────────┐
│   PostgreSQL DB    │  │  OCR Sidecar        │
│  (Replit built-in) │  │  Python + Tesseract │
└────────────────────┘  │  port 8000          │
                        └─────────────────────┘
```

### Correction Memory Flow

```
User corrects "systcm" → "system"
        ↓
Stored in corrections table (user_id, original, corrected, frequency)
        ↓
Next upload: OCR sees "systcm"
        ↓
Profile matched → suggestion shown inline
        ↓
User confirms → frequency incremented
```

---

## Tech Stack

| Layer     | Technology                                 |
|-----------|--------------------------------------------|
| Frontend  | React 18, Vite, TypeScript, Tailwind CSS   |
| Backend   | Node.js 20, Express 5                      |
| OCR       | Python 3.11, Flask, Tesseract, Pillow      |
| Database  | PostgreSQL (Replit built-in)               |
| Packaging | Docker, docker-compose                     |

---

## Folder Structure

```
/
├── frontend/              # React + Vite app
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/    # Shared UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   └── types/         # TypeScript types
│   └── vite.config.ts
│
├── backend/               # Express API server
│   └── src/
│       ├── db/            # Database pool + schema
│       ├── middleware/    # Error handler
│       ├── routes/        # documents, users, pages
│       └── services/      # Business logic
│
├── ocr-service/           # Python Flask OCR sidecar
│   └── app.py
│
├── storage/               # Local file storage
│   ├── uploads/           # Original uploaded files
│   ├── processed/         # Preprocessed images
│   └── exports/           # TXT / PDF / MD exports
│
├── Dockerfile
└── docker-compose.yml
```

---

## Screenshots

> _Upload screen, review interface, and export page screenshots would go here._

---

## Local Setup (Development)

### Prerequisites

- Node.js 20+
- Python 3.11+
- Tesseract OCR (`brew install tesseract` / `apt install tesseract-ocr`)
- PostgreSQL (or use Replit's built-in)

### 1. Clone and install

```bash
git clone <repo-url>
cd handwriting-digitizer

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..

# Install OCR sidecar dependencies
cd ocr-service && pip install -r requirements.txt && cd ..
```

### 2. Configure environment

```bash
# backend/.env
DATABASE_URL=postgresql://user:password@localhost:5432/handwriting_digitizer
OCR_SERVICE_URL=http://localhost:8000
SERVER_PORT=3001
```

### 3. Start all three services

**Terminal 1 — Frontend:**
```bash
cd frontend && npm run dev
```

**Terminal 2 — Backend:**
```bash
cd backend && node src/server.js
```

**Terminal 3 — OCR Service:**
```bash
cd ocr-service && python app.py
```

Visit `http://localhost:5000`

---

## Docker Setup

### Build and run

```bash
# With PostgreSQL (recommended)
DATABASE_URL=postgresql://user:pass@host:5432/dbname docker-compose up --build

# Or just the app (bring your own DB)
docker build -t handwriting-digitizer .
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://... \
  -v $(pwd)/storage:/app/storage \
  handwriting-digitizer
```

### Volumes

Uploaded files persist via the `/app/storage` volume mount. Always mount this in production to avoid data loss on container restart.

---

## Railway Deployment

1. Push this repository to GitHub
2. Create a new Railway project from GitHub
3. Add a **PostgreSQL** plugin — Railway auto-injects `DATABASE_URL`
4. Set environment variables:
   ```
   NODE_ENV=production
   SERVER_PORT=3001
   ```
5. Railway auto-detects the `Dockerfile` and deploys

Health check endpoint: `GET /health`

---

## Oracle VM Deployment

```bash
# Install Docker on Oracle Linux
sudo yum install -y docker
sudo systemctl start docker

# Clone and build
git clone <repo> && cd handwriting-digitizer
docker-compose up -d --build

# Open firewall port
sudo firewall-cmd --permanent --add-port=3001/tcp && sudo firewall-cmd --reload
```

---

## Database Configuration

### Using PostgreSQL (Recommended)

```bash
# Create database
createdb handwriting_digitizer

# Set environment variable
DATABASE_URL=postgresql://username:password@localhost:5432/handwriting_digitizer
```

The schema is created automatically on first startup.

Required environment variables:
| Variable            | Description                        |
|---------------------|------------------------------------|
| `DATABASE_URL`      | Full PostgreSQL connection string  |
| `PGHOST`            | Database host                      |
| `PGPORT`            | Database port (default: 5432)      |
| `PGUSER`            | Database username                  |
| `PGPASSWORD`        | Database password                  |
| `PGDATABASE`        | Database name                      |

---

## OCR Service Setup

The OCR sidecar uses Tesseract under the hood.

**Install Tesseract:**

```bash
# macOS
brew install tesseract

# Ubuntu/Debian
apt-get install tesseract-ocr tesseract-ocr-eng

# Alpine (Docker)
apk add tesseract-ocr tesseract-ocr-data-eng
```

**Configure the endpoint:**
```bash
OCR_SERVICE_URL=http://localhost:8000   # default
```

---

## Environment Variables

| Variable         | Default                      | Description                      |
|------------------|------------------------------|----------------------------------|
| `DATABASE_URL`   | —                            | PostgreSQL connection string     |
| `OCR_SERVICE_URL`| `http://localhost:8000`      | OCR sidecar URL                  |
| `SERVER_PORT`    | `3001`                       | Backend port                     |
| `STORAGE_PATH`   | `../storage`                 | File storage root                |
| `NODE_ENV`       | `development`                | Environment mode                 |

---

## Confidence Levels

| Level  | Threshold | Display          |
|--------|-----------|------------------|
| High   | ≥ 90%     | No highlight     |
| Medium | 70–89%    | Amber highlight  |
| Low    | < 70%     | Red highlight    |

---

## Troubleshooting

**OCR returns empty text**
- Ensure Tesseract is installed: `tesseract --version`
- Check OCR sidecar logs — it runs on port 8000

**Database connection refused**
- Verify `DATABASE_URL` is set correctly
- For Replit: the `DATABASE_URL` env var is injected automatically

**Images not displaying in review**
- Check that `storage/uploads/` is writable
- The image proxy route is `GET /api/pages/:pageId/image`

**Frontend can't reach backend**
- In development, Vite proxies `/api` requests to `localhost:3001`
- Verify the Backend API workflow is running

---

## Future Roadmap

- [ ] Fuzzy matching for correction suggestions
- [ ] Multi-page PDF support (pdf2image)
- [ ] Character-level handwriting profiles
- [ ] Vector similarity correction search
- [ ] Personal handwriting embeddings
- [ ] Multi-language support (Tesseract language packs)
- [ ] Offline desktop mode (Electron wrapper)
- [ ] Batch document processing
- [ ] Webhook notifications on processing complete
