import { DataSource } from 'typeorm';

async function fixAnomalieEnum() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'qawsed?',
    database: 'db',
    entities: [],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Check for invalid typeAnomalie values
    const queryRunner = dataSource.createQueryRunner();
    
    console.log('Checking for invalid typeAnomalie values...');
    const invalidRecords = await queryRunner.query(`
      SELECT id, "typeAnomalie" FROM anomalies 
      WHERE "typeAnomalie" NOT IN ('structural', 'mecanique', 'electrique', 'securite', 'autre')
    `);
    
    console.log(`Found ${invalidRecords.length} records with invalid typeAnomalie values:`);
    invalidRecords.forEach(record => {
      console.log(`- ID: ${record.id}, typeAnomalie: "${record.typeAnomalie}"`);
    });

    if (invalidRecords.length > 0) {
      console.log('Fixing invalid values...');
      
      // Update invalid values to 'autre' (other)
      const updateResult = await queryRunner.query(`
        UPDATE anomalies 
        SET "typeAnomalie" = 'autre' 
        WHERE "typeAnomalie" NOT IN ('structural', 'mecanique', 'electrique', 'securite', 'autre')
      `);
      
      console.log(`Updated ${updateResult.length || invalidRecords.length} records to use 'autre' as typeAnomalie`);
    } else {
      console.log('No invalid records found');
    }

    await queryRunner.release();
    console.log('✅ Anomalie enum fix completed successfully');
    
  } catch (error) {
    console.error('❌ Error fixing anomalie enum:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  fixAnomalieEnum()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { fixAnomalieEnum };
