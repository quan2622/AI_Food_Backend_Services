import {
  BadRequestException,
  Logger,
  ValidationError,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { AppModule } from './app.module';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { RedisService } from './redis/redis.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { HttpExceptionFilter, TransformInterceptor } from './common';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new BadRequestException(
          validationErrors.map((error) => ({
            [error.property]: Object.values(error.constraints ?? {}).join(', '),
          })),
        );
      },
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    credentials: true,
  });

  //version config
  const apiPrefix = 'api';
  const apiVersions = ['1', '2'];

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersions,
  });

  const port = Number(process.env.SERVER_PORT ?? 8080);
  await app.listen(port);

  const serverStatus = app.get(AppService).getServerStatus();
  const dbStatus = await app.get(PrismaService).getConnectionStatus();
  const redisStatus = await app.get(RedisService).getConnectionStatus();

  // Elasticsearch status
  let esConnected = false;
  let esVersion = '';
  try {
    const esService = app.get(ElasticsearchService);
    const esInfo = await esService.info();
    esConnected = true;
    esVersion = esInfo.version?.number ?? '';
  } catch {
    esConnected = false;
  }

  const line =
    '====================================================================';

  logger.log(line);
  logger.log(
    '||                        STARTING SERVER                         ||',
  );
  logger.log(line);

  logger.log(
    '||   SERVER STATUS                                                ||',
  );
  logger.log(
    `||   • Port        : ${serverStatus.port.toString().padEnd(45)}||`,
  );
  logger.log(`||   • Node env    : ${serverStatus.nodeEnv.padEnd(45)}||`);
  logger.log(`||   • Node version: ${serverStatus.nodeVersion.padEnd(45)}||`);
  logger.log(`||   • API prefix  : ${`/${apiPrefix}`.padEnd(45)}||`);
  logger.log(`||   • API version : ${apiVersions.join(', ').padEnd(45)}||`);

  logger.log(
    '||   DATABASE STATUS                                              ||',
  );

  // PostgreSQL Status
  if (dbStatus.connected) {
    logger.log(`||   • PostgreSQL  : connected${' '.repeat(36)}||`);
  } else {
    const errorMsg = (dbStatus.error ?? 'Unknown error').toString();
    logger.error(
      `||   • PostgreSQL  : disconnected - ${errorMsg.padEnd(20)}||`,
    );
  }

  // Redis Status
  if (redisStatus.connected) {
    logger.log(`||   • Redis       : connected${' '.repeat(36)}||`);
  } else {
    const errorMsg = (redisStatus.error ?? 'Unknown error').toString();
    logger.error(
      `||   • Redis       : disconnected - ${errorMsg.padEnd(20)}||`,
    );
  }

  // Elasticsearch Status
  if (esConnected) {
    const esLabel = esVersion ? `connected (v${esVersion})` : 'connected';
    logger.log(`||   • Elasticsearch: ${esLabel.padEnd(44)}||`);
  } else {
    logger.error(`||   • Elasticsearch: disconnected${' '.repeat(32)}||`);
  }

  logger.log(line);
}
void bootstrap();
