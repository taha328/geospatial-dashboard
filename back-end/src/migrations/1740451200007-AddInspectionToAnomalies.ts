import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddInspectionToAnomalies1740451200007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add inspectionId column to anomalies table
    await queryRunner.addColumn(
      'anomalies',
      new TableColumn({
        name: 'inspectionId',
        type: 'int',
        isNullable: true,
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'anomalies',
      new TableForeignKey({
        columnNames: ['inspectionId'],
        referencedTableName: 'inspections',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key first
    const table = await queryRunner.getTable('anomalies');
    const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf('inspectionId') !== -1);
    if (foreignKey) {
      await queryRunner.dropForeignKey('anomalies', foreignKey);
    }

    // Drop column
    await queryRunner.dropColumn('anomalies', 'inspectionId');
  }
}
