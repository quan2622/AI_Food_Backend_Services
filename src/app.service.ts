import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getServerStatus(): {
    port: number;
    nodeEnv: string;
    uptimeSeconds: number;
    nodeVersion: string;
  } {
    const port = Number(process.env.SERVER_PORT ?? 8080);
    return {
      port,
      nodeEnv: process.env.NODE_ENV ?? 'development',
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
    };
  }
}
