import { DataSource } from 'typeorm';

async function completeReset() {
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

    console.log('🗑️ Dropping ALL user tables...');
    
    // Get all user tables
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns')
      ORDER BY table_name;
    `);

    // Drop all user tables
    for (const table of tables) {
      const tableName = table.table_name;
      try {
        await dataSource.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
        console.log(`✅ Dropped table: ${tableName}`);
      } catch (error) {
        console.log(`⚠️ Could not drop table ${tableName}: ${error.message}`);
      }
    }

    console.log('🗑️ Dropping ALL user enum types...');
    
    // Get all user enum types
    const enums = await dataSource.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      ORDER BY typname;
    `);

    // Drop all user enum types
    for (const enumType of enums) {
      const enumName = enumType.typname;
      try {
        await dataSource.query(`DROP TYPE IF EXISTS ${enumName} CASCADE;`);
        console.log(`✅ Dropped enum: ${enumName}`);
      } catch (error) {
        console.log(`⚠️ Could not drop enum ${enumName}: ${error.message}`);
      }
    }

    console.log('✅ Complete database reset completed!');
    console.log('📝 Now run migrations to recreate the structure...');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await dataSource.destroy();
  }
}

completeReset();
