import { NestFactory } from '@nestjs/core';
import { Repository, DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Portefeuille } from '../gestion_des_actifs/entities/portefeuille.entity';
import { FamilleActif } from '../gestion_des_actifs/entities/famille-actif.entity';
import { GroupeActif } from '../gestion_des_actifs/entities/groupe-actif.entity';

async function seedStructureOnly() {
  console.log('🌱 Starting structure-only seeding...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const portefeuilleRepo = dataSource.getRepository(Portefeuille);
  const familleActifRepo = dataSource.getRepository(FamilleActif);
  const groupeActifRepo = dataSource.getRepository(GroupeActif);

  try {
    // Clear existing data in correct order
    console.log('🧹 Clearing existing structure data...');
    await groupeActifRepo.delete({});
    await familleActifRepo.delete({});
    await portefeuilleRepo.delete({});

    // Create Portefeuilles
    console.log('📁 Creating Portefeuilles...');
    const portefeuilles = await portefeuilleRepo.save([
      {
        nom: 'Infrastructure Portuaire',
        description: 'Gestion des infrastructures principales du port',
        responsable: 'Direction Technique',
        dateCreation: new Date()
      },
      {
        nom: 'Équipements Opérationnels',
        description: 'Gestion des équipements de manutention et transport',
        responsable: 'Direction Opérationnelle',
        dateCreation: new Date()
      }
    ]);

    // Create Familles d'Actifs
    console.log('🏗️ Creating Familles d\'Actifs...');
    const familles = await familleActifRepo.save([
      {
        nom: 'Ouvrages d\'Amarrage',
        type: 'ouvrages_amarrage',
        description: 'Équipements pour l\'amarrage des navires',
        portefeuille: portefeuilles[0]
      },
      {
        nom: 'Ouvrages d\'Accostage',
        type: 'ouvrages_accostage',
        description: 'Infrastructures d\'accostage des navires',
        portefeuille: portefeuilles[0]
      },
      {
        nom: 'Équipements de Manutention',
        type: 'equipements_manutention',
        description: 'Équipements pour la manutention des marchandises',
        portefeuille: portefeuilles[1]
      },
      {
        nom: 'Infrastructures de Support',
        type: 'infrastructures_support',
        description: 'Infrastructures de support général',
        portefeuille: portefeuilles[0]
      }
    ]);

    // Create Groupes d'Actifs
    console.log('📦 Creating Groupes d\'Actifs...');
    const groupes = await groupeActifRepo.save([
      // Ouvrages d'Amarrage
      {
        nom: 'Bollards Quai Principal',
        description: 'Bollards pour l\'amarrage au quai principal',
        familleActif: familles[0]
      },
      {
        nom: 'Défenses Portuaires',
        description: 'Systèmes de défense pour la protection des navires',
        familleActif: familles[0]
      },
      {
        nom: 'Anneaux d\'Amarrage',
        description: 'Anneaux d\'amarrage répartis sur les quais',
        familleActif: familles[0]
      },
      
      // Ouvrages d'Accostage
      {
        nom: 'Quai Conteneurs',
        description: 'Quai dédié aux navires porte-conteneurs',
        familleActif: familles[1]
      },
      {
        nom: 'Quai Passagers',
        description: 'Quai pour les navires de passagers',
        familleActif: familles[1]
      },
      {
        nom: 'Quai Marchandises',
        description: 'Quai pour les marchandises diverses',
        familleActif: familles[1]
      },
      
      // Équipements de Manutention
      {
        nom: 'Grues Portuaires',
        description: 'Grues pour la manutention des conteneurs',
        familleActif: familles[2]
      },
      {
        nom: 'Chariots Élévateurs',
        description: 'Chariots pour le transport des marchandises',
        familleActif: familles[2]
      },
      {
        nom: 'Portiques de Quai',
        description: 'Portiques pour la manutention lourde',
        familleActif: familles[2]
      },
      
      // Infrastructures de Support
      {
        nom: 'Éclairage Portuaire',
        description: 'Système d\'éclairage du port',
        familleActif: familles[3]
      },
      {
        nom: 'Réseau Électrique',
        description: 'Infrastructure électrique du port',
        familleActif: familles[3]
      },
      {
        nom: 'Système de Sécurité',
        description: 'Équipements de sécurité et surveillance',
        familleActif: familles[3]
      },
      {
        nom: 'Voirie Portuaire',
        description: 'Routes et voies de circulation du port',
        familleActif: familles[3]
      }
    ]);

    console.log(`✅ Structure seeding completed successfully!`);
    console.log(`   📁 ${portefeuilles.length} Portefeuilles créés`);
    console.log(`   🏗️ ${familles.length} Familles d'Actifs créées`);
    console.log(`   📦 ${groupes.length} Groupes d'Actifs créés`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  seedStructureOnly().catch(console.error);
}
