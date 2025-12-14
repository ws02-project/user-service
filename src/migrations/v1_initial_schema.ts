import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class V1InitialSchema1700000000001 implements MigrationInterface {
  name = 'V1InitialSchema1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'avatar_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
            default: "'user'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'active'",
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'last_login_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_subject',
        columnNames: ['subject'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_organization',
        columnNames: ['organization_id'],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({
        name: 'idx_users_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'idx_users_status');
    await queryRunner.dropIndex('users', 'idx_users_organization');
    await queryRunner.dropIndex('users', 'idx_users_email');
    await queryRunner.dropIndex('users', 'idx_users_subject');
    await queryRunner.dropTable('users');
  }
}











