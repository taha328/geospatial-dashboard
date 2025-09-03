import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTypesInspectionGroupeTable1740451200004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'types_inspection_groupe',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'numero_groupe',
            type: 'int',
          },
          {
            name: 'numero_inspection',
            type: 'int',
          },
          {
            name: 'type_inspection',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'statut',
            type: 'enum',
            enum: ['actif', 'inactif'],
            default: "'actif'",
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

    // Add foreign key to types_inspection table
    await queryRunner.createForeignKey(
      'types_inspection_groupe',
      new TableForeignKey({
        columnNames: ['numero_inspection'],
        referencedTableName: 'types_inspection',
        referencedColumnNames: ['numero_inspection'],
        onDelete: 'CASCADE',
      }),
    );

    // Add foreign key to groupes_actifs table
    await queryRunner.createForeignKey(
      'types_inspection_groupe',
      new TableForeignKey({
        columnNames: ['numero_groupe'],
        referencedTableName: 'groupes_actifs',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('types_inspection_groupe');
  }
}
