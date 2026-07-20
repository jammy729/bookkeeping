# Bookkeeping App Development Roadmap

This document outlines the development plan for the bookkeeping application.

## Current Status (Updated: July 2026)

### ✅ Completed
- **Backend**: All core modules complete (Auth, Expenses, Income, Categories, Clients, Invoices, Reports, Budgets, Uploads)
- **Frontend**: Dashboard, Expenses, Income, Categories, Clients, Reports, Settings pages
- **Authentication**: JWT-based auth with guards
- **Database**: PostgreSQL with TypeORM, migrations system
- **Owner Distributions**: Merged into expenses as "Owner Distribution" category
- **Documentation**: README.md with full API documentation
- **DevOps**: Docker Compose for local development

### 🔄 In Progress
- Testing infrastructure
- CI/CD pipeline
- UI/UX improvements

### 📋 Backlog
- Budgets page (backend exists, needs frontend)
- Invoices page (backend exists, needs frontend)
- Advanced reporting features
- Mobile responsiveness improvements

---

## Architecture Overview

### Data Flow
```
User → Frontend (React) → API (NestJS) → TypeORM → PostgreSQL
                              ↓
                         Swagger Docs
```

### Key Design Decisions

1. **Owner Distributions as Expenses**: Money taken out by the owner is tracked as an expense category, not as a separate entity. This simplifies the accounting model.

2. **Net Profit Calculation**: 
   ```
   Net Profit = Income - All Expenses (including Owner Distributions)
   ```

3. **Reports Service**: Centralized service for generating P&L, Balance Sheet, and Cash Flow statements.

---

## Module Dependencies

```
AppModule
├── AuthModule
├── ExpensesModule
├── IncomeModule
├── CategoriesModule
├── ClientsModule
├── InvoicesModule
├── ReportsModule (depends on Income, Expense, Invoice entities)
├── UploadsModule
└── BudgetsModule
```

---

## Future Improvements (Prioritized)

### P0 - Critical
- [ ] Unit tests for ReportsService (complex calculations)
- [ ] Unit tests for AuthService
- [ ] E2E tests for critical paths
- [ ] GitHub Actions CI pipeline

### P1 - High Priority
- [ ] Budgets frontend page
- [ ] Invoices frontend page
- [ ] Form validation (React Hook Form + Zod)
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Docker production configuration

### P2 - Medium Priority
- [ ] React Query for data fetching
- [ ] Pagination for all tables
- [ ] Search functionality
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Bulk operations

### P3 - Nice to Have
- [ ] PDF export for reports
- [ ] Email notifications
- [ ] Bank integration (Plaid)
- [ ] Multi-currency support
- [ ] Recurring transactions automation

---

## Testing Strategy

### Backend (Jest)
- Unit tests for services
- Integration tests for controllers
- E2E tests for API endpoints

### Frontend (Vitest + React Testing Library)
- Component unit tests
- Integration tests for pages
- E2E tests with Playwright

### Coverage Goals
- Services: 80%
- Controllers: 70%
- Components: 60%

---

## Deployment Checklist

- [ ] Production environment variables set
- [ ] Database backups configured
- [ ] SSL/TLS enabled
- [ ] Rate limiting tuned for production
- [ ] Logging to external service (e.g., Datadog)
- [ ] Health check endpoint monitored
- [ ] Error tracking (e.g., Sentry)

---

## Quick Reference

### Local Development
```bash
# Start database
docker-compose up -d

# Backend
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev
```

### Testing
```bash
# Backend tests
cd backend && npm run test

# Frontend tests
cd frontend && npm run test
```

### Database
```bash
# Run migrations
cd backend && npm run migration:run

# Seed test data
cd backend && npm run seed
```

---

## Changelog

### v1.1.0 (July 2026)
- Merged dividends into expenses as "Owner Distribution" category
- Removed Dividends entity and module
- Updated Reports to show Owner Distributions separately
- Added comprehensive README.md

### v1.0.0 (Initial Release)
- Core CRUD for Expenses, Income, Categories, Clients
- Dashboard with charts
- Basic Reports (P&L, Balance Sheet, Cash Flow)
- JWT Authentication
