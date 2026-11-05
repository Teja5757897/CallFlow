# -------- 1) Build the React frontend --------
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# -------- 2) Backend, serving the built frontend --------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY Backend/package*.json ./
RUN npm install --omit=dev
COPY Backend ./
COPY --from=frontend-builder /app/dist ./public

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://localhost:4000/api/health || exit 1
CMD ["node", "src/index.js"]
