import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

// Cloud SQL connection configuration
// Update these with your actual Cloud SQL credentials
const CLOUD_SQL_CONFIG = {
  type: 'postgres' as const,
  host: 'your-cloud-sql-instance-ip', // Replace with your Cloud SQL instance IP
  port: 5432,
  username: 'postgres', // Replace with your Cloud SQL username
  password: 'your-cloud-sql-password', // Replace with your Cloud SQL password
  database: 'your-database-name', // Replace with your Cloud SQL database name
  ssl: {
    rejectUnauthorized: false, // For Cloud SQL connections
  },
  synchronize: false,
  logging: true,
};

async function migrateCloudSQLToDataJson() {
  const dataSource = new DataSource(CLOUD_SQL_CONFIG);

  try {
    console.log('🔗 Connecting to Cloud SQL database...');
    await dataSource.initialize();

    // Load data.json file
    const dataPath = path.join(__dirname, '../../data.json');
    if (!fs.existsSync(dataPath)) {
      console.error('❌ data.json file not found at:', dataPath);
      return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log('📄 Loaded data.json successfully');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await dataSource.query('DELETE FROM types_inspection_groupe');
    await dataSource.query('DELETE FROM types_inspection');
    await dataSource.query('DELETE FROM actifs');
    await dataSource.query('DELETE FROM groupes_actifs');
    await dataSource.query('DELETE FROM familles_actifs');
    await dataSource.query('DELETE FROM portefeuilles');
    console.log('✅ Existing data cleared');

    // Create Portefeuilles based on unique portfolios from data.json
    console.log('🏗️ Creating Portefeuilles from data.json...');
    const portfolios = [...new Set(data.familles.map((f: any) => f.portfolio))];
    const portefeuilleMap = new Map();
    
    for (const portfolio of portfolios) {
      const portfolioName = portfolio as string;
      const result = await dataSource.query(`
        INSERT INTO "portefeuilles" ("nom", "description", "code", "statut")
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [
        portfolioName,
        `Portefeuille ${portfolioName}`,
        portfolioName.toLowerCase().replace(/\s+/g, '_'),
        'actif'
      ]);
      portefeuilleMap.set(portfolioName, result[0].id);
      console.log(`✅ Created Portefeuille: ${portfolioName} (ID: ${result[0].id})`);
    }

    // Create Familles Actifs from data.json
    console.log('👨‍👩‍👧‍👦 Creating Familles Actifs from data.json...');
    const familleMap = new Map();
    
    for (const famille of data.familles) {
      const portefeuilleId = portefeuilleMap.get(famille.portfolio);
      
      // Map famille names to our enum types
      let familleType = 'ouvrages_amarrage'; // default
      if (famille.famille.toLowerCase().includes('amarrage') || famille.famille.toLowerCase().includes('accostage')) {
        familleType = 'ouvrages_amarrage';
      } else if (famille.famille.toLowerCase().includes('protection')) {
        familleType = 'ouvrages_accostage';
      } else if (famille.famille.toLowerCase().includes('equipement')) {
        familleType = 'equipements_manutention';
      } else if (famille.famille.toLowerCase().includes('art') || famille.famille.toLowerCase().includes('bassin')) {
        familleType = 'infrastructures_support';
      }

      const result = await dataSource.query(`
        INSERT INTO "familles_actifs" ("nom", "description", "code", "type", "statut", "portefeuilleId")
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        famille.famille,
        `Famille ${famille.famille}`,
        `fam_${famille.numero_famille}`,
        familleType,
        'actif',
        portefeuilleId
      ]);
      familleMap.set(famille.numero_famille, result[0].id);
      console.log(`✅ Created Famille: ${famille.famille} (ID: ${result[0].id})`);
    }

    // Create Groupes Actifs from data.json
    console.log('👥 Creating Groupes Actifs from data.json...');
    const groupeMap = new Map();
    
    for (const groupe of data.groupes) {
      const familleId = familleMap.get(groupe.numero_famille);
      if (!familleId) {
        console.warn(`⚠️ No famille found for numero_famille: ${groupe.numero_famille}`);
        continue;
      }

      // Map groupe names to our enum types
      let groupeType = 'bollards'; // default
      if (groupe.groupe_actif.toLowerCase().includes('bollard')) {
        groupeType = 'bollards';
      } else if (groupe.groupe_actif.toLowerCase().includes('defense') || groupe.groupe_actif.toLowerCase().includes('défense')) {
        groupeType = 'defenses';
      } else if (groupe.groupe_actif.toLowerCase().includes('grue')) {
        groupeType = 'grues';
      } else if (groupe.groupe_actif.toLowerCase().includes('eclairage') || groupe.groupe_actif.toLowerCase().includes('feu')) {
        groupeType = 'eclairage';
      } else if (groupe.groupe_actif.toLowerCase().includes('signal') || groupe.groupe_actif.toLowerCase().includes('panneau')) {
        groupeType = 'signalisation';
      }

      const result = await dataSource.query(`
        INSERT INTO "groupes_actifs" ("nom", "description", "code", "type", "statut", "familleActifId")
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        groupe.groupe_actif,
        `Groupe ${groupe.groupe_actif}`,
        `grp_${groupe.numero_groupe}`,
        groupeType,
        'actif',
        familleId
      ]);
      groupeMap.set(groupe.numero_groupe, result[0].id);
      console.log(`✅ Created Groupe: ${groupe.groupe_actif} (ID: ${result[0].id})`);
    }

    // Create sample Actifs around Tangier Med
    console.log('🏭 Creating sample Actifs around Tangier Med...');
    let actifCount = 0;
    
    for (const [groupeCode, groupeId] of groupeMap) {
      // Create 2-3 sample actifs per groupe
      const sampleCount = Math.floor(Math.random() * 2) + 2;
      
      for (let i = 1; i <= sampleCount; i++) {
        const actifCode = `${groupeCode}-${String(i).padStart(3, '0')}`;
        const latitude = 35.8880 + (Math.random() - 0.5) * 0.01; // Around Tangier Med port
        const longitude = -5.4992 + (Math.random() - 0.5) * 0.01;
        
        await dataSource.query(`
          INSERT INTO "actifs" (
            "nom", "description", "code", "statutOperationnel", "etatGeneral",
            "latitude", "longitude", "groupeActifId"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          `Actif ${actifCode}`,
          `Description de l'actif ${actifCode}`,
          actifCode,
          'operationnel',
          'bon',
          latitude,
          longitude,
          groupeId
        ]);
        actifCount++;
      }
    }
    console.log(`✅ Created ${actifCount} sample Actifs`);

    // Create Inspection Types from data.json
    console.log('🔍 Creating Inspection Types from data.json...');
    
    for (const inspection of data.type_inspection) {
      await dataSource.query(`
        INSERT INTO "types_inspection" ("numero_inspection", "type_inspection", "description", "statut")
        VALUES ($1, $2, $3, $4)
      `, [
        inspection.numero_inspection, 
        inspection.type_inspection, 
        `Type d'inspection: ${inspection.type_inspection}`, 
        'actif'
      ]);
      console.log(`✅ Created Inspection Type: ${inspection.type_inspection}`);
    }

    // Create Types Inspection Groupe relationships from data.json
    console.log('🔗 Creating Types Inspection Groupe relationships from data.json...');
    
    for (const relation of data.types_inspection_groupe) {
      await dataSource.query(`
        INSERT INTO "types_inspection_groupe" (
          "numero_groupe", "numero_inspection", "type_inspection", "description", "statut"
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [
        relation.numero_groupe,
        relation.numero_inspection,
        relation.type_inspection,
        `Relation inspection ${relation.type_inspection} pour groupe ${relation.numero_groupe}`,
        'actif'
      ]);
    }
    console.log(`✅ Created ${data.types_inspection_groupe.length} inspection-groupe relationships`);

    console.log('🎉 Cloud SQL database migration completed successfully!');
    console.log(`📊 Summary:
    - ${portfolios.length} Portefeuilles created from data.json
    - ${data.familles.length} Familles Actifs created from data.json
    - ${data.groupes.length} Groupes Actifs created from data.json
    - ${actifCount} Actifs created with Tangier Med coordinates
    - ${data.type_inspection.length} Inspection Types created from data.json
    - ${data.types_inspection_groupe.length} Inspection-Groupe relationships created`);

  } catch (error) {
    console.error('❌ Error migrating Cloud SQL database:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  console.log('🚨 IMPORTANT: Update CLOUD_SQL_CONFIG with your actual Cloud SQL credentials before running!');
  console.log('🚨 This script will DELETE all existing data and replace it with data.json structure!');
  console.log('🚨 Make sure you have a backup of your current data!');
  console.log('');
  console.log('To run this script:');
  console.log('1. Update CLOUD_SQL_CONFIG with your Cloud SQL credentials');
  console.log('2. Run: npx ts-node src/scripts/migrate-cloud-sql.ts');
}

export { migrateCloudSQLToDataJson };
