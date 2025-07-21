import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGestionActifsTables1704451200000 implements MigrationInterface {
  name = 'CreateGestionActifsTables1704451200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create portefeuilles table
    await queryRunner.query(`
      CREATE TABLE "portefeuilles" (
        "id" SERIAL NOT NULL,
        "nom" character varying(255) NOT NULL,
        "description" text,
        "code" character varying(100) NOT NULL,
        "statut" character varying CHECK ("statut" IN ('actif', 'inactif', 'en_cours')) NOT NULL DEFAULT 'actif',
        "latitude" numeric(10,6),
        "longitude" numeric(10,6),
        "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
        "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portefeuilles" PRIMARY KEY ("id")
      )
    `);

    // Create familles_actifs table
    await queryRunner.query(`
      CREATE TABLE "familles_actifs" (
        "id" SERIAL NOT NULL,
        "nom" character varying(255) NOT NULL,
        "description" text,
        "code" character varying(100) NOT NULL,
        "type" character varying CHECK ("type" IN ('ouvrages_amarrage', 'ouvrages_accostage', 'equipements_manutention', 'infrastructures_support')) NOT NULL DEFAULT 'ouvrages_amarrage',
        "statut" character varying CHECK ("statut" IN ('actif', 'inactif', 'maintenance')) NOT NULL DEFAULT 'actif',
        "latitude" numeric(10,6),
        "longitude" numeric(10,6),
        "portefeuilleId" integer,
        "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
        "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_familles_actifs" PRIMARY KEY ("id")
      )
    `);

    // Create groupes_actifs table
    await queryRunner.query(`
      CREATE TABLE "groupes_actifs" (
        "id" SERIAL NOT NULL,
        "nom" character varying(255) NOT NULL,
        "description" text,
        "code" character varying(100) NOT NULL,
        "type" character varying CHECK ("type" IN ('bollards', 'defenses', 'grues', 'eclairage', 'signalisation')) NOT NULL DEFAULT 'bollards',
        "statut" character varying CHECK ("statut" IN ('actif', 'inactif', 'maintenance')) NOT NULL DEFAULT 'actif',
        "latitude" numeric(10,6),
        "longitude" numeric(10,6),
        "familleActifId" integer,
        "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
        "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_groupes_actifs" PRIMARY KEY ("id")
      )
    `);

    // Create actifs table
    await queryRunner.query(`
      CREATE TABLE "actifs" (
        "id" SERIAL NOT NULL,
        "nom" character varying(255) NOT NULL,
        "description" text,
        "code" character varying(100) NOT NULL,
        "numeroSerie" character varying(100),
        "statutOperationnel" character varying CHECK ("statutOperationnel" IN ('operationnel', 'hors_service', 'maintenance', 'alerte')) NOT NULL DEFAULT 'operationnel',
        "etatGeneral" character varying CHECK ("etatGeneral" IN ('bon', 'moyen', 'mauvais', 'critique')) NOT NULL DEFAULT 'bon',
        "latitude" numeric(10,6) NOT NULL,
        "longitude" numeric(10,6) NOT NULL,
        "dateMiseEnService" date,
        "dateFinGarantie" date,
        "fournisseur" character varying(255),
        "valeurAcquisition" numeric(15,2),
        "specifications" json,
        "groupeActifId" integer,
        "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
        "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_actifs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_actifs_code" UNIQUE ("code")
      )
    `);

    // Create anomalies table
    await queryRunner.query(`
      CREATE TABLE "anomalies" (
        "id" SERIAL NOT NULL,
        "titre" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "priorite" character varying CHECK ("priorite" IN ('faible', 'moyen', 'eleve', 'critique')) NOT NULL DEFAULT 'moyen',
        "statut" character varying CHECK ("statut" IN ('nouveau', 'en_cours', 'resolu', 'ferme')) NOT NULL DEFAULT 'nouveau',
        "typeAnomalie" character varying CHECK ("typeAnomalie" IN ('structural', 'mecanique', 'electrique', 'securite', 'autre')) NOT NULL DEFAULT 'autre',
        "dateDetection" date,
        "dateResolution" date,
        "rapportePar" character varying(255),
        "assigneA" character varying(255),
        "actionsCorrectives" text,
        "photosAnnexes" json,
        "actifId" integer,
        "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
        "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_anomalies" PRIMARY KEY ("id")
      )
    `);

    // Create maintenances table
    await queryRunner.query(`
      CREATE TABLE "maintenances" (
        "id" SERIAL NOT NULL,
        "titre" character varying(255) NOT NULL,
        "description" text,
        "typeMaintenance" character varying CHECK ("typeMaintenance" IN ('preventive', 'corrective', 'urgente')) NOT NULL DEFAULT 'preventive',
        "statut" character varying CHECK ("statut" IN ('planifiee', 'en_cours', 'terminee', 'annulee')) NOT NULL DEFAULT 'planifiee',
        "datePrevue" date NOT NULL,
        "dateDebut" date,
        "dateFin" date,
        "coutEstime" numeric(10,2),
        "coutReel" numeric(10,2),
        "technicienResponsable" character varying(255),
        "entrepriseExterne" character varying(255),
        "rapportIntervention" text,
        "piecesRemplacees" json,
        "documentsAnnexes" json,
        "actifId" integer,
        "dateCreation" TIMESTAMP NOT NULL DEFAULT now(),
        "dateMiseAJour" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_maintenances" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "familles_actifs" 
      ADD CONSTRAINT "FK_familles_actifs_portefeuille" 
      FOREIGN KEY ("portefeuilleId") REFERENCES "portefeuilles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "groupes_actifs" 
      ADD CONSTRAINT "FK_groupes_actifs_famille" 
      FOREIGN KEY ("familleActifId") REFERENCES "familles_actifs"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "actifs" 
      ADD CONSTRAINT "FK_actifs_groupe" 
      FOREIGN KEY ("groupeActifId") REFERENCES "groupes_actifs"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "anomalies" 
      ADD CONSTRAINT "FK_anomalies_actif" 
      FOREIGN KEY ("actifId") REFERENCES "actifs"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "maintenances" 
      ADD CONSTRAINT "FK_maintenances_actif" 
      FOREIGN KEY ("actifId") REFERENCES "actifs"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "maintenances" CASCADE`);
    await queryRunner.query(`DROP TABLE "anomalies" CASCADE`);
    await queryRunner.query(`DROP TABLE "actifs" CASCADE`);
    await queryRunner.query(`DROP TABLE "groupes_actifs" CASCADE`);
    await queryRunner.query(`DROP TABLE "familles_actifs" CASCADE`);
    await queryRunner.query(`DROP TABLE "portefeuilles" CASCADE`);
  }
}
