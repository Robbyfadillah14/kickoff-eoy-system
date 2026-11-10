FROM node:20-alpine
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && npm run seed --if-present && npm start"]
