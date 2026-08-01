FROM node:20-alpine

WORKDIR /app

# Tạo package.json tối giản chứa đầy đủ dependencies của API
RUN echo '{"type":"module","dependencies":{"fastify":"^4.24.3","@fastify/cors":"^8.4.1","pg":"^8.11.3","dotenv":"^16.3.1","jose":"^5.1.3"}}' > package.json

# Cài đặt dependency
RUN npm install --omit=dev --prefer-offline

# Copy code dist có sẵn
COPY dist/ ./dist/

# Copy routes (git-tracked) vào dist/routes/ cho Docker build
COPY routes/ ./dist/routes/

# Copy migrations (áp dụng bằng `node dist/migrate.js` — không chạy tự động lúc start)
COPY migrations/ ./migrations/

# Expose port
EXPOSE 3001

CMD ["node", "dist/index.js"]
