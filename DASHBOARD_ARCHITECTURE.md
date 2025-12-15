# AgriRent Hub - Dashboard Architecture

## Overview
This document explains the complete dashboard architecture for AgriRent Hub, including role-based access control, dedicated dashboards, and the sidebar navigation system.

## Role-Based Dashboards

### 1. **Technician Dashboard** (`/dashboard/technician`)
**Access**: Technicians only
**Features**:
- Real-time intervention statistics (Pending, In Progress, Completed)
- Recent missions with equipment and location details
- Quick actions: Manage Interventions, View Planning
- Auto-fetches interventions assigned to or available to the logged-in technician

### 2. **Client Dashboard** (`/dashboard/client`)
**Access**: Clients only
**Features**:
- Rental statistics (Active, Pending, Total)
- Recent rental history with dates and status
- Quick actions: Browse Catalogue, Manage Rentals, View Invoices
- Shows only rentals belonging to the logged-in client

### 3. **Stock Manager Dashboard** (`/dashboard/stock-manager`)
**Access**: Stock Managers only
**Features**:
- Equipment inventory statistics (Total, Available, Rented, In Maintenance)
- Quick actions: Manage Stock, View Planning, Track Maintenance
- Filters equipment by owner (only shows equipment they manage)

### 4. **Accountant Dashboard** (`/dashboard/accountant`)
**Access**: Accountants only
**Features**:
- Financial statistics (Total Revenue, Pending Payments, Paid Count, Total Transactions)
- Quick actions: Manage Invoices, View Financial Reports, Track Payments
- Filters revenue by equipment ownership for non-Super Admins

### 5. **Admin/Super Admin Dashboard** (`/dashboard`)
**Access**: Admins and Super Admins
**Features**:
- Comprehensive overview with mock data (Users, Equipment, Active Rentals, Revenue)
- Recent rental activity
- Performance metrics and quick actions
- Full system-wide visibility

## Navigation Flow

### Smart Router (`Dashboard.tsx`)
When a user accesses `/dashboard`, they are automatically redirected to their role-specific dashboard:
- **Technician** → `/dashboard/technician`
- **Client** → `/dashboard/client`
- **Stock Manager** → `/dashboard/stock-manager`
- **Accountant** → `/dashboard/accountant`
- **Admin/Super Admin** → Stays on `/dashboard`

### Role Normalization
The system includes robust role normalization to handle various formats:
- Handles French variants (e.g., "Technicien" → "technician")
- Handles spacing ("Super Admin" → "super_admin")
- Handles capitalization ("ADMIN" → "admin")

## Sidebar Menu Structure

### Super Admin Menu
- Tableau de bord
- Utilisateurs
- Matériels
- Locations
- Interventions
- Statistiques
- Facturation
- Paramètres

### Admin Menu
- Tableau de bord
- Utilisateurs
- Matériels
- Locations
- Paramètres

### Stock Manager Menu
- Tableau de bord (links to `/dashboard/stock-manager`)
- Stock
- Planning
- Maintenance

### Technician Menu
- Tableau de bord (links to `/dashboard/technician`)
- Planning
- Interventions
- Statistiques
- Paramètres

### Client Menu
- Accueil (links to `/dashboard/client`)
- Catalogue
- Mes locations
- Factures

### Accountant Menu
- Tableau de bord (links to `/dashboard/accountant`)
- Facturation
- États financiers
- Paiements

## Route Protection

All dashboard routes are protected using `ProtectedRoute` component with role-based access control:
- **Super Admins** have access to ALL routes
- Other roles can only access routes specified in their `allowedRoles` array
- Unauthorized access attempts redirect to `/dashboard` (which then smart-redirects to their appropriate dashboard)

## Data Filtering

Each dashboard implements automatic data filtering:
- **Technicians**: See only their assigned or unassigned interventions
- **Clients**: See only their rentals
- **Stock Managers**: See only equipment they own/manage (unless Super Admin)
- **Accountants**: See only revenue from equipment they manage (unless Super Admin)
- **Super Admins**: See ALL data across the entire system

## Key Features

1. **Automatic Role Detection**: Uses `useAuth()` context to detect user role
2. **Normalized Role Handling**: Handles various role formats consistently
3. **Smart Redirects**: Automatically sends users to their appropriate dashboard
4. **Role-Specific UI**: Each role sees only relevant stats, actions, and data
5. **Secure Access Control**: Routes protected by role-based permissions
6. **Responsive Sidebar**: Collapsible sidebar with role-aware menu items

## Database Schema Requirements

For optimal functionality, ensure:
1. **interventions table** exists with proper RLS policies
2. **equipment.status** column exists
3. **equipment.owner_id** column exists for filtering
4. **rentals.payment_status** column exists
5. **profiles** table has `role` in `user_metadata`

## Testing Checklist

- [ ] Super Admin can access all routes
- [ ] Technician redirects to `/dashboard/technician`
- [ ] Client redirects to `/dashboard/client`
- [ ] Stock Manager redirects to `/dashboard/stock-manager`
- [ ] Accountant redirects to `/dashboard/accountant`
- [ ] Sidebar shows correct menu for each role
- [ ] Data filtering works per role
- [ ] Unauthorized routes redirect properly
- [ ] Role normalization handles French/English variants
