import { Module, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../user/user.entity';
import { MailerService } from '../mailer/mailer.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: async () => {
        const logger = new Logger('AuthModule');
        let jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
          throw new Error('JWT_SECRET is not set in environment variables');
        }

        try {
          // If the env var points to a Secret Manager resource, fetch the secret payload
          if (jwtSecret.startsWith('projects/')) {
            const client = new SecretManagerServiceClient();
            const [version] = await client.accessSecretVersion({ name: jwtSecret });
            const payload = version?.payload?.data?.toString();
            if (!payload) {
              throw new Error('Secret Manager returned empty payload for JWT secret');
            }
            jwtSecret = payload;
            logger.log('Loaded JWT secret from Secret Manager');
          } else {
            logger.log('Using JWT secret from environment variable');
          }
        } catch (err) {
          // In production we want to fail fast if we cannot read the secret
          logger.error('Failed to load JWT secret from Secret Manager', err as any);
          throw err;
        }

        return {
          secret: jwtSecret,
          signOptions: { expiresIn: '15m' },
        };
      },
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, MailerService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [AuthService, MailerService]
})
export class AuthModule {}
