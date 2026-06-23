# Handwriting Digitizer V1

A full-stack application that converts handwritten notebook pages into editable digital text using OCR. Features a human-in-the-loop review workflow and a personal correction profile that improves future accuracy.

## Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS — port 5000
- **Backend**: Node.js + Express — port 3001
- **OCR Service**: Python + Flask + Tesseract — port 8000
- **Database**: PostgreSQL (Replit built-in)

## Project Structure

```
/frontend      — React/Vite app
/backend       — Express API server
/ocr-service   — Python Flask OCR sidecar
/storage       — Local file storage
  /uploads     — Original uploaded files
  /processed   — Preprocessed images
  /exports     — Exported TXT/PDF/Markdown files
```

## Running the App

Three workflows run concurrently:
1. **Start application** — `cd frontend && npm run dev` (port 5000, webview)
2. **Backend API** — `cd backend && node src/server.js` (port 3001, console)
3. **OCR Service** — `cd ocr-service && python app.py` (port 8000, console)

## Core User Flow

1. User uploads a handwritten image
2. Backend stores file, OCR service processes it
3. Words are extracted with confidence scores
4. User reviews highlighted low-confidence words and corrects them
5. Corrections are persisted to the personal correction profile
6. Future uploads auto-suggest corrections from the profile
7. User exports the final document as TXT, PDF, or Markdown

## Confidence Levels

- **High** (≥90%): no review needed
- **Medium** (70–89%): shown for review
- **Low** (<70%): highlighted in red, requires correction

## User Preferences

- Keep all three services running in separate workflows
- Backend always on localhost (not 0.0.0.0); frontend on 0.0.0.0
- OCR sidecar on port 8000
