# Architecture Documentation

## System Overview

This is a full-stack web application for bookkeeping with a clear separation between frontend (React) and backend (NestJS) communicating via REST API.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    React Frontend                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │  Pages   │ │Components│ │ Services │ │  Context │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                         HTTP/REST                               │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER LAYER                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    NestJS Backend                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │Controllers│ │ Services │ │  Guards  │ │Entities  │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                         TypeORM                                  │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     PostgreSQL                          │   │
│  │  ┌──────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ ┌──────┐ │   │
│  │  │users │ │expenses│ │ income  │ │categories│ │...   │ │   │
│  │  └──────┘ └────────┘ └─────────┘ └─────────┘ └──────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Directory Structure
```
frontend/src/
├── components/          # Reusable UI components
│   ├── ui/             # Base components (Button, Card, Table, etc.)
│   └── dashboard/      # Feature-specific components
├── pages/              # Route-level components
├── services/           # API client services
├── context/            # React Context providers
├── hooks/              # Custom hooks
├── lib/                # Utilities and configurations
└── types/              # TypeScript type definitions
```

### Component Hierarchy
```
App
├── AuthProvider
│   └── Routes
│       ├── Public (Login, Register)
│       └── Protected (Layout)
│           ├── Sidebar Navigation
│           └── Outlet (Page Content)
│               ├── Dashboard
│               ├── Expenses
│               ├── Income
│               ├── Categories
│               ├── Clients
│               ├── Reports
│               └── Settings
```

### State Management

**Local State**: `useState` for component-specific state
**Shared State**: `useContext` for auth state
**Server State**: Direct API calls with `useEffect` (consider React Query for future)

### API Communication
```typescript
// lib/api.ts - Axios instance with interceptors
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: Add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
    }
    return Promise.reject(error);
  }
);
```

---

## Backend Architecture

### Directory Structure
```
backend/src/
├── entities/           # TypeORM entities (database models)
├── modules/            # Feature modules
│   ├── auth/          # Authentication
│   ├── expenses/      # Expense management
│   ├── income/        # Income tracking
│   ├── categories/    # Category management
│   ├── clients/       # Client management
│   ├── invoices/      # Invoice management
│   ├── reports/       # Financial reports
│   ├── budgets/       # Budget tracking
│   └── uploads/       # File uploads
├── guards/             # Auth guards
├── strategies/         # JWT strategy
├── migrations/         # Database migrations
├── data-source.ts      # TypeORM configuration
└── main.ts             # Application entry point
```

### Module Structure (NestJS)
```
expenses/
├── expenses.controller.ts    # HTTP request handlers
├── expenses.service.ts       # Business logic
├── expenses.module.ts        # Module configuration
└── dto/                      # Data transfer objects (optional)
```

### Request Flow
```
HTTP Request
    ↓
Controller (Route Handler)
    ↓
Guard (JWT Auth Check)
    ↓
Service (Business Logic)
    ↓
Repository (TypeORM)
    ↓
Database (PostgreSQL)
    ↓
Response (JSON)
```

### Dependency Injection
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Expense, Category])],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
```

---

## Database Schema

### Entity Relationship Diagram
```
users (1) ──< expenses >── (1) categories
   │
   ├──< income
   │
   ├──< clients >──< invoices >──< invoice_items
   │
   ├──< budgets
   │
   └──< attachments
```

### Key Entities

**users**
```typescript
{
  id: uuid (PK)
  email: string (unique)
  password: string (hashed)
  isActive: boolean
  isEmailVerified: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

**expenses**
```typescript
{
  id: uuid (PK)
  userId: uuid (FK → users)
  categoryId: uuid (FK → categories, nullable)
  amount: decimal(10,2)
  description: string
  date: date
  notes: string (nullable)
  isRecurring: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

**income**
```typescript
{
  id: uuid (PK)
  userId: uuid (FK → users)
  amount: decimal(10,2)
  description: string
  date: date
  type: enum (contractor, freelance, consulting, other)
  clientName: string (nullable)
  invoiceNumber: string (nullable)
  isPaid: boolean
  includesHst: boolean
  hstAmount: decimal (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**categories**
```typescript
{
  id: uuid (PK)
  userId: uuid (FK → users)
  name: string
  type: enum (expense, income)
  description: string (nullable)
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## Authentication Flow

### Registration
```
1. User submits email/password
2. Backend validates input
3. Password hashed with bcrypt
4. User record created in database
5. JWT token generated and returned
6. Frontend stores token in localStorage
```

### Login
```
1. User submits email/password
2. Backend finds user by email
3. Password compared with bcrypt
4. JWT token generated and returned
5. Frontend stores token in localStorage
```

### Protected Request
```
1. Frontend adds JWT to Authorization header
2. Backend JwtAuthGuard validates token
3. User ID extracted from token payload
4. Request proceeds with user context
```

### JWT Token Structure
```typescript
{
  sub: userId,
  email: userEmail,
  iat: issuedAt,
  exp: expiration (7 days)
}
```

---

## Reports Calculation Logic

### Profit & Loss Statement
```typescript
totalIncome = sum(income.amount where date in period)
totalExpenses = sum(expense.amount where date in period AND category != 'Owner Distribution')
ownerDistributions = sum(expense.amount where category == 'Owner Distribution')
netProfit = totalIncome - totalExpenses
// Note: Owner distributions shown separately, not in netProfit calculation
```

### Balance Sheet
```typescript
assets = accountsReceivable (unpaid invoices)
liabilities = accountsPayable + hstPayable
retainedEarnings = allTimeIncome - allTimeExpenses
equity = retainedEarnings
```

### Cash Flow Statement
```typescript
operatingActivities:
  cashFromCustomers = sum(paid income)
  cashToSuppliers = sum(expenses excluding owner distributions)
  netOperatingCash = cashFromCustomers - cashToSuppliers

financingActivities:
  ownerDistributionsPaid = sum(owner distribution expenses)
  netFinancingCash = -ownerDistributionsPaid

totalCashFlow = netOperatingCash + netFinancingCash
```

---

## Security Measures

### Authentication
- JWT tokens with 7-day expiration
- Passwords hashed with bcrypt (salt rounds: 10)
- Protected routes require valid JWT

### Authorization
- User-scoped queries (all queries include userId filter)
- Cascade delete on user removal

### Input Validation
- Class-validator decorators on DTOs
- TypeORM entity validation

### Rate Limiting
- Throttler: 10 requests per minute per IP

### CORS
- Configured for specific frontend origin

---

## Error Handling

### Frontend
```typescript
try {
  await api.post('/expenses', data);
} catch (error) {
  if (error.response?.status === 400) {
    toast.error('Invalid input');
  } else if (error.response?.status === 401) {
    toast.error('Please log in');
  } else {
    toast.error('Something went wrong');
  }
}
```

### Backend
```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## Testing Strategy

### Backend Tests (Jest)
```typescript
// Unit test example
describe('ExpensesService', () => {
  let service: ExpensesService;
  let repository: Repository<Expense>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExpensesService,
        {
          provide: getRepositoryToken(Expense),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get(ExpensesService);
  });

  it('should create an expense', async () => {
    // Test implementation
  });
});
```

### Frontend Tests (Vitest)
```typescript
// Component test example
describe('ExpensesList', () => {
  it('should render empty state when no expenses', () => {
    render(<ExpensesList expenses={[]} />);
    expect(screen.getByText('No expenses found')).toBeInTheDocument();
  });
});
```

---

## Performance Considerations

### Frontend
- Code splitting with Vite
- Lazy loading of routes
- Memoization with React.memo and useMemo
- Virtual scrolling for large lists (future)

### Backend
- Database indexes on frequently queried columns
- Pagination for list endpoints
- Query optimization (avoid N+1)
- Connection pooling via TypeORM

### Database
- Indexes on: userId, date, categoryId
- Regular VACUUM and ANALYZE
- Connection pool sizing

---

## Deployment Architecture

```
┌─────────────────┐
│   Load Balancer │
│   (nginx/ALB)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│Frontend│ │ Backend │
│(static)│ │ (NestJS)│
└────────┘ └───┬─────┘
               │
         ┌─────▼─────┐
         │ PostgreSQL│
         │  (RDS)    │
         └───────────┘
```

### Environment Variables
```bash
# Backend
DATABASE_HOST=prod-db.example.com
DATABASE_PORT=5432
DATABASE_USER=bookkeeping
DATABASE_PASSWORD=<secure>
DATABASE_NAME=bookkeeping_prod
JWT_SECRET=<secure-random-string>
NODE_ENV=production
```

---

## Monitoring & Observability

### Logging
- Winston logger with file transport
- Structured JSON logs for production
- Log levels: error, warn, info, debug

### Metrics to Track
- API response times
- Error rates by endpoint
- Database query performance
- Active users

### Health Checks
```typescript
@Get('health')
async health() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

---

## Future Architecture Considerations

### Scalability
- Horizontal scaling with load balancer
- Redis for session caching
- Read replicas for database
- CDN for static assets

### Microservices (if needed)
- Separate service for reports (compute-intensive)
- Separate service for file uploads
- Message queue for async operations

### Features
- Webhooks for integrations
- WebSocket for real-time updates
- GraphQL for complex queries
