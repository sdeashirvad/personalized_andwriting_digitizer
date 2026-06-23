# ─── Stage 1: Build frontend ────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --silent
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Production image ──────────────────────────────────────────────
FROM node:20-alpine AS production

# Install Python + Tesseract for OCR sidecar
RUN apk add --no-cache \
    python3 \
    py3-pip \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    && pip3 install --no-cache-dir flask flask-cors pillow pytesseract --break-system-packages

WORKDIR /app

# Backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production --silent

# Copy source files
COPY backend/ ./backend/
COPY ocr-service/ ./ocr-service/

# Copy built frontend into backend's public dir for static serving
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create storage dirs
RUN mkdir -p /app/storage/uploads /app/storage/processed /app/storage/exports

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:${SERVER_PORT:-3001}/health || exit 1

# Expose port
EXPOSE ${SERVER_PORT:-3001}

# Start all three services
CMD ["sh", "-c", "\
    python3 /app/ocr-service/app.py & \
    node /app/backend/src/server.js \
"]
