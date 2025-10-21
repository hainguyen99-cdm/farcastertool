import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for all origins (proxy-friendly)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow all origins for now - you can restrict this later if needed
      console.log('CORS request from origin:', origin);
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
      'Pragma',
      'x-api-key',
      'signature',
    ],
    credentials: false,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  });
  
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
