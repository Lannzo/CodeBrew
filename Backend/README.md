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

## Database Schema

The database consists of 16 tables designed to be normalized and scalable. Primary keys for all tables are UUIDs. Foreign keys are used to enforce relational integrity.

---

### Core Management

#### `roles`
Stores user roles (Admin, Branch Officer, Cashier).
| Column | Type | Description |
|---|---|---|
| `role_id` | UUID | Primary Key |
| `role_name` | VARCHAR | Unique name of the role (e.g., 'Admin') |

#### `branches`
Stores information for each physical store location.
| Column | Type | Description |
|---|---|---|
| `branch_id` | UUID | Primary Key |
| `branch_name`| VARCHAR | Name of the branch |
| `is_active` | BOOLEAN | Toggles if the branch is operational |

#### `users`
Manages all user accounts, credentials, and links.
| Column | Type | Description |
|---|---|---|
| `user_id` | UUID | Primary Key |
| `username` | VARCHAR | Unique username for login |
| `password_hash`| VARCHAR | Hashed password for security |
| `role_id` | UUID | Foreign Key to `roles.role_id` |
| `branch_id` | UUID | Foreign Key to `branches.branch_id` |
| `is_active` | BOOLEAN | Toggles if the user can log in |

---

### Catalogs

#### `products`
The master catalog of all items available for sale.
| Column | Type | Description |
|---|---|---|
| `product_id` | UUID | Primary Key |
| `product_name`| VARCHAR | Name of the product (e.g., 'Espresso') |
| `price` | DECIMAL | Current selling price |
| `sku` | VARCHAR | Unique Stock Keeping Unit |

#### `assets`
The master register of all physical company assets.
| Column | Type | Description |
|---|---|---|
| `asset_id` | UUID | Primary Key |
| `asset_name` | VARCHAR | Name of the asset (e.g., 'La Marzocco Espresso Machine') |
| `branch_id` | UUID | Foreign Key to `branches.branch_id` where the asset is located |
| `current_value`| DECIMAL | For depreciation tracking |

---

### Operational & POS

#### `inventory`
Tracks the current stock quantity of each product at each branch.
| Column | Type | Description |
|---|---|---|
| `inventory_id`| UUID | Primary Key |
| `product_id` | UUID | Foreign Key to `products.product_id` |
| `branch_id` | UUID | Foreign Key to `branches.branch_id` |
| `quantity` | INTEGER | Current stock on hand |
| `low_stock_threshold`| INTEGER | Threshold for low stock alerts |

#### `orders`
Stores the header information for each customer sales transaction.
| Column | Type | Description |
|---|---|---|
| `order_id` | UUID | Primary Key |
| `branch_id` | UUID | Foreign Key to `branches.branch_id` |
| `user_id` | UUID | Foreign Key to the `users` (cashier) who made the sale |
| `total_amount`| DECIMAL | Final amount of the transaction |
| `tax_amount` | DECIMAL | Tax amount applied to the order |
| `discount_amount`| DECIMAL | Discount amount applied to the order |

#### `order_items`
Stores the individual line items sold within each order.
| Column | Type | Description |
|---|---|---|
| `order_item_id` | UUID | Primary Key |
| `order_id` | UUID | Foreign Key to `orders.order_id` |
| `product_id` | UUID | Foreign Key to `products.product_id` |
| `quantity` | INTEGER | How many units of the product were sold |
| `unit_price`| DECIMAL | Price of the product at the time of sale |

#### `payment_methods`
The master list of accepted payment types.
| Column | Type | Description |
|---|---|---|
| `payment_method_id`| UUID | Primary Key |
| `method_name`| VARCHAR | Name of the method (e.g., 'Cash', 'Visa') |
| `is_active` | BOOLEAN | Toggles if this method can be used |

#### `payments`
Records every payment made against an order, supporting split payments.
| Column | Type | Description |
|---|---|---|
| `payment_id` | UUID | Primary Key |
| `order_id` | UUID | Foreign Key to `orders.order_id` |
| `payment_method_id`| UUID | Foreign Key to `payment_methods.payment_method_id` |
| `amount_paid`| DECIMAL | The amount paid with this specific method |

#### `discounts`
The master list of all available discount rules and promotions.
| Column | Type | Description |
|---|---|---|
| `discount_id`| UUID | Primary Key |
| `discount_name`| VARCHAR | Name of the promotion (e.g., 'Student Discount') |
| `discount_type`| VARCHAR | 'percentage' or 'fixed_amount' |
| `discount_value`| DECIMAL | The value of the discount |
| `is_active` | BOOLEAN | Toggles if the discount can be applied |

#### `order_discounts`
A pivot table linking which `discounts` were applied to which `orders`.
| Column | Type | Description |
|---|---|---|
| `order_id` | UUID | Foreign Key to `orders.order_id` |
| `discount_id`| UUID | Foreign Key to `discounts.discount_id` |

---

### Auditing & History

#### `maintenance_logs`
Records the full history of repairs and services for each `asset`.
| Column | Type | Description |
|---|---|---|
| `maintenance_id`| UUID | Primary Key |
| `asset_id` | UUID | Foreign Key to `assets.asset_id` |
| `service_date`| DATE | When the service was performed |
| `service_details`| TEXT | Description of the work done |

#### `inventory_logs`
A detailed audit trail of every change to inventory levels.
| Column | Type | Description |
|---|---|---|
| `log_id` | UUID | Primary Key |
| `product_id` | UUID | Foreign Key to `products.product_id` |
| `branch_id` | UUID | Foreign Key to `branches.branch_id` |
| `change_quantity`| INTEGER | The change in stock (+ve or -ve) |
| `reason` | VARCHAR | Reason for the change (e.g., 'sale', 'spoilage') |

#### `stock_transfers`
Records the details of stock being moved between branches.
| Column | Type | Description |
|---|---|---|
| `transfer_id`| UUID | Primary Key |
| `from_branch_id`| UUID | Source branch |
| `to_branch_id` | UUID | Destination branch |
| `status` | VARCHAR | Status of the transfer (e.g., 'completed') |

---

### Configuration

#### `settings`
A flexible key-value store for global application settings.
| Column | Type | Description |
|---|---|---|
| `setting_id` | UUID | Primary Key |
| `setting_key`| VARCHAR | Unique name for the setting (e.g., 'tax_rate') |
| `setting_value`| JSONB | The value of the setting, stored in flexible JSON format |

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