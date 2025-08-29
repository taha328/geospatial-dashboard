import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './seed/seed.service';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set a global prefix for all routes to organize the API
  app.setGlobalPrefix('api');
  
  // Enable global validation pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Enable CORS for frontend communication
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'https://integrated-hawk-466115-q5.web.app',
      'https://geodashboard.site',
      'https://geodashboard.online'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Optional database seeding (only when explicitly enabled)
  if (process.env.SEED_ON_BOOT === 'true') {
    const seedService = app.get(SeedService);
    try {
      await seedService.seedAll();
      console.log('✅ Database seeded successfully!');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
    }
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`🚀 Geospatial Dashboard API running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/api/health`);
}
bootstrap();
