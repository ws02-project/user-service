import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MANAGER = 'manager',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_users_subject')
  subject!: string; // Asgardeo subject ID (sub claim from JWT)

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_users_email')
  email!: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name', nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 200, name: 'display_name', nullable: true })
  displayName?: string;

  @Column({ type: 'varchar', length: 500, name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({
    type: 'varchar',
    length: 50,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ type: 'uuid', nullable: true, name: 'organization_id' })
  @Index('idx_users_organization')
  organizationId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, string>;

  @Column({ type: 'timestamp', nullable: true, name: 'last_login_at' })
  lastLoginAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

export interface CreateUserDTO {
  subject: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: UserRole;
  organizationId?: string;
  metadata?: Record<string, string>;
}

export interface UpdateUserDTO {
  subject?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
  metadata?: Record<string, string>;
}

export interface SyncUserDTO {
  subject: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  organizationId?: string;
  roles?: string[]; // Roles from Asgardeo token
  claims?: Record<string, string>;
}

