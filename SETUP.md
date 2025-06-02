# Project Setup Guide

This guide will help you set up the project on your local machine. The project consists of a NestJS backend and a React frontend.

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher)
- Git

## Initial Setup

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd [project-name]
   ```

## Redis Setup

1. Download Redis for Windows:
   - Go to https://github.com/microsoftarchive/redis/releases
   - Download the latest MSI installer (e.g., Redis-x64-3.0.504.msi)
   - Run the installer and follow the installation wizard

2. After installation, Redis will be installed in one of these locations:
   - `C:\Program Files\Redis`
   - `C:\Program Files (x86)\Redis`

3. Open PowerShell or Command Prompt as Administrator

4. Navigate to the Redis installation directory:
   ```bash
   cd "C:\Program Files\Redis"
   ```

5. Start the Redis server:
   ```bash
   .\redis-server.exe redis.windows.conf
   ```

6. To verify Redis is running, open a new terminal and run:
   ```bash
   .\redis-cli.exe ping
   ```
   You should receive "PONG" as a response

7. Redis will be running on the default port 6379

Note: If you get any permission errors, make sure you're running the terminal as Administrator.

## PostgreSQL Setup

1. Install PostgreSQL if you haven't already
2. Create a new database for the project
3. Note down your database credentials (username, password, database name)

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your-db-username
   DB_PASSWORD=your-password
   DB_DATABASE=traingo

   VITE_AUTH0_DOMAIN=dev-0r6x3xu4gxp3dkfr.us.auth0.com
   VITE_AUTH0_CLIENT_ID=gmisy63ZlL2c7eW5xwQFrO1UBNpxOJzw
   VITE_AUTH0_CALLBACK_URI=http://localhost:5173/
   AUTH0_DOMAIN=dev-0r6x3xu4gxp3dkfr.us.auth0.com
   AUTH0_AUDIENCE=http://traingo.ks/
   ```

4. Run database migrations:
   ```bash
   npm run migration:run
   ```

5. Start the development server:
   ```bash
   npm run start:dev
   ```

The backend server will run on `http://localhost:3000` by default.

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory with the following variables:
   ```
   VITE_API_URL=http://localhost:3000
   VITE_AUTH0_DOMAIN=dev-0r6x3xu4gxp3dkfr.us.auth0.com
   VITE_AUTH0_CLIENT_ID=gmisy63ZlL2c7eW5xwQFrO1UBNpxOJzw
   VITE_AUTH0_CALLBACK_URI=http://localhost:5173/
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend development server will run on `http://localhost:5173` by default.

## Available Scripts

### Backend Scripts
- `npm run start:dev` - Start the backend in development mode
- `npm run build` - Build the backend
- `npm run start:prod` - Start the backend in production mode
- `npm run test` - Run backend tests
- `npm run lint` - Run linting
- `npm run migration:generate` - Generate new migrations
- `npm run migration:run` - Run pending migrations
- `npm run migration:revert` - Revert the last migration

### Frontend Scripts
- `npm run dev` - Start the frontend development server
- `npm run build` - Build the frontend for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run linting

## Project Structure

```
├── backend/               # NestJS backend
│   ├── src/              # Source code
│   ├── test/             # Test files
│   └── package.json      # Backend dependencies
│
├── frontend/             # React frontend
│   ├── src/             # Source code
│   ├── public/          # Static files
│   └── package.json     # Frontend dependencies
│
└── package.json         # Root package.json
```

## Development Workflow


## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies are installed correctly
2. Check if the database is running and accessible
3. Verify environment variables are set correctly
4. Check the console for error messages
5. Ensure ports 3000 (backend) and 5173 (frontend) are available
6. Verify Redis is running and accessible
7. Check if all required services are running:
   - PostgreSQL
   - Redis
   - Backend server
   - Frontend server

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [TypeORM Documentation](https://typeorm.io/)
- [Vite Documentation](https://vitejs.dev/)
- [Redis Documentation](https://redis.io/documentation)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) 