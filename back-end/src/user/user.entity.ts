import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  /**
   * Role: 'administrateur' | 'maitre_d_ouvrage' | 'operateur'
   */
  @Column({ default: 'operateur' })
  role: string;

  /** bcrypt/argon2 password hash; nullable until user sets password */
  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash?: string | null;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  // Invite token (hash) and expiry
  @Column({ name: 'invite_token_hash', type: 'text', nullable: true })
  inviteTokenHash?: string | null;

  @Column({ name: 'invite_token_expires_at', type: 'timestamptz', nullable: true })
  inviteTokenExpiresAt?: Date | null;

  @Column({ name: 'must_reset_password', default: false })
  mustResetPassword: boolean;

  // Reset password token (hash) and expiry
  @Column({ name: 'reset_token_hash', type: 'text', nullable: true })
  resetTokenHash?: string | null;

  @Column({ name: 'reset_token_expires_at', type: 'timestamptz', nullable: true })
  resetTokenExpiresAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
