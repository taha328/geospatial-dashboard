   import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateInspectionTable1740451200006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'inspections',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'titre',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'datePrevue',
            type: 'date',
          },
          {
            name: 'dateRealisation',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'statut',
            type: 'enum',
            enum: ['planifiee', 'en_cours', 'terminee', 'annulee', 'reportee'],
            default: "'planifiee'",
          },
          {
            name: 'resultatGeneral',
            type: 'enum',
            enum: ['bon', 'moyen', 'mauvais', 'critique'],
            isNullable: true,
          },
          {
            name: 'observations',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'recommandations',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'inspecteurResponsable',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'organismeInspection',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'coutInspection',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'photosRapport',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'documentsAnnexes',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'mesuresRelevees',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'conformite',
            type: 'enum',
            enum: ['conforme', 'non_conforme', 'avec_reserves'],
            isNullable: true,
          },
          {
            name: 'actifId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'typeInspectionId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'dateCreation',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'dateMiseAJour',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key to actifs table
    await queryRunner.createForeignKey(
      'inspections',
      new TableForeignKey({
        columnNames: ['actifId'],
        referencedTableName: 'actifs',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key to types_inspection table
    await queryRunner.createForeignKey(
      'inspections',
      new TableForeignKey({
        columnNames: ['typeInspectionId'],
        referencedTableName: 'types_inspection',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('inspections');
  }
}
