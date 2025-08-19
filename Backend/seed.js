
const {Pool} = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "admin@codebrew.com";
const ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// The main function that will run our seeding logic
async function seedDatabase() {
  // Get a client from the pool to run all our queries on the same connection
  const client = await pool.connect();
  console.log('Database client connected for seeding.');

  try {

    await client.query('BEGIN');

    // Seed the Roles Table 
    console.log('Seeding roles...');
    // We use ON CONFLICT DO NOTHING to prevent errors if the script is run more than once.
    await client.query(`
      INSERT INTO roles (role_name, description) VALUES
      ('Admin', 'Has full system access.')
      ON CONFLICT (role_name) DO NOTHING;
    `);
    await client.query(`
      INSERT INTO roles (role_name, description) VALUES
      ('Branch Officer', 'Manages one or more assigned branches.')
      ON CONFLICT (role_name) DO NOTHING;
    `);
    await client.query(`
      INSERT INTO roles (role_name, description) VALUES
      ('Cashier', 'Operates the POS at their assigned branch.')
      ON CONFLICT (role_name) DO NOTHING;
    `);
    console.log('Roles seeded successfully.');

    // Seed the first Admin User 
    console.log('Seeding admin user...');
    const adminResult = await client.query('SELECT user_id FROM users WHERE username = $1', [ADMIN_USERNAME]);

    if (adminResult.rows.length === 0) {
      // If the admin user doesn't exist, create.
      console.log('Admin user not found, creating...');
      
      // Hash the password securely
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);
      
      // Get the UUID of the 'Admin' role we just created
      const adminRoleResult = await client.query("SELECT role_id FROM roles WHERE role_name = 'Admin'");
      if (adminRoleResult.rows.length === 0) {
        throw new Error('Admin role not found after seeding. Something went wrong.');
      }
      const adminRoleId = adminRoleResult.rows[0].role_id;

      // Insert the new admin user into the users table
      await client.query(
        'INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4)',
        [ADMIN_USERNAME, ADMIN_EMAIL, passwordHash, adminRoleId]
      );
      console.log(`Admin user '${ADMIN_USERNAME}' created successfully.`);
    } else {
      console.log('Admin user already exists. Skipping creation.');
    }

    // If all steps were successful, commit the transaction to save the changes.
    await client.query('COMMIT');
    console.log('Database seeding completed successfully!');

  } catch (error) {
    // If any error occurred, roll back the transaction to undo all changes.
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error.message);
  } finally {
    // release the client back to the pool and end the pool connection.
    client.release();
    console.log('Database client released.');
    await pool.end();
    console.log('Connection pool closed.');
  }
}

// Run the main function
seedDatabase();