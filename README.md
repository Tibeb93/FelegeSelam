# Aemade Selam Sunday School Management System
## አዕማደ ሰላም ሰንበት ትምህርት ቤት

A full-stack management system for Aemade Selam Sunday School (Ethiopian Orthodox Tewahedo Church).

### Monorepo Structure
- `/api` - NestJS 10 backend REST API with Prisma ORM and MySQL 8.0
- `/web` - Next.js 14 App Router frontend with Tailwind CSS, shadcn/ui, next-intl
- `/docs` - System documentation, architecture, and guides

### Quick Start
1. Start infrastructure:
   ```bash
   docker compose up -d
   ```
2. Start API:
   ```bash
   cd api
   npm install
   npm run dev
   ```
3. Start Web:
   ```bash
   cd web
   npm install
   npm run dev
   ```

Swagger documentation will be available at [http://localhost:3000/api/docs](http://localhost:3000/api/docs).
Web application will be available at [http://localhost:3001](http://localhost:3001).
Adminer database manager will be available at [http://localhost:8080](http://localhost:8080).
