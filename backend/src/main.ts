import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS: allow all frontends (proxy-friendly). If you later need cookies, switch to echoing the exact Origin.
  // app.enableCors({
  //   origin: true,
  //   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  //   allowedHeaders: [
  //     'Origin',
  //     'X-Requested-With',
  //     'Content-Type',
  //     'Accept',
  //     'Authorization',
  //     'Cache-Control',
  //     'Pragma',
  //   ],
  //   credentials: false,
  // });
  
  // No extra middleware needed; Nest will include CORS headers on preflight
  
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
