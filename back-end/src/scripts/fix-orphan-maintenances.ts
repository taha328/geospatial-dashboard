import { DataSource } from 'typeorm';

async function fixOrphanMaintenances() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'qawsed?',
    database: 'db',
    entities: [__dirname + '/../gestion_des_actifs/entities/*.entity.{js,ts}'],
    synchronize: false, // Disable synchronization initially
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to the database');

    const queryRunner = dataSource.createQueryRunner();

    console.log('🔎 Finding orphan maintenance records...');
    
    const orphanMaintenances = await queryRunner.query(`
      SELECT m.id, m."actifId"
      FROM maintenances m
      LEFT JOIN actifs a ON m."actifId" = a.id
      WHERE a.id IS NULL AND m."actifId" IS NOT NULL
    `);

    if (orphanMaintenances.length > 0) {
      console.log(`Found ${orphanMaintenances.length} orphan maintenance records to delete.`);
      console.log(orphanMaintenances.map(m => `ID: ${m.id}, ActifID: ${m.actifId}`).join('\n'));

      const orphanIds = orphanMaintenances.map(m => m.id);
      
      console.log('🗑️ Deleting orphan records...');
      
      const deleteResult = await queryRunner.query(
        `DELETE FROM maintenances WHERE id IN (${orphanIds.join(',')})`
      );

      console.log(`✅ Successfully deleted ${orphanMaintenances.length} orphan records.`);
    } else {
      console.log('👍 No orphan maintenance records found.');
    }

    await queryRunner.release();

    // Now, synchronize the database
    console.log('🔄 Synchronizing database schema...');
    await dataSource.synchronize();
    console.log('✅ Database schema synchronized successfully.');
    
  } catch (error) {
    console.error('❌ Error fixing orphan maintenances:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🚪 Database connection closed.');
    }
  }
}

fixOrphanMaintenances();
