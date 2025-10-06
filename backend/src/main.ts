import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Simple and effective CORS configuration
  app.enableCors({
    origin: ['http://localhost:3000'], // FE của bạn
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: false, // không cần vì không có Authorization/cookie
  })
  
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
