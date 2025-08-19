# CodeBrew - Coffee & Bread Shop Management API

This is the backend server for the CodeBrew application, a centralized web platform for managing sales, inventory, and assets across multiple coffee and bread store branches.

This API is built with Node.js and Express, and it provides a secure, role-based RESTful interface for the frontend application.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Setup & Installation](#project-setup--installation)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)

## Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/) (v22.x or later recommended)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Authentication:** JSON Web Tokens (JWT) with Access/Refresh Token pattern
- **Password Hashing:** [bcrypt.js](https://www.npmjs.com/package/bcryptjs)
- **Database Client:** [node-postgres (pg)](https://node-postgres.com/)
- **Input Validation:** [express-validator](https://express-validator.github.io/docs/)
- **Development Tool:** [nodemon](https://nodemon.io/) for auto-reloading

## Project Setup & Installation

Follow these steps to get the backend server running on your local machine.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Lannzo/CodeBrew.git
    cd <your-repository-url>/backend
    ```

2.  **Install dependencies:**
    This command will install all the necessary packages listed in `package.json`.
    ```bash
    npm install
    ```

## Database Setup

This project uses PostgreSQL as its database.

1.  **Install PostgreSQL:**
    Ensure you have PostgreSQL installed and running on your system. You can download it from the [official website](https://www.postgresql.org/download/).

2.  **Create the Database:**
    Using a tool like `psql` or a GUI like pgAdmin/DBeaver, create the database.
    ```sql
    CREATE DATABASE coffee_shop_db;
    ```

3.  **Enable UUID Extension:**
    Connect to your new database and run the following command to enable the UUID generation function. This only needs to be done once.
    ```sql
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    ```

4.  **Run Database Migrations:**
    *This step is currently handled by manually running the SQL scripts. In the future, this will be managed by a migration tool like `node-pg-migrate`.*
    Execute the SQL files in the correct order to create all the necessary tables.

5.  **Seed the Database:**
    After the tables are created, run the seed script to populate the database with essential initial data (roles and the first admin user).
    ```bash
    node seed.js
    ```

## Environment Variables

This project uses a `.env` file to manage environment variables.

1.  Create a file named `.env` in the root of the `/backend` directory.
2.  Copy the contents of `.env.example` (if available) or add the following required variables:

    ```env
    # Application Port
    PORT=5000

    # Database Configuration
    DB_USER=postgres
    DB_PASSWORD=your_postgres_password
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=coffee_shop_db

    # Default password for the first admin user created by the seed script
    ADMIN_DEFAULT_PASSWORD=your_secure_password

    # JWT Secrets (use long, random strings)
    ACCESS_TOKEN_SECRET=your_super_strong_access_token_secret
    REFRESH_TOKEN_SECRET=your_super_strong_refresh_token_secret
    ```

## Running the Application

-   **Development Mode:**
    This command starts the server with `nodemon`, which will automatically restart the server on file changes.
    ```bash
    npm run dev
    ```
    The server will be available at `http://localhost:5000`.

-   **Production Mode:**
    This command starts the server using `node`.
    ```bash
    npm start
    ```