import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);
  
  console.log('🌱 Starting asset data seeding...');
  await seedService.seedAll();
  console.log('✅ Asset data seeding completed!');
  
  await app.close();
}

bootstrap().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
