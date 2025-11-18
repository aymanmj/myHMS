# Design Guidelines: Hospital Management System (HMS)

## Design Approach
**System-Based Approach**: Medical/Enterprise Application
- Primary inspiration: Material Design with healthcare enterprise patterns (Epic, Cerner)
- Focus: Clinical efficiency, data clarity, professional trust
- Principle: Function over form - every element serves workflow efficiency

## Layout Architecture

### Spatial Framework
- Use Tailwind spacing units: **2, 3, 4, 6, 8** exclusively
- Core container: `max-w-7xl mx-auto px-4`
- Section padding: `py-6` (mobile) → `py-8` (desktop)
- Card spacing: `p-4` to `p-6`
- Form field spacing: `space-y-4`

### Primary Layout Pattern
**Sidebar + Main Content** (Clinical Standard)
- Fixed sidebar: `w-64` on desktop, collapsible drawer on mobile
- Main content area: `flex-1` with `max-w-full` overflow handling
- Top navigation bar: `h-16` with breadcrumbs and user menu
- Content sections use `bg-white` cards with `rounded-lg shadow-sm`

## Typography System

### Font Families
- **Arabic**: 'Tajawal' or 'Cairo' (from Google Fonts)
- **English**: 'Inter' or 'Roboto' (fallback)
- **Monospace** (for IDs/codes): 'JetBrains Mono'

### Type Scale
- Page Titles: `text-2xl font-bold` (h1)
- Section Headers: `text-xl font-semibold` (h2)
- Card Titles: `text-lg font-medium` (h3)
- Body Text: `text-base` (default 16px)
- Labels: `text-sm font-medium`
- Helper Text: `text-sm text-gray-600`
- Data Tables: `text-sm`

## Component Library

### Navigation
- **Sidebar Menu**: Hierarchical with icons, active state indication, collapsible sections for departments
- **Top Bar**: Logo, breadcrumb navigation, global search, notifications bell, user avatar dropdown
- **Tabs**: For multi-section views (patient file tabs: Overview, Medical History, Appointments, etc.)

### Forms & Data Entry
- **Input Fields**: Clear labels above, helper text below, validation states (error/success)
- **Multi-field Name Entry**: Grid layout for quadruple name (4 columns on desktop, 2 on tablet, 1 on mobile)
- **Document Upload**: Drag-drop zones for ID cards, passports with preview thumbnails
- **Date Pickers**: Calendar overlays with quick selection
- **Dropdowns**: Searchable for long lists (doctors, medications)
- **Radio/Checkbox Groups**: Vertical for medical forms

### Data Display
- **Tables**: Striped rows, sticky headers, sortable columns, row actions (view/edit/delete)
- **Patient Cards**: Compact view with photo, name, ID, age, status badge
- **Status Badges**: Rounded pills (`rounded-full px-3 py-1 text-sm`) - Available/Occupied/Critical
- **Statistics Cards**: Grid of KPI cards with icons, numbers, trend indicators
- **Timeline**: Vertical for medical history, appointments

### Dashboards
- **Role-Based Layouts**:
  - Admin: 4-column stats grid, revenue charts, department status
  - Doctor: Appointment list, patient queue, recent cases
  - Pharmacy: Inventory alerts, prescription queue, expiry warnings
  - Lab: Test requests queue, pending results, equipment status

### Modal/Overlays
- **Standard Modal**: Centered, `max-w-2xl`, with header/body/footer
- **Slide-over Panel**: Right-side for quick patient details (w-96)
- **Confirmation Dialogs**: Compact, action-focused

## RTL Support (Arabic)
- Use `dir="rtl"` on Arabic pages
- Flip all directional utilities (ml ↔ mr, pl ↔ pr)
- Icons mirror appropriately (chevrons, arrows)
- Tables maintain natural data flow

## Medical-Specific Elements
- **Patient Header Bar**: Always visible with name, ID, age, allergies (red badges)
- **Emergency Indicators**: Red accent for critical patients/alerts
- **Prescription Format**: Structured medication cards with dosage, frequency, duration
- **Lab Results Table**: Normal range indicators, flagged abnormal values

## Visual Hierarchy
- White backgrounds for content areas
- Light gray (`bg-gray-50`) for page backgrounds
- Subtle borders (`border border-gray-200`) for cards
- Drop shadows minimal (`shadow-sm` default, `shadow-md` for elevated)

## Iconography
Use **Heroicons** exclusively via CDN:
- Outline style for navigation and secondary actions
- Solid style for status indicators and primary buttons
- Medical-relevant icons: user-group, calendar, clipboard, beaker, camera, document-text

## Responsive Behavior
- **Desktop (1024px+)**: Full sidebar, multi-column layouts, expanded tables
- **Tablet (768-1023px)**: Collapsible sidebar, 2-column grids, horizontal scroll tables
- **Mobile (<768px)**: Bottom nav or hamburger menu, single column, stacked cards

## Accessibility
- WCAG AA contrast ratios throughout
- Keyboard navigation for all interactive elements
- ARIA labels for icon-only buttons
- Focus indicators (ring-2 ring-offset-2)
- Form error messages linked to inputs

## Critical Constraints
- No decorative animations - functional feedback only (loading spinners, success checks)
- Minimize empty states - always show actionable content or data
- Consistent table row heights for scanning efficiency
- Print-friendly layouts for medical reports and forms

This system prioritizes clinical accuracy, workflow speed, and data integrity over visual novelty.