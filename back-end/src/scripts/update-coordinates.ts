import { DataSource } from 'typeorm';

async function updateAssetCoordinates() {
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

    console.log('📍 Updating asset coordinates to Tangier Med port location...');
    
    // Get all actifs
    const actifs = await dataSource.query(`SELECT id, code FROM actifs ORDER BY id`);
    
    console.log(`Found ${actifs.length} assets to update`);
    
    for (const actif of actifs) {
      // Generate random coordinates around Tangier Med port
      const latitude = 35.8880 + (Math.random() - 0.5) * 0.01; // Around Tangier Med port
      const longitude = -5.4992 + (Math.random() - 0.5) * 0.01;
      
      await dataSource.query(`
        UPDATE actifs 
        SET latitude = $1, longitude = $2, "dateMiseAJour" = NOW()
        WHERE id = $3
      `, [latitude, longitude, actif.id]);
      
      console.log(`✅ Updated ${actif.code}: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    }

    console.log('🎉 All asset coordinates updated to Tangier Med port area!');
    console.log(`📊 Updated ${actifs.length} assets with coordinates around 35.8880°N, -5.4992°E`);

  } catch (error) {
    console.error('❌ Error updating coordinates:', error);
  } finally {
    await dataSource.destroy();
  }
}

updateAssetCoordinates();
