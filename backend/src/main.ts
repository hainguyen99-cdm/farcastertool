import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for all origins to allow external projects
  app.enableCors({
    origin: true, // Allow all origins for external projects
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods',
    ],
    credentials: true,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  });
  
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
