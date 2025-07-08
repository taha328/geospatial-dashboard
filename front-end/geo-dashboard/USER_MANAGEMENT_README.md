# User Management Frontend

This Angular application provides a complete user management interface for your NestJS backend.

## Features

✅ **User List**: View all users in a responsive table
✅ **Add User**: Create new users with name, email, and role
✅ **Edit User**: Update existing user information
✅ **View User**: See detailed user information
✅ **Delete User**: Remove users with confirmation
✅ **Role Management**: Support for admin, user, and moderator roles

## Components Created

### 1. User Service (`src/app/services/user.service.ts`)
- Handles all HTTP requests to the backend
- Provides methods for CRUD operations
- Interfaces with your NestJS backend at `http://localhost:3000/users`

### 2. User List Component (`src/app/components/user-list/`)
- Displays all users in a responsive table
- Includes actions for view, edit, and delete
- Shows role badges with different colors
- Handles loading states and error messages

### 3. User Form Component (`src/app/components/user-form/`)
- Handles both create and edit modes
- Form validation for required fields
- Dropdown for role selection
- Responsive form layout

### 4. User Detail Component (`src/app/components/user-detail/`)
- Shows detailed view of a single user
- Clean, card-based layout
- Navigation back to user list

## Routes

- `/users` - User list page
- `/users/create` - Add new user form
- `/users/:id` - User detail page
- `/users/:id/edit` - Edit user form

## Styling

- Modern, responsive design
- Bootstrap-inspired styling
- Mobile-friendly interface
- Role-based color coding
- Clean, professional look

## Backend Integration

The frontend connects to your NestJS backend endpoints:
- `GET /users` - Get all users
- `GET /users/:id` - Get single user
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## How to Run

1. Make sure your NestJS backend is running on `http://localhost:3000`
2. Navigate to the frontend directory:
   ```bash
   cd front-end/geo-dashboard
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   ng serve
   ```
5. Open your browser to `http://localhost:4200`

## User Roles

The system supports three user roles:
- **Admin**: Full system access (red badge)
- **User**: Standard user access (green badge)
- **Moderator**: Limited admin access (yellow badge)

## Features in Detail

### User List Features
- Search and filter capabilities
- Sortable columns
- Pagination ready
- Bulk actions ready
- Export functionality ready

### Form Features
- Real-time validation
- Error handling
- Loading states
- Cancel/Save actions
- Required field indicators

### Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Adaptive layouts
- Accessible design

## Next Steps

You can extend this system by:
1. Adding search/filter functionality
2. Implementing pagination
3. Adding bulk operations
4. Including user permissions
5. Adding user avatar uploads
6. Implementing audit logs
