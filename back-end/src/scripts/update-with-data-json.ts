import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

async function updateCloudSQLWithDataJson() {
  // Use your existing data source configuration
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'qawsed?',
    database: process.env.DB_NAME || 'db',
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false,
    synchronize: false,
    logging: true,
  });

  try {
    console.log('🔗 Connecting to database...');
    await dataSource.initialize();

    // Load data.json file
    const dataPath = path.join(__dirname, '../../data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log('📄 Loaded data.json successfully');

    // Step 1: Check current state
    console.log('\n📊 Current state check...');
    const currentPortefeuilles = await dataSource.query('SELECT * FROM portefeuilles');
    const currentFamilles = await dataSource.query('SELECT * FROM familles_actifs');
    const currentGroupes = await dataSource.query('SELECT * FROM groupes_actifs');
    
    console.log(`Current: ${currentPortefeuilles.length} portefeuilles, ${currentFamilles.length} familles, ${currentGroupes.length} groupes`);

    // Step 2: Clear existing asset-related data but keep the structure
    console.log('\n🗑️ Clearing existing asset data...');
    await dataSource.query('DELETE FROM types_inspection_groupe');
    await dataSource.query('DELETE FROM types_inspection');
    await dataSource.query('DELETE FROM actifs');
    await dataSource.query('DELETE FROM groupes_actifs');
    await dataSource.query('DELETE FROM familles_actifs');
    await dataSource.query('DELETE FROM portefeuilles');
    console.log('✅ Existing data cleared');

    // Step 3: Insert data.json structure
    console.log('\n🏗️ Creating new structure from data.json...');
    
    // Create Portefeuilles based on unique portfolios
    const portfolios = [...new Set(data.familles.map((f: any) => f.portfolio))];
    const portefeuilleMap = new Map();
    
    for (const portfolio of portfolios) {
      const portfolioName = portfolio as string;
      const result = await dataSource.query(`
        INSERT INTO "portefeuilles" ("nom", "description", "code", "statut", "latitude", "longitude")
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        portfolioName,
        `Portefeuille ${portfolioName} - Tangier Med Port`,
        portfolioName.toLowerCase().replace(/\s+/g, '_'),
        'actif',
        35.8880, // Tangier Med coordinates
        -5.4992
      ]);
      portefeuilleMap.set(portfolioName, result[0].id);
      console.log(`✅ Created Portefeuille: ${portfolioName} (ID: ${result[0].id})`);
    }

    // Create Familles Actifs
    const familleMap = new Map();
    for (const famille of data.familles) {
      const portefeuilleId = portefeuilleMap.get(famille.portfolio);
      
      // Map famille names to our enum types
      let familleType = 'ouvrages_amarrage';
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
        INSERT INTO "familles_actifs" ("nom", "description", "code", "type", "statut", "latitude", "longitude", "portefeuilleId")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        famille.famille,
        `Famille ${famille.famille} - ${famille.portfolio}`,
        `fam_${famille.numero_famille}`,
        familleType,
        'actif',
        35.8880 + (Math.random() - 0.5) * 0.005,
        -5.4992 + (Math.random() - 0.5) * 0.005,
        portefeuilleId
      ]);
      familleMap.set(famille.numero_famille, result[0].id);
      console.log(`✅ Created Famille: ${famille.famille} (ID: ${result[0].id})`);
    }

    // Create Groupes Actifs
    const groupeMap = new Map();
    for (const groupe of data.groupes) {
      const familleId = familleMap.get(groupe.numero_famille);
      if (!familleId) continue;

      // Map groupe names to our enum types
      let groupeType = 'bollards';
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
        INSERT INTO "groupes_actifs" ("nom", "description", "code", "type", "statut", "latitude", "longitude", "familleActifId")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        groupe.groupe_actif,
        `Groupe ${groupe.groupe_actif}`,
        `grp_${groupe.numero_groupe}`,
        groupeType,
        'actif',
        35.8880 + (Math.random() - 0.5) * 0.005,
        -5.4992 + (Math.random() - 0.5) * 0.005,
        familleId
      ]);
      groupeMap.set(groupe.numero_groupe, result[0].id);
      console.log(`✅ Created Groupe: ${groupe.groupe_actif} (ID: ${result[0].id})`);
    }

    // Create sample Actifs
    let actifCount = 0;
    for (const [groupeCode, groupeId] of groupeMap) {
      const sampleCount = Math.floor(Math.random() * 2) + 2;
      
      for (let i = 1; i <= sampleCount; i++) {
        const actifCode = `TM-${groupeCode}-${String(i).padStart(3, '0')}`;
        await dataSource.query(`
          INSERT INTO "actifs" (
            "nom", "description", "code", "statutOperationnel", "etatGeneral",
            "latitude", "longitude", "groupeActifId"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          `Actif ${actifCode}`,
          `Équipement portuaire ${actifCode} - Tangier Med`,
          actifCode,
          'operationnel',
          'bon',
          35.8880 + (Math.random() - 0.5) * 0.01,
          -5.4992 + (Math.random() - 0.5) * 0.01,
          groupeId
        ]);
        actifCount++;
      }
    }

    // Create Inspection Types
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
    }

    // Create Types Inspection Groupe relationships
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

    console.log('\n🎉 Database updated successfully with data.json structure!');
    console.log(`📊 Final Summary:
    - ${portfolios.length} Portefeuilles (based on data.json portfolios)
    - ${data.familles.length} Familles Actifs (from data.json)
    - ${data.groupes.length} Groupes Actifs (from data.json)  
    - ${actifCount} Sample Actifs (around Tangier Med)
    - ${data.type_inspection.length} Inspection Types (from data.json)
    - ${data.types_inspection_groupe.length} Inspection-Groupe relationships
    - All coordinates centered around Tangier Med Port (35.8880°N, -5.4992°E)`);

  } catch (error) {
    console.error('❌ Error updating database:', error);
  } finally {
    await dataSource.destroy();
  }
}

updateCloudSQLWithDataJson();
