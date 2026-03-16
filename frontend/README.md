# CareSync Frontend

A React-based frontend application for the CareSync healthcare management system.

## Features

- **Authentication System**: Login and registration with JWT tokens
- **Role-based Access Control**: Different dashboards for Admin, Patient, Pharmacy, and Hospital users
- **Responsive Design**: Mobile-friendly interface with modern UI components
- **Real-time Notifications**: Toast notifications for user feedback
- **Protected Routes**: Secure routing based on user authentication and roles

## User Roles & Features

### Admin Dashboard
- User management (activate/deactivate users)
- Pharmacy approval system
- Hospital management
- Medicine catalog management
- System statistics and monitoring

### Patient Dashboard
- View prescriptions
- Find nearby pharmacies
- Medical history access
- Appointment booking

### Pharmacy Dashboard
- Inventory management
- Prescription processing
- Order management
- Stock alerts

### Hospital Dashboard
- Bed management
- Queue management
- Prescription management
- Appointment scheduling

## Tech Stack

- **React 18** - Frontend framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Toastify** - Toast notifications
- **Lucide React** - Modern icon library
- **Custom CSS** - Tailwind-inspired utility classes

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- CareSync Backend running on localhost:8081

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   ├── dashboards/
│   │   │   ├── AdminDashboard.js
│   │   │   ├── PatientDashboard.js
│   │   │   ├── PharmacyDashboard.js
│   │   │   └── HospitalDashboard.js
│   │   ├── admin/
│   │   │   ├── UserManagement.js
│   │   │   ├── PharmacyManagement.js
│   │   │   ├── HospitalManagement.js
│   │   │   └── MedicineManagement.js
│   │   ├── Layout.js
│   │   └── ProtectedRoute.js
│   ├── contexts/
│   │   └── AuthContext.js
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── App.css
│   └── index.js
├── package.json
└── README.md
```

## API Integration

The frontend communicates with the Spring Boot backend through RESTful APIs:

- **Base URL**: `http://localhost:8081/api`
- **Authentication**: JWT tokens stored in localStorage
- **Automatic token refresh**: Handled by Axios interceptors
- **Error handling**: Automatic logout on 401 responses

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (irreversible)

## Environment Configuration

The application is configured to work with the backend running on `localhost:8081`. To change this, update the `API_BASE_URL` in `src/services/api.js`.

## Authentication Flow

1. User enters credentials on login page
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates credentials and returns JWT token
4. Token is stored in localStorage
5. All subsequent API requests include the token in Authorization header
6. Protected routes check for valid token before rendering

## Role-based Navigation

The application dynamically generates navigation menus based on user roles:

- **Admin**: Full system access including user management
- **Patient**: Personal health records and pharmacy search
- **Pharmacy**: Inventory and prescription management
- **Hospital**: Bed and queue management

## Styling

The application uses a custom CSS framework with Tailwind-inspired utility classes for consistent styling across components. The design follows modern healthcare application patterns with:

- Clean, professional interface
- Accessible color schemes
- Responsive grid layouts
- Interactive hover states
- Loading animations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the CareSync healthcare management system.