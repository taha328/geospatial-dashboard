import { Injectable, Logger } from '@nestjs/common';
import { ActifsSeedService } from './actifs-seed.service';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly actifsSeedService: ActifsSeedService
  ) {}

  async seedAll() {
    this.logger.log('🌱 Starting comprehensive seeding...');
    
    try {
      // Always attempt actifs seeding
      const result = await this.actifsSeedService.seedActifs();
      this.logger.log('✅ Actifs seeding result:', result);
      return result;
    } catch (error) {
      this.logger.error('❌ Error during seeding:', error.stack);
      // Don't throw to prevent app crash during startup
      this.logger.warn('⚠️ Continuing app startup despite seeding error');
      return { status: 'failed', error: error.message };
    }
  }
}
