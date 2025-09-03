import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

async function seedDatabase() {
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

    // Load data.json file
    const dataPath = path.join(__dirname, '../../data.json');
    if (!fs.existsSync(dataPath)) {
      console.error('❌ data.json file not found at:', dataPath);
      return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log('📄 Loaded data.json successfully');

    // Create Portefeuilles based on unique portfolios
    console.log('🏗️ Creating Portefeuilles...');
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

    // Create Familles Actifs
    console.log('👨‍👩‍👧‍👦 Creating Familles Actifs...');
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

    // Create Groupes Actifs
    console.log('👥 Creating Groupes Actifs...');
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

    // Create sample Actifs (assets)
    console.log('🏭 Creating sample Actifs...');
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
    console.log('🔍 Creating Inspection Types...');
    
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

    // Create Types Inspection Groupe relationships
    console.log('🔗 Creating Types Inspection Groupe relationships...');
    
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

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Summary:
    - ${portfolios.length} Portefeuilles created
    - ${data.familles.length} Familles Actifs created
    - ${data.groupes.length} Groupes Actifs created
    - ${actifCount} Actifs created
    - ${data.type_inspection.length} Inspection Types created
    - ${data.types_inspection_groupe.length} Inspection-Groupe relationships created`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await dataSource.destroy();
  }
}

seedDatabase();
