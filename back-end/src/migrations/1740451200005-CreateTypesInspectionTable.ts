import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateTypesInspectionTable1740451200005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'types_inspection',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'numero_inspection',
            type: 'int',
            isUnique: true,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('types_inspection');
  }
}
