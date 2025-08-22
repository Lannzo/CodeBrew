# CodeBrew - Coffee & Bread Shop Management API

This is the backend server for the CodeBrew application, a centralized web platform for managing sales, inventory, and assets across multiple coffee and bread store branches.

This API is built with Node.js and Express, and it provides a secure, role-based RESTful interface for the frontend application.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Setup & Installation](#project-setup--installation)
- [Database Setup](#database-setup)
- [Database Schema](#database-schema)
- [Database Schema Summary](#database-schema-summary)
- [API Endpoint Summary](#api-endpoint-summary)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)

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
    ```bash
    npm install
    ```

## Database Setup

This project uses PostgreSQL as its database.

1.  **Install PostgreSQL:**
    Download from the [official website](https://www.postgresql.org/download/).

2.  **Create the Database:**
    ```sql
    CREATE DATABASE coffee_shop_db;
    ```

3.  **Enable UUID Extension:**
    ```sql
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    ```

4.  **Run Database Migrations:**  
    Execute the SQL files manually (later will use migration tool).

5.  **Seed the Database:**
    ```bash
    node seed.js
    ```

## Database Schema

The database consists of 16 tables designed to be normalized and scalable. Primary keys for all tables are UUIDs. Foreign keys are used to enforce relational integrity.

(detailed breakdown of tables already included above...)

---

## Database Schema Summary

The database consists of **18 tables**. The primary key for every table is a **UUID**.

### Core Management
- **roles**: `role_id (PK), role_name, description`
- **branches**: `branch_id (PK), branch_name, location_address, is_active`
- **users**: `user_id (PK), username, password_hash, role_id (FK), branch_id (FK), is_active`

### Catalogs
- **products**: `product_id (PK), product_name, price, sku, is_active`
- **assets**: `asset_id (PK), asset_name, branch_id (FK), purchase_cost, current_value`

### Operational & POS
- **inventory**: `inventory_id (PK), product_id (FK), branch_id (FK), quantity, low_stock_threshold`
- **orders**: `order_id (PK), branch_id (FK), user_id (FK), total_amount, status (completed or voided)`
- **order_items**: `order_item_id (PK), order_id (FK), product_id (FK), quantity, unit_price`
- **payment_methods**: `payment_method_id (PK), method_name, is_active`
- **branch_payment_methods**: `branch_id (FK), payment_method_id (FK)`
- **payments**: `payment_id (PK), order_id (FK), payment_method_id (FK), amount_paid`
- **discounts**: `discount_id (PK), discount_name, discount_type, discount_value, is_active`
- **order_discounts**: `order_id (FK), discount_id (FK)`
- **branch_discounts**: `branch_id (FK), discount_id (FK)`

### Auditing & History
- **maintenance_logs**: `maintenance_id (PK), asset_id (FK), service_date, service_details`
- **inventory_logs**: `log_id (PK), product_id (FK), branch_id (FK), change_quantity, reason`
- **stock_transfers**: `transfer_id (PK), from_branch_id (FK), to_branch_id (FK), status`

### Configuration
- **settings**: `setting_id (PK), setting_key, setting_value (JSONB)`

---

## API Endpoint Summary

All endpoints are prefixed with `/api/v1`.

### Authentication (`/auth`)
- `POST /login` – Authenticate a user.
- `POST /logout` – Clears the session.
- `POST /refresh-token` – Issues a new access token.

### User Management (`/users`) – Admin Only
- `GET /` – List all users.
- `POST /` – Create a new user.
- `GET /:userId` – Get user details.
- `PUT /:userId` – Update a user.
- `DELETE /:userId` – Deactivate a user.

### Branch Management (`/branches`)
- `GET /` – Get all branches.
- `POST /` – Create branch (Admin only).
- `GET /:branchId` – Get branch details.
- `PUT /:branchId` – Update branch.
- `DELETE /:branchId` – Deactivate branch.

### Product Management (`/products`)
- `GET /` – Get active products (`?includeInactive=true` for Admin).
- `POST /` – Create product (Admin only).
- `GET /:productId` – Get product details.
- `PUT /:productId` – Update product (Admin only).
- `DELETE /:productId` – Deactivate product (Admin only).

### Point of Sale (`/orders`)
- `POST /` – Create order (Cashier, Branch Officer).
- `GET /:orderId` – Get order details.
- `POST /:orderId/void` – Void order.

### Inventory Management (`/inventory`)
- `GET /:branchId` – Get inventory for a branch.
- `GET /alerts/:branchId` – Low stock alerts.
- `POST /adjust` – Adjust stock.
- `POST /transfer` – Transfer stock between branches.

### Asset Management (`/assets`)
- `GET /` – Get all assets.
- `POST /` – Create asset (Admin only).
- `GET /:assetId` – Get asset details.
- `PUT /:assetId` – Update asset (Admin only).
- `DELETE /:assetId` – Delete asset (Admin only).
- `POST /:assetId/maintenance` – Add maintenance log.

### Reports (`/reports`)
- `GET /sales` – Sales report.
- `GET /top-selling` – Top-selling products.
- `GET /inventory` – Inventory snapshot.
- `GET /assets` – Asset summary.

### Configuration (`/config`)
- `GET /settings` – Get settings (Admin only).
- `PUT /settings` – Update settings (Admin only).
- `GET /payment-methods` – Get available payment methods.
- `POST /payment-methods` – Create payment method (Admin only).
- `PUT /payment-methods/:id` – Update payment method (Admin only).
- `GET /discounts` – Get discounts.
- `POST /discounts` – Create discount (Admin only).
- `PUT /discounts/:id` – Update discount (Admin only).
- `GET /roles` – Get all user roles (Admin only).

---

