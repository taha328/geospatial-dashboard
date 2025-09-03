import { DataSource } from 'typeorm';

async function listAllTables() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'qawsed?',
    database: 'db',
    synchronize: false,
    logging: true,
  });

  try {
    console.log('🔗 Connecting to database...');
    await dataSource.initialize();

    console.log('📋 Listing all tables...');
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('Tables found:', tables);

    console.log('📋 Listing all enum types...');
    const enums = await dataSource.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      ORDER BY typname;
    `);

    console.log('Enums found:', enums);

  } catch (error) {
    console.error('❌ Error listing database objects:', error);
  } finally {
    await dataSource.destroy();
  }
}

listAllTables();
