import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Simple health check (doesn't touch DB)
  @Get('health')
  health() {
    return { status: 'healthy', service: 'geospatial-backend', time: new Date().toISOString() };
  }
}
