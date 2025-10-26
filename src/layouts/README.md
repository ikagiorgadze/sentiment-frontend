# Application Layout Structure

This directory contains the main layout components for the application.

## Components

### AppLayout.tsx
Main application wrapper component that:
- Handles authentication state and redirects
- Manages sidebar visibility on mobile devices
- Provides the overall layout structure with sidebar and header
- Implements loading states during authentication checks

### Sidebar.tsx
Left-aligned navigation panel that:
- Shows main navigation menu with icons
- Implements role-based menu item visibility
- Supports mobile overlay and collapsible behavior
- Displays user information in the footer
- Provides smooth transitions and animations

### Header.tsx
Top header bar component that:
- Contains global search functionality
- Shows API mode indicator (demo/production)
- Provides notification center
- Displays user profile dropdown with logout option
- Includes mobile menu trigger button

## Layout Structure

```
┌─────────────────────────────────────────────┐
│              Header (16px)                   │
├──────────┬──────────────────────────────────┤
│          │                                   │
│ Sidebar  │      Main Content Area           │
│ (256px)  │      (p-6, animated)             │
│          │                                   │
│ - Logo   │      - Dashboard                 │
│ - Nav    │      - Posts                     │
│ - User   │      - Analytics                 │
│          │      - etc.                      │
│          │                                   │
└──────────┴──────────────────────────────────┘
```

## Responsive Behavior

- **Desktop (≥1024px)**: Full sidebar always visible (w-64)
- **Tablet/Mobile (<1024px)**: Sidebar hidden by default, opens as overlay
- **Mobile Navigation**: Hamburger menu button in header triggers sidebar

## Role-Based Access Control

Navigation items are filtered based on user roles:
- **Admin**: All items visible
- **User**: All except "Users" page
- **Viewer**: Dashboard, Posts, Analytics, Settings only

## Usage

```tsx
import { AppLayout } from '@/layouts/AppLayout';

function MyPage() {
  return (
    <AppLayout>
      <div>Your page content here</div>
    </AppLayout>
  );
}
```

The AppLayout component automatically handles:
- Authentication checks
- Loading states
- Redirects to login page
- Sidebar state management
- Responsive layout
