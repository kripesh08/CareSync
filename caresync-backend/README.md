# CareSync Backend - Healthcare Management System

A comprehensive Spring Boot 3 application for healthcare resource and queue management.

## Features

- **User Management**: Registration and authentication for different user roles (ADMIN, PATIENT, PHARMACY, HOSPITAL)
- **JWT Authentication**: Secure token-based authentication
- **Pharmacy Management**: Registration, approval, and management of pharmacies
- **Medicine Management**: Medicine catalog and booking system
- **Role-based Access Control**: Different permissions for different user types
- **Clean Architecture**: Layered architecture with proper separation of concerns

## Technology Stack

- **Java 17**
- **Spring Boot 3.2.1**
- **Spring Security 6**
- **Spring Data JPA**
- **PostgreSQL**
- **JWT (JSON Web Tokens)**
- **Maven**
- **H2 Database** (for testing)

## Project Structure

```
src/main/java/com/caresync/
├── CareSyncApplication.java          # Main application class
├── controller/                       # REST controllers
│   ├── AuthController.java
│   ├── PharmacyController.java
│   └── UserController.java
├── dto/                             # Data Transfer Objects
│   ├── AuthRequest.java
│   ├── AuthResponse.java
│   └── RegisterRequest.java
├── entity/                          # JPA entities
│   ├── User.java
│   ├── Pharmacy.java
│   ├── Medicine.java
│   └── MedicineBooking.java
├── repository/                      # Data access layer
│   ├── UserRepository.java
│   ├── PharmacyRepository.java
│   └── MedicineRepository.java
├── service/                         # Business logic layer
│   ├── AuthService.java
│   └── PharmacyService.java
├── security/                        # Security configuration
│   ├── JwtUtil.java
│   ├── JwtAuthenticationFilter.java
│   └── SecurityConfig.java
└── exception/                       # Exception handling
    └── GlobalExceptionHandler.java
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Maven 3.6+
- PostgreSQL 12+

### Database Setup

1. Create a PostgreSQL database named `caresync`
2. Update the database configuration in the `.env` file (see below)

## 📁 Environment Configuration

**Important**: You need to edit the `.env` file with your database credentials before running the application.

The `.env` file is located in the project root (`caresync-backend/.env`). Open it and update the following values:

```bash
# Database Configuration - UPDATE THESE VALUES
DB_NAME=caresync
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432

# JWT Configuration - CHANGE THIS SECRET
JWT_SECRET=your_secure_jwt_secret_key_here

# Server Configuration
PORT=8080
```

**Example**:
```bash
# Database Configuration
DB_NAME=caresync
DB_USER=postgres
DB_PASSWORD=mypassword123
DB_HOST=localhost
DB_PORT=5432

# JWT Configuration
JWT_SECRET=CareSync2024SecretKey!@#
```

### Running the Application

1. **Clone the repository**
2. **Navigate to the project directory**: `cd caresync-backend`
3. **Edit the `.env` file** with your PostgreSQL database credentials (see above)
4. **Run the application**:

```bash
# Windows
run.bat

# Linux/Mac
chmod +x run.sh
./run.sh

# Or directly with Maven (you'll need to set environment variables manually)
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

**Note**: The startup scripts automatically load the environment variables from the `.env` file.

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/test` - Test endpoint

#### User Management
- `GET /api/user/profile` - Get current user profile (requires authentication)

#### Pharmacy Management
- `POST /api/pharmacy/create` - Create pharmacy (PHARMACY role required)
- `GET /api/pharmacy/my-pharmacy` - Get current user's pharmacy
- `GET /api/pharmacy/approved` - Get all approved pharmacies
- `GET /api/pharmacy/by-city/{city}` - Get pharmacies by city
- `GET /api/pharmacy/pending` - Get pending pharmacies (ADMIN only)
- `PUT /api/pharmacy/approve/{id}` - Approve pharmacy (ADMIN only)
- `PUT /api/pharmacy/reject/{id}` - Reject pharmacy (ADMIN only)

### Sample API Usage

#### Register a new user:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "password": "password123",
    "role": "PATIENT"
  }'
```

#### Login:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Testing

Run tests with:
```bash
mvn test
```

## Security

- JWT tokens expire after 24 hours
- Passwords are encrypted using BCrypt
- Role-based access control is implemented
- CORS is configured for cross-origin requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.