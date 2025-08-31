import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  // Simple health check (doesn't touch DB)
  @Get('health')
  @Public()
  health() {
    return { status: 'healthy', service: 'geospatial-backend', time: new Date().toISOString() };
  }
}
