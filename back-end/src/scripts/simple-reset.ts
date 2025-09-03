import { DataSource } from 'typeorm';

async function resetDatabase() {
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

    console.log('🗑️ Dropping all tables...');
    
    // Drop all tables in the correct order (reverse dependency order)
    const tablesToDrop = [
      'type_inspection_groupe',
      'type_inspection',
      'actifs',
      'groupe_actifs',
      'famille_actifs', 
      'portefeuilles',
      'user_role',
      'users',
      'migrations'
    ];

    for (const table of tablesToDrop) {
      try {
        await dataSource.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️ Could not drop table ${table}: ${error.message}`);
      }
    }

    // Drop enum types
    const enumsToDrop = [
      'type_inspection_status_enum',
      'groupes_actifs_type_enum',
      'familles_actifs_type_enum',
      'user_role_enum'
    ];

    for (const enumType of enumsToDrop) {
      try {
        await dataSource.query(`DROP TYPE IF EXISTS ${enumType} CASCADE;`);
        console.log(`✅ Dropped enum: ${enumType}`);
      } catch (error) {
        console.log(`⚠️ Could not drop enum ${enumType}: ${error.message}`);
      }
    }

    console.log('✅ Database reset completed!');
    console.log('📝 Now run migrations to recreate the structure...');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await dataSource.destroy();
  }
}

resetDatabase();
