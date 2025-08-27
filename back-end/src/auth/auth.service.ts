import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { LoginDto } from './dto/login.dto';
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
    const user = await this.userRepo.findOneBy({ email: dto.email });
    if (!user) throw new BadRequestException('Invalid email');
    // If a token is configured, require and validate it
    if (user.inviteTokenHash) {
      if (!dto.token) throw new BadRequestException('Invite token required');
      const ok = await bcrypt.compare(dto.token, user.inviteTokenHash);
      if (!ok) throw new BadRequestException('Invalid or expired invite token');
      if (user.inviteTokenExpiresAt && user.inviteTokenExpiresAt.getTime() < Date.now()) {
        throw new BadRequestException('Invite token expired');
      }
    } else {
      // No invite token present -> only allow if no password yet or mustResetPassword is true
      if (user.passwordHash && !user.mustResetPassword) {
        throw new BadRequestException('Password already set');
      }
    }

    const hash = await bcrypt.hash(dto.password, 12);
    user.passwordHash = hash;
    user.isActive = true;
    user.mustResetPassword = false;
    user.inviteTokenHash = null;
    user.inviteTokenExpiresAt = null;
    await this.userRepo.save(user);
    return { ok: true };
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
        <p>Ou copiez ce code si nécessaire: <code>${token}</code></p>
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
