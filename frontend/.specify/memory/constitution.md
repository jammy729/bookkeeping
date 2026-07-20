# Bookkeeping Frontend Constitution

## Core Principles

### I. User Experience First
Financial interfaces MUST be intuitive and error-resistant. Users MUST always know their current context. Critical actions (deletions, reversals) MUST have confirmation dialogs. Undo functionality REQUIRED for user actions where feasible.

### II. Data Accuracy & Validation
Client-side validation MUST provide immediate feedback. Numbers MUST be formatted consistently (currency, decimals, thousands separators). Dates MUST follow user's locale. No silent data loss on form submission—autosave or draft persistence REQUIRED.

### III. Accessibility (NON-NEGOTIABLE)
WCAG 2.1 AA compliance REQUIRED. Keyboard navigation MUST work for all features. Screen reader compatibility REQUIRED. Color MUST NOT be the only indicator of state. Focus states MUST be visible. ARIA labels REQUIRED for all interactive elements.

### IV. Performance Perception
Dashboard MUST be interactive within 2 seconds. Loading states MUST be shown for all async operations. Optimistic UI updates WHERE SAFE (non-financial data). Skeleton screens preferred over spinners. Progress indicators for batch operations.

### V. Responsive & Consistent
Mobile-responsive design REQUIRED for all views. Consistent component library MUST be used. Design tokens for colors, spacing, typography. States (loading, error, empty, success) MUST be designed for all components.

## Additional Constraints

### Technology Stack
- **Build**: Vite + React + TypeScript
- **UI Library**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **State Management**: TanStack Query (React Query) for server state, Zustand/Context for client state
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with CSS variables for theming
- **Testing**: Vitest + React Testing Library + Playwright for E2E

### UI/UX Standards
- Consistent date picker for all date inputs
- Consistent currency input component with validation
- Confirmation dialogs for destructive actions
- Toast notifications for success/error feedback
- Breadcrumbs for navigation hierarchy

### Data Display Standards
- All currency values MUST show 2 decimal places
- Negative numbers MUST be clearly indicated (parentheses or minus sign)
- Large numbers MUST use thousands separators
- Empty states MUST provide actionable guidance
- Tables MUST support sorting and filtering for data grids

### Error Handling
- User-friendly error messages (no technical jargon)
- Clear recovery actions for every error state
- Form errors MUST be inline and specific
- Network errors MUST offer retry options

### Security Considerations
- No sensitive data in localStorage (use sessionStorage or memory)
- Auto-logout after inactivity (configurable timeout)
- No PII in analytics or error tracking
- CSRF protection on all mutations

## Development Workflow

### Code Review Requirements
- All PRs require at least one review
- UI changes require visual review (screenshots/storybook)
- Accessibility changes require a11y audit

### Testing Gates
- Unit tests for all components with business logic
- Integration tests for user workflows
- E2E tests for critical user journeys
- Accessibility tests (axe-core) MUST pass

### Performance Gates
- Lighthouse performance score > 90
- No console errors or warnings
- Bundle size MUST be monitored (alerts on significant increases)

## Governance

This constitution supersedes all other frontend practices. Amendments require documentation, team approval, and migration plan for existing components.

**Version**: 1.0.0 | **Ratified**: 2026-07-19 | **Last Amended**: 2026-07-19
