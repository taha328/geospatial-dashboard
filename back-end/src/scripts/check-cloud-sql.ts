import { DataSource } from 'typeorm';

// This script helps you check your Cloud SQL database and decide what to do
async function checkCloudSQLDatabase() {
  // You'll need to update this with your actual Cloud SQL connection details
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'your-cloud-sql-instance-ip',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'your-password',
    database: process.env.DB_NAME || 'your-database',
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    synchronize: false,
    logging: true,
  });

  try {
    console.log('🔗 Connecting to Cloud SQL database...');
    await dataSource.initialize();
    console.log('✅ Connected successfully!');

    // Check current portefeuilles
    console.log('\n📊 Current Portefeuilles in Cloud SQL:');
    const portefeuilles = await dataSource.query('SELECT id, code, nom, description FROM portefeuilles ORDER BY id');
    console.table(portefeuilles);

    // Check current familles
    console.log('\n📊 Current Familles Actifs in Cloud SQL:');
    const familles = await dataSource.query('SELECT id, code, nom, type FROM familles_actifs ORDER BY id');
    console.table(familles);

    // Check current groupes
    console.log('\n📊 Current Groupes Actifs in Cloud SQL:');
    const groupes = await dataSource.query('SELECT id, code, nom, type FROM groupes_actifs ORDER BY id');
    console.table(groupes);

    // Check if types_inspection tables exist
    console.log('\n🔍 Checking for Inspection Types tables:');
    try {
      const inspectionTypes = await dataSource.query('SELECT COUNT(*) as count FROM types_inspection');
      console.log(`✅ types_inspection table exists with ${inspectionTypes[0].count} records`);
      
      const inspectionGroups = await dataSource.query('SELECT COUNT(*) as count FROM types_inspection_groupe');
      console.log(`✅ types_inspection_groupe table exists with ${inspectionGroups[0].count} records`);
    } catch (error) {
      console.log('❌ Inspection types tables do not exist - need to run migrations first');
    }

    console.log('\n📋 Summary:');
    console.log(`- Found ${portefeuilles.length} portefeuilles`);
    console.log(`- Found ${familles.length} familles actifs`);
    console.log(`- Found ${groupes.length} groupes actifs`);

    console.log('\n🚨 What you need to do:');
    console.log('1. If you want to keep existing data: Update it manually to match data.json');
    console.log('2. If you want to replace with data.json: Use migrate-cloud-sql.ts script');
    console.log('3. If inspection types are missing: Run migrations first');

  } catch (error) {
    console.error('❌ Error connecting to Cloud SQL:', error);
    console.log('\n💡 Tips:');
    console.log('- Check your database connection settings');
    console.log('- Make sure your Cloud SQL instance is running');
    console.log('- Verify your IP is whitelisted in Cloud SQL');
  } finally {
    try {
      await dataSource.destroy();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

checkCloudSQLDatabase();
