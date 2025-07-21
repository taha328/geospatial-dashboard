import { Controller, Post, Get } from '@nestjs/common';
import { ActifsSeedService } from './actifs-seed.service';

@Controller('api/seed')
export class SeedController {
  constructor(private readonly actifsSeedService: ActifsSeedService) {}

  @Post('actifs')
  async seedActifs() {
    return await this.actifsSeedService.seedActifs();
  }

  @Get('status')
  async getSeedStatus() {
    // Add method to check current state
    return { message: 'Seed service is available' };
  }
}