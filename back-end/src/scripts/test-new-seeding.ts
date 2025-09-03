import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ActifsSeedService } from '../seed/actifs-seed.service';

async function bootstrap() {
  console.log('🚀 Starting migration and seeding process...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Get the seed service
    const actifsSeedService = app.get(ActifsSeedService);
    
    console.log('📁 Running actifs seeding...');
    const result = await actifsSeedService.seedActifs();
    
    console.log('✅ Seeding completed successfully!');
    console.log('📊 Results:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
