const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const path = require('path');

// Database connection details
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'cei_espol_db_dev',
  user: 'admin_cei_db',
  password: 'rosso2711'
};

// Path to SQL files
const applicationsSchemaPath = path.join(__dirname, 'applications-schema.sql');
const seedDataPath = path.join(__dirname, 'seed-data.sql');

// Read SQL files
const applicationsSchema = readFileSync(applicationsSchemaPath, 'utf8');
const seedData = readFileSync(seedDataPath, 'utf8');

// Function to execute SQL
function executeSQL(sql) {
  const connectionString = `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
  
  try {
    // Create a temporary SQL file
    const tempFile = path.join(__dirname, 'temp.sql');
    require('fs').writeFileSync(tempFile, sql);
    
    // Execute the SQL
    const command = `psql "${connectionString}" -f "${tempFile}"`;
    const output = execSync(command, { encoding: 'utf8' });
    
    // Remove the temporary file
    require('fs').unlinkSync(tempFile);
    
    console.log(output);
    return output;
  } catch (error) {
    console.error('Error executing SQL:', error.message);
    if (error.stdout) console.error(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

// Main function to set up the database
async function setupDatabase() {
  console.log('Setting up CEI-ESPOL database...');
  
  // Apply schema
  console.log('\n== Applying applications schema ==');
  executeSQL(applicationsSchema);
  
  // Apply seed data
  console.log('\n== Applying seed data ==');
  executeSQL(seedData);
  
  console.log('\n== Database setup completed successfully ==');
}

// Run the setup
setupDatabase().catch(err => {
  console.error('Database setup failed:', err);
  process.exit(1);
});
