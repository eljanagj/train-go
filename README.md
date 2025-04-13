# Backend Application

This is a NestJS backend application with TypeScript.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm (v9 or higher)

## Project Structure

```
.
└── backend/         # NestJS backend application
```

## Getting Started

## PostgreSQL Setup

1. Install PostgreSQL:
   - Windows: Download and install from [PostgreSQL website](https://www.postgresql.org/download/windows/)
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. Start PostgreSQL service:
   - Windows: It starts automatically after installation
   - macOS: `brew services start postgresql`
   - Linux: `sudo service postgresql start`

3. Create a database:
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create database (in psql console)
   CREATE DATABASE traingo;

   # Exit psql
   \q
   ```

## Environment Setup

1. Create a `.env` file in the root directory with the following content:
   ```
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=traingo
   ```

   Note: Replace `your_password` with the password you set during PostgreSQL installation.

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run start:dev
```

The backend will be running at `http://localhost:3000`

## Available Scripts

### Backend

- `npm run start:dev` - Start the backend in development mode with hot-reload
- `npm run build` - Build the backend application
- `npm run start:prod` - Start the backend in production mode
- `npm run test` - Run backend tests
- `npm run lint` - Run linting
- `npm run format` - Format code using Prettier


## Database Connection Test

To test the database connection, start the server and visit:
```
http://localhost:3000/test-db
```

If successful, you should see:
```json
{
  "status": "success",
  "message": "Database connection successful!"
}
```