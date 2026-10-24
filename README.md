# Aemade Selam Sunday School Management System
## አዕማደ ሰላም ሰንበት ትምህርት ቤት አስተዳደር ሥርዓት

[![CI/CD Pipeline](https://github.com/aemade-selam/sunday-school-system/actions/workflows/ci.yml/badge.svg)](https://github.com/aemade-selam/sunday-school-system/actions)
[![License: UNLICENSED](https://img.shields.io/badge/License-Proprietary-blue.svg)](LICENSE)
[![Security Review: PASSED](https://img.shields.io/badge/OWASP%20Top%2010-PASSED-success.svg)](docs/security-review.md)
[![Accessibility: WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success.svg)](docs/performance.md)

An enterprise-grade, bilingual (Amharic & English) management system and community portal designed specifically for Ethiopian Orthodox Tewahedo Church Sunday Schools.

---

### Project Architecture & Navigation
- [`/api`](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/api) — NestJS 10 REST API, Prisma ORM, Argon2, Supertest, Jest
- [`/web`](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/web) — Next.js 14 App Router, Tailwind CSS, Lucide, Recharts, Playwright
- [`/docs`](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/docs) — Architecture, API guide, ERD, Security review, User manuals
- [`/scripts`](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/scripts) — Automated backups, restore recovery, and acceptance tests

---

### Documentation Index
| Document | Purpose |
|---|---|
| [Quick Setup in 5 Minutes](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/docs/README.md) | Step-by-step local & production deployment guide |
| [System Architecture](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/docs/architecture.md) | Micro-module design, data flows, and tech stack |
| [REST API Guide](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/docs/api-guide.md) | Complete OpenAPI/Swagger endpoints & schemas |
| [Database Schema & ERD](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/docs/database-schema.md) | Relational schema diagrams, tables, and constraints |
| [Production Deployment Guide](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/docs/deployment.md) | Multi-stage Docker, Nginx, Let's Encrypt TLS setup |
| [Backup & Disaster Recovery](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/docs/backup-restore.md) | Nightly dumps, 30-day retention & verified restore |
| [Production Hardening & Security](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/docs/security-notes.md) | Server hardening checklist, SSH, fail2ban & secret rotation |
| [OWASP Security Audit](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/docs/security-review.md) | Security review against OWASP Top 10 |
| [Performance Report](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/docs/performance.md) | 200 concurrent users load test & latency benchmarks |
| [User Manual (Amharic - አማርኛ)](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/docs/user-manual-am.md) | የተሟላ የአስተዳዳሪ፣ የመምህራንና የአባላት መመሪያ |
| [User Manual (English)](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam/docs/user-manual-en.md) | Operational walkthrough for Admins, Teachers & Members |

---

### Quick Production Deployment
```bash
cp .env.production.example .env
docker compose -f docker-compose.prod.yml up -d --build
node scripts/acceptance-check.js
```
