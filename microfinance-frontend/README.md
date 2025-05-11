# Microfinance Solution Frontend

A modern React.js application built with Vite and Tailwind CSS for a microfinance platform. This application provides interfaces for both administrators and users to manage loans, applications, and financial services.

## Features

- **User Authentication**: Secure login and registration system
- **Role-Based Access Control**: Separate dashboards for admin and user roles
- **Admin Dashboard**: Manage users, loans, applications, and system settings
- **User Dashboard**: Apply for loans, track applications, and manage personal profile
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **React.js**: Frontend library for building user interfaces
- **Vite**: Next-generation frontend tooling for faster development
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **React Context API**: State management for authentication and user data
- **React Router**: Navigation and routing for single-page applications
- **Axios**: Promise-based HTTP client for API requests with cookie support

## Project Structure

```
src/
├── assets/         # Static assets like images
├── components/     # Reusable UI components
│   ├── admin/      # Admin-specific components
│   ├── auth/       # Authentication components
│   ├── common/     # Shared components
│   └── user/       # User-specific components
├── layouts/        # Layout components with navigation
├── pages/          # Page components for different routes
│   ├── admin/      # Admin pages
│   └── user/       # User pages
├── services/       # API services and utilities
├── store/          # Redux store configuration
│   └── slices/     # Redux slices for state management
├── App.jsx         # Main application component
└── main.jsx        # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Backend API Integration

The frontend is integrated with the backend API using session-based authentication. The API configuration is stored in the `.env` file.

### Authentication Endpoints

- **Register**: POST `/users/Register`
- **Login**: POST `/users/login`
- **Logout**: DELETE `/users/logout`
- **Current User**: GET `/users/me`
- **Verify Session**: GET `/users/verify-session`

### Authentication Flow

1. The backend uses session cookies (`session_id`) for authentication
2. The frontend stores user data in sessionStorage for better security
3. Session verification occurs on application startup and periodically
4. Role-based access control directs users to appropriate dashboards

### Environment Configuration

Copy the `.env.example` file to create a `.env` file with your backend API configuration:

```bash
cp .env.example .env
```

Update the `VITE_API_URL` variable to point to your backend server.

## Deployment

To build the application for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## License

This project is licensed under the MIT License.
