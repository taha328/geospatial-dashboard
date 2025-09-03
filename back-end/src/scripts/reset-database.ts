import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function resetAndMigrate() {
  console.log('🔄 Resetting database and applying new structure...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const dataSource = app.get(DataSource);
    
    console.log('🗑️ Clearing existing actifs data...');
    
    // Clear existing data in correct order (respecting foreign keys)
    await dataSource.query('DELETE FROM actifs');
    await dataSource.query('DELETE FROM groupes_actifs');  
    await dataSource.query('DELETE FROM familles_actifs');
    await dataSource.query('DELETE FROM portefeuilles');
    
    console.log('✅ Existing data cleared');
    
    // Now manually create the new tables for inspection types
    console.log('📝 Creating inspection types tables...');
    
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "types_inspection" (
        "id" SERIAL NOT NULL,
        "numero_inspection" integer NOT NULL UNIQUE,
        "type_inspection" character varying(255) NOT NULL,
        "description" text,
        "statut" character varying NOT NULL DEFAULT 'actif',
        "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
        "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_types_inspection" PRIMARY KEY ("id")
      )
    `);
    
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS "types_inspection_groupe" (
        "id" SERIAL NOT NULL,
        "numero_groupe" integer NOT NULL,
        "numero_inspection" integer NOT NULL,
        "type_inspection" character varying(255) NOT NULL,
        "description" text,
        "statut" character varying NOT NULL DEFAULT 'actif',
        "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
        "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_types_inspection_groupe" PRIMARY KEY ("id")
      )
    `);
    
    console.log('✅ Inspection types tables created');
    
    // Update enums by dropping and recreating them
    console.log('🔧 Updating enum types...');
    
    // Update famille enum
    await dataSource.query(`DROP TYPE IF EXISTS "familles_actifs_type_enum" CASCADE`);
    await dataSource.query(`
      CREATE TYPE "familles_actifs_type_enum" AS ENUM(
        'ouvrages_protection',
        'ouvrages_amarrage_accostage', 
        'bassin',
        'ouvrages_arts',
        'equipement_balisage_maritime',
        'equipement_electrique',
        'equipement_signalisation',
        'equipement_protection_incendie'
      )
    `);
    
    // Update groupe enum
    await dataSource.query(`DROP TYPE IF EXISTS "groupes_actifs_type_enum" CASCADE`);
    await dataSource.query(`
      CREATE TYPE "groupes_actifs_type_enum" AS ENUM(
        'digue_a_caisson',
        'digue_a_talus',
        'bollard',
        'bassin',
        'defense',
        'pont_cadre',
        'pont_a_poutre',
        'pont_dalots',
        'feu_de_guidage',
        'feu_extremite',
        'feu_a_secteurs',
        'poste_repartiteur',
        'groupe_electrogene',
        'onduleur',
        'panneau_signalisation',
        'desenfumage',
        'centrale_incendie'
      )
    `);
    
    // Recreate the famille and groupe tables with new enum types
    await dataSource.query('DROP TABLE IF EXISTS familles_actifs CASCADE');
    await dataSource.query(`
      CREATE TABLE "familles_actifs" (
        "id" SERIAL NOT NULL,
        "nom" character varying(255) NOT NULL,
        "description" text,
        "code" character varying(100) NOT NULL,
        "type" "familles_actifs_type_enum",
        "statut" character varying NOT NULL DEFAULT 'actif',
        "latitude" numeric(10,6),
        "longitude" numeric(10,6),
        "portefeuilleId" integer,
        "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
        "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_familles_actifs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_familles_actifs_portefeuille" FOREIGN KEY ("portefeuilleId") REFERENCES "portefeuilles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    
    await dataSource.query('DROP TABLE IF EXISTS groupes_actifs CASCADE');
    await dataSource.query(`
      CREATE TABLE "groupes_actifs" (
        "id" SERIAL NOT NULL,
        "nom" character varying(255) NOT NULL,
        "description" text,
        "code" character varying(100) NOT NULL,
        "type" "groupes_actifs_type_enum" DEFAULT 'bollard',
        "statut" character varying NOT NULL DEFAULT 'actif',
        "latitude" numeric(10,6),
        "longitude" numeric(10,6),
        "familleActifId" integer,
        "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
        "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_groupes_actifs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_groupes_actifs_famille" FOREIGN KEY ("familleActifId") REFERENCES "familles_actifs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    
    // Recreate actifs table
    await dataSource.query('DROP TABLE IF EXISTS actifs CASCADE');
    await dataSource.query(`
      CREATE TABLE "actifs" (
        "id" SERIAL NOT NULL,
        "nom" character varying(255) NOT NULL,
        "description" text,
        "code" character varying(100) NOT NULL,
        "type" character varying,
        "statutOperationnel" character varying NOT NULL DEFAULT 'operationnel',
        "etatGeneral" character varying NOT NULL DEFAULT 'bon',
        "latitude" numeric(10,6),
        "longitude" numeric(10,6),
        "dateMiseEnService" TIMESTAMP,
        "dureeVieEstimee" integer,
        "valeurAchat" numeric,
        "groupeActifId" integer,
        "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
        "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_actifs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_actifs_groupe" FOREIGN KEY ("groupeActifId") REFERENCES "groupes_actifs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      )
    `);
    
    console.log('✅ Database structure updated successfully');
    
  } catch (error) {
    console.error('❌ Error during reset:', error.message);
    throw error;
  } finally {
    await app.close();
  }
}

resetAndMigrate()
  .then(() => {
    console.log('🎉 Database reset and migration completed successfully!');
    console.log('📋 Next steps:');
    console.log('1. Start the application: npm run start:dev');
    console.log('2. Call the seed endpoint: POST /api/seed/actifs');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  });
