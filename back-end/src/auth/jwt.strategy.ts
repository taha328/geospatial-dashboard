import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { User } from '../user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(@InjectRepository(User) private userRepo: Repository<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Use secretOrKeyProvider so we can dynamically resolve secret payload from Secret Manager
      secretOrKeyProvider: async (_req: any, _rawJwtToken: any, done: (err: any, secret?: string) => void) => {
        try {
          let jwtSecret = process.env.JWT_SECRET || '';
          if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not set');
          }

          if (jwtSecret.startsWith('projects/')) {
            const client = new SecretManagerServiceClient();
            const [version] = await client.accessSecretVersion({ name: jwtSecret });
            const payload = version?.payload?.data?.toString();
            if (!payload) throw new Error('Secret Manager returned empty JWT secret payload');
            jwtSecret = payload;
            this.logger.log('Loaded JWT secret from Secret Manager');
          } else {
            this.logger.log('Using JWT secret from environment variable');
          }

          done(null, jwtSecret);
        } catch (err) {
          this.logger.error('Failed to load JWT secret for verification', err as any);
          done(err as any);
        }
      },
    });
  }

  async validate(payload: any) {
    // Payload should contain sub (userId) and role
    const user = await this.userRepo.findOneBy({ id: payload.sub });
    if (!user) return null;
    // attach minimal profile
    return { id: user.id, email: user.email, role: user.role };
  }
}
