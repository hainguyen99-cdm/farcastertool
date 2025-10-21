import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS is handled by nginx proxy - no need to enable it here
  // app.enableCors() is disabled to prevent duplicate CORS headers
  
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
