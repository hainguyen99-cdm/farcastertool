import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Simple and effective CORS configuration
  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: '*',
    allowedHeaders: '*',
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
