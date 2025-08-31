import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { InviteDto } from './dto/invite.dto';
import { randomBytes } from 'crypto';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private userRepo: Repository<User>,
    private mailer: MailerService
  ) {}
  private readonly logger = new Logger(AuthService.name);

  async validateUser(email: string, password: string) {
    const user = await this.userRepo.findOneBy({ email });
    if (!user || !user.passwordHash) return null;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.passwordHash) throw new UnauthorizedException('Password not set');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  async setPassword(dto: SetPasswordDto) {
    console.log('🔍 AuthService.setPassword - Received DTO:', {
      email: dto.email,
      hasToken: !!dto.token,
      tokenLength: dto.token?.length,
      tokenValue: dto.token ? dto.token.substring(0, 10) + '...' : 'undefined'
    });

    const user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user) {
      console.log('❌ AuthService.setPassword - User not found for email:', dto.email);
      throw new BadRequestException('Invalid email');
    }

    console.log('🔍 AuthService.setPassword - User found:', {
      id: user.id,
      email: user.email,
      hasInviteTokenHash: !!user.inviteTokenHash,
      inviteTokenExpiresAt: user.inviteTokenExpiresAt,
      hasResetTokenHash: !!user.resetTokenHash,
      resetTokenExpiresAt: user.resetTokenExpiresAt,
      mustResetPassword: user.mustResetPassword
    });

    // Check for valid token (either invite token or reset token)
    let tokenValid = false;
    let tokenType = '';

    if (user.inviteTokenHash) {
      console.log('🔍 AuthService.setPassword - Checking invite token...');
      if (!dto.token) {
        console.log('❌ AuthService.setPassword - No token provided in request');
        throw new BadRequestException('Invite token required');
      }

      const ok = await bcrypt.compare(dto.token, user.inviteTokenHash);
      console.log('🔍 AuthService.setPassword - Invite token validation result:', ok);

      if (!ok) {
        console.log('❌ AuthService.setPassword - Invite token validation failed');
        throw new BadRequestException('Invalid or expired invite token');
      }

      if (user.inviteTokenExpiresAt && user.inviteTokenExpiresAt.getTime() < Date.now()) {
        console.log('❌ AuthService.setPassword - Invite token expired');
        throw new BadRequestException('Invite token expired');
      }

      tokenValid = true;
      tokenType = 'invite';
      console.log('✅ AuthService.setPassword - Invite token validation successful');
    } else if (user.resetTokenHash) {
      console.log('🔍 AuthService.setPassword - Checking reset token...');
      if (!dto.token) {
        console.log('❌ AuthService.setPassword - No token provided in request');
        throw new BadRequestException('Reset token required');
      }

      const ok = await bcrypt.compare(dto.token, user.resetTokenHash);
      console.log('🔍 AuthService.setPassword - Reset token validation result:', ok);

      if (!ok) {
        console.log('❌ AuthService.setPassword - Reset token validation failed');
        throw new BadRequestException('Invalid or expired reset token');
      }

      if (user.resetTokenExpiresAt && user.resetTokenExpiresAt.getTime() < Date.now()) {
        console.log('❌ AuthService.setPassword - Reset token expired');
        throw new BadRequestException('Reset token expired');
      }

      tokenValid = true;
      tokenType = 'reset';
      console.log('✅ AuthService.setPassword - Reset token validation successful');
    } else {
      console.log('🔍 AuthService.setPassword - No token hash found for user');
      // No token present -> only allow if no password yet or mustResetPassword is true
      if (user.passwordHash && !user.mustResetPassword) {
        console.log('❌ AuthService.setPassword - Password already set and no reset required');
        throw new BadRequestException('Password already set');
      }
      tokenValid = true; // Allow password setting without token if conditions are met
      tokenType = 'none';
    }

    if (!tokenValid) {
      console.log('❌ AuthService.setPassword - Token validation failed');
      throw new BadRequestException('Invalid or expired token');
    }

    console.log('🔍 AuthService.setPassword - Proceeding to set password...');
    const hash = await bcrypt.hash(dto.password, 12);
    user.passwordHash = hash;
    user.isActive = true;
    user.mustResetPassword = false;

    // Clear the appropriate token based on type
    if (tokenType === 'invite') {
      user.inviteTokenHash = null;
      user.inviteTokenExpiresAt = null;
    } else if (tokenType === 'reset') {
      user.resetTokenHash = null;
      user.resetTokenExpiresAt = null;
    }

    await this.userRepo.save(user);

    console.log('✅ AuthService.setPassword - Password set successfully for user:', user.email, 'via', tokenType, 'token');
    return { ok: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    console.log('🔍 AuthService.forgotPassword - Received request for email:', dto.email);

    const user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user) {
      console.log('❌ AuthService.forgotPassword - User not found for email:', dto.email);
      // Don't reveal if email exists or not for security reasons
      return { ok: true, message: 'If the email exists, a reset link has been sent.' };
    }

    console.log('✅ AuthService.forgotPassword - User found, generating reset token');

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 12);

    // Set reset token and expiration (1 hour)
    user.resetTokenHash = resetTokenHash;
    user.resetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await this.userRepo.save(user);

    // Compose reset password link for frontend
    const frontendBase = process.env.FRONTEND_BASE || 'http://localhost:4200';
    const resetPasswordUrl = `${frontendBase.replace(/\/$/, '')}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Send reset email
    try {
      const html = `
        <p>Bonjour ${user.name || 'utilisateur'},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe (valable 1 heure) :</p>
        <p><a href="${resetPasswordUrl}" style="display:inline-block;padding:8px 12px;background:#2563eb;color:#fff;border-radius:4px;text-decoration:none">Réinitialiser mon mot de passe</a></p>
        <p>Si vous n'arrivez pas à cliquer sur le bouton, copiez et collez ce lien dans votre navigateur :</p>
        <p><small style="color:#666;">${resetPasswordUrl}</small></p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.</p>
        <p>Cette demande expire dans 1 heure.</p>
      `;

      await this.mailer.sendMail({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe',
        html,
      });

      console.log('✅ AuthService.forgotPassword - Reset email sent successfully to:', user.email);
    } catch (err) {
      this.logger.error('Failed to send reset password email', err as any);
      throw new BadRequestException('Failed to send reset email');
    }

    return { ok: true, message: 'If the email exists, a reset link has been sent.' };
  }

  async invite(dto: InviteDto, invitedById?: number) {
    // create or update user record with invite token
    let user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user) {
      user = this.userRepo.create({ name: dto.name, email: dto.email, role: dto.role, isActive: false });
    } else {
      user.name = dto.name;
      user.role = dto.role;
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 12);
    user.inviteTokenHash = tokenHash;
    user.inviteTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
    // Mark account as requiring password setup
    user.mustResetPassword = true;
    user.isActive = false;
    await this.userRepo.save(user);

    // Compose set-password link for frontend
    const frontendBase = process.env.FRONTEND_BASE || 'http://localhost:4200';
    const setPasswordUrl = `${frontendBase.replace(/\/$/, '')}/set-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    // Send invite email (non-blocking errors bubble up)
    try {
      const html = `
        <p>Bonjour ${user.name || 'utilisateur'},</p>
        <p>Vous avez été invité à rejoindre l'application. Cliquez sur le bouton ci-dessous pour définir votre mot de passe (valable 24h):</p>
        <p><a href="${setPasswordUrl}" style="display:inline-block;padding:8px 12px;background:#2563eb;color:#fff;border-radius:4px;text-decoration:none">Définir mon mot de passe</a></p>
        <p>Si vous n'arrivez pas à cliquer sur le bouton, copiez et collez ce lien dans votre navigateur :</p>
        <p><small style="color:#666;">${setPasswordUrl}</small></p>
        <p>Si vous n'attendiez pas cette invitation, ignorez ce message.</p>
      `;

      await this.mailer.sendMail({
        to: user.email,
        subject: 'Invitation - Définissez votre mot de passe',
        html,
      });
    } catch (err) {
      this.logger.error('Failed to send invite email', err as any);
      // don't fail the invite creation for now; admin can re-send later
    }

  return { ok: true, email: user.email };
  }

  async me(userId: number) {
    return this.userRepo.findOneBy({ id: userId });
  }
}
