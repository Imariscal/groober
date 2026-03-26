import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  getStatus(): { status: string; version: string; environment: string } {
    return {
      status: 'running',
      version: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
