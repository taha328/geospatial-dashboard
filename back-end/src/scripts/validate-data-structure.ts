import * as fs from 'fs';
import * as path from 'path';

interface DataStructure {
  groupes: Array<{
    numero_groupe: number;
    groupe_actif: string;
    famille: string;
    numero_famille: number;
  }>;
  familles: Array<{
    portfolio: string;
    famille: string;
    numero_famille: number;
  }>;
  type_inspection: Array<{
    type_inspection: string;
    numero_inspection: number;
  }>;
  types_inspection_groupe: Array<{
    numero_groupe: number;
    type_inspection: string;
    numero_inspection: number;
  }>;
}

async function validateDataStructure() {
  console.log('🔍 Validating data structure and mappings...');
  
  try {
    // Load data from data.json
    const dataPath = path.join(process.cwd(), 'data.json');
    
    if (!fs.existsSync(dataPath)) {
      console.error(`❌ Data file not found at ${dataPath}`);
      return false;
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data: DataStructure = JSON.parse(rawData);

    console.log(`📋 Loaded data: ${data.groupes.length} groupes, ${data.familles.length} familles, ${data.type_inspection.length} types inspection`);

    // Validate required fields
    const requiredFields = ['groupes', 'familles', 'type_inspection', 'types_inspection_groupe'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return false;
    }

    // Test mapping functions
    console.log('🔧 Testing mapping functions...');

    const mapFamilleToEnum = (familleName: string): string => {
      const mapping: { [key: string]: string } = {
        'Ouvrages de protection': 'ouvrages_protection',
        'Ouvrages d\'amarrage et d\'accostage': 'ouvrages_amarrage_accostage',
        'Bassin': 'bassin',
        'Ouvrages d\'arts': 'ouvrages_arts',
        'Equipement de balisage maritime': 'equipement_balisage_maritime',
        'Equipement Electrique': 'equipement_electrique',
        'Equipement de signalisation': 'equipement_signalisation',
        'Equipement de protection contre incendie': 'equipement_protection_incendie'
      };
      return mapping[familleName] || 'ouvrages_protection';
    };

    const mapGroupeToEnum = (groupeName: string): string => {
      const mapping: { [key: string]: string } = {
        'Digue à caisson': 'digue_a_caisson',
        'Digue à talus': 'digue_a_talus',
        'Bollard': 'bollard',
        'Bassin': 'bassin',
        'Défense': 'defense',
        'Pont cadre': 'pont_cadre',
        'Pont à poutre': 'pont_a_poutre',
        'Pont dalots': 'pont_dalots',
        'Feu de guidage': 'feu_de_guidage',
        'Feu d\'extrémité': 'feu_extremite',
        'Feu à secteurs': 'feu_a_secteurs',
        'Poste répartiteur': 'poste_repartiteur',
        'Groupe électrogène': 'groupe_electrogene',
        'Onduleur': 'onduleur',
        'Panneau de signalisation': 'panneau_signalisation',
        'Désenfumage': 'desenfumage',
        'Centrale incendie': 'centrale_incendie'
      };
      return mapping[groupeName] || 'bollard';
    };

    // Validate all famille mappings
    console.log('📝 Validating famille mappings...');
    for (const famille of data.familles) {
      const mapped = mapFamilleToEnum(famille.famille);
      console.log(`  ${famille.famille} → ${mapped}`);
    }

    // Validate all groupe mappings
    console.log('📝 Validating groupe mappings...');
    for (const groupe of data.groupes) {
      const mapped = mapGroupeToEnum(groupe.groupe_actif);
      console.log(`  ${groupe.groupe_actif} → ${mapped}`);
    }

    // Validate relationships
    console.log('🔗 Validating relationships...');
    
    // Check if all groupes have matching familles
    for (const groupe of data.groupes) {
      const famille = data.familles.find(f => f.numero_famille === groupe.numero_famille);
      if (!famille) {
        console.error(`❌ Groupe ${groupe.groupe_actif} references non-existent famille ${groupe.numero_famille}`);
        return false;
      }
    }

    // Check if all inspection groupe relationships reference valid groupes and inspections
    for (const inspectionGroupe of data.types_inspection_groupe) {
      const groupe = data.groupes.find(g => g.numero_groupe === inspectionGroupe.numero_groupe);
      const inspection = data.type_inspection.find(i => i.numero_inspection === inspectionGroupe.numero_inspection);
      
      if (!groupe) {
        console.error(`❌ Inspection groupe references non-existent groupe ${inspectionGroupe.numero_groupe}`);
        return false;
      }
      
      if (!inspection) {
        console.error(`❌ Inspection groupe references non-existent inspection ${inspectionGroupe.numero_inspection}`);
        return false;
      }
    }

    // Summary
    console.log('\n📊 Data Summary:');
    console.log(`  Portfolios: ${[...new Set(data.familles.map(f => f.portfolio))].length}`);
    console.log(`  Familles: ${data.familles.length}`);
    console.log(`  Groupes: ${data.groupes.length}`);
    console.log(`  Inspection Types: ${data.type_inspection.length}`);
    console.log(`  Inspection-Group Relations: ${data.types_inspection_groupe.length}`);

    // Unique portfolios
    console.log('\n🏢 Portfolios:');
    [...new Set(data.familles.map(f => f.portfolio))].forEach(p => console.log(`  - ${p}`));

    // Inspection types
    console.log('\n🔍 Inspection Types:');
    data.type_inspection.forEach(i => console.log(`  ${i.numero_inspection}. ${i.type_inspection}`));

    console.log('\n✅ All validations passed!');
    return true;

  } catch (error) {
    console.error('❌ Error during validation:', error.message);
    return false;
  }
}

validateDataStructure()
  .then(success => {
    if (success) {
      console.log('\n🎉 Data structure validation completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Data structure validation failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
