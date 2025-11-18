# Hospital Management System (HMS)

## Overview

A comprehensive bilingual (Arabic/English) Hospital Management System built as a modern web application. The system provides complete management capabilities for hospital operations including patient records, appointments, admissions, surgeries, pharmacy inventory, laboratory tests, radiology, human resources, payroll, and billing.

The application serves healthcare professionals including administrators, doctors, nurses, pharmacists, laboratory technicians, radiologists, and receptionists with role-based access control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite as build tool and development server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- React Hook Form with Zod validation for forms

**UI Framework:**
- shadcn/ui component library (Radix UI primitives)
- Tailwind CSS for styling with custom design system
- Material Design principles adapted for healthcare/enterprise applications
- RTL (Right-to-Left) support for Arabic language

**Design System:**
- Custom color scheme with HSL variables for theming
- Consistent spacing scale (2, 3, 4, 6, 8 units)
- Typography system with Cairo/Tajawal fonts for Arabic, Inter/Roboto for English
- Sidebar + Main Content layout pattern for clinical workflow efficiency

**State Management:**
- TanStack Query for API data fetching and caching
- Form state managed by React Hook Form
- UI state (toasts, dialogs) through React context and hooks

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js framework
- TypeScript for type safety
- Drizzle ORM for database operations
- Session-based authentication with Passport.js

**API Design:**
- RESTful API structure
- Routes organized by domain (patients, appointments, medications, etc.)
- Middleware-based authentication using `isAuthenticated` guard
- JSON request/response format
- Centralized error handling

**Authentication:**
- OpenID Connect (OIDC) integration with Replit Auth
- Session management with connect-pg-simple (PostgreSQL session store)
- Cookie-based sessions with 7-day TTL
- Role-based access control (admin, doctor, nurse, pharmacist, lab_tech, radiology_tech, receptionist)

**Database Layer:**
- Drizzle ORM with type-safe schema definitions
- Repository pattern through storage abstraction layer
- Neon serverless PostgreSQL driver with WebSocket support
- Schema validation using drizzle-zod

### Data Architecture

**Core Entities:**
- **Users:** Authentication and role management
- **Patients:** Complete patient records with quadruple name support
- **Appointments:** Scheduling system with doctor/patient relationships
- **Beds & Admissions:** Hospital bed management and patient admissions
- **Surgeries:** Surgical procedure tracking
- **Medications & Prescriptions:** Pharmacy inventory and prescription management
- **Lab Tests & Radiology Tests:** Diagnostic test management
- **Staff:** Employee records
- **Attendance, Leaves, Shifts:** HR time tracking
- **Payroll:** Salary and compensation management
- **Invoices:** Billing and financial transactions

**Schema Design:**
- PostgreSQL enums for status fields and categories
- Relations defined using Drizzle ORM relations API
- Timestamps for audit trails (createdAt, updatedAt)
- Decimal types for financial data
- JSONB for flexible metadata storage

### External Dependencies

**Database:**
- Neon Serverless PostgreSQL (accessed via DATABASE_URL environment variable)
- Session storage in `sessions` table
- WebSocket connection for real-time database access

**Authentication Service:**
- Replit OIDC provider (ISSUER_URL: https://replit.com/oidc)
- OAuth 2.0 / OpenID Connect flow
- User profile synchronization

**Development Tools:**
- Vite plugins for Replit integration (cartographer, dev-banner, runtime-error-modal)
- ESBuild for server-side bundling
- Drizzle Kit for database migrations

**UI Component Library:**
- Radix UI primitives (@radix-ui/react-*)
- Lucide React for icons
- date-fns for date formatting with Arabic locale support
- cmdk for command palette
- vaul for drawer components
- embla-carousel for carousels
- recharts for data visualization

**Validation & Forms:**
- Zod for schema validation
- @hookform/resolvers for React Hook Form integration
- drizzle-zod for automatic schema generation from database models

**Session Management:**
- express-session for session middleware
- connect-pg-simple for PostgreSQL session store
- SESSION_SECRET environment variable for signing sessions

**Environment Configuration:**
- DATABASE_URL: PostgreSQL connection string (required)
- SESSION_SECRET: Session encryption key (required)
- ISSUER_URL: OIDC provider URL (defaults to Replit)
- REPL_ID: Replit environment identifier
- NODE_ENV: Environment mode (development/production)