import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';

async function fixDatabaseConsistency() {
  console.log('🔧 Starting database consistency fix...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get<DataSource>(getDataSourceToken());
  
  try {
    await dataSource.transaction(async (manager) => {
      console.log('🧹 Cleaning orphaned data in familles_actifs...');
      
      // Remove familles_actifs records that reference non-existent portefeuilles
      const orphanedFamilles = await manager.query(`
        DELETE FROM familles_actifs 
        WHERE portefeuille_id NOT IN (
          SELECT id FROM portefeuilles WHERE id IS NOT NULL
        )
      `);
      
      console.log(`✅ Removed ${orphanedFamilles.length || 0} orphaned famille records`);
      
      // Also clean up any other dependent tables
      await manager.query(`
        DELETE FROM groupes_actifs 
        WHERE famille_actif_id NOT IN (
          SELECT id FROM familles_actifs WHERE id IS NOT NULL
        )
      `);
      
      await manager.query(`
        DELETE FROM actifs 
        WHERE groupe_actif_id NOT IN (
          SELECT id FROM groupes_actifs WHERE id IS NOT NULL
        )
      `);
      
      console.log('🗑️ Cleaned up dependent tables');
    });
    
    console.log('✅ Database consistency fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing database consistency:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the fix if called directly
if (require.main === module) {
  fixDatabaseConsistency()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { fixDatabaseConsistency };