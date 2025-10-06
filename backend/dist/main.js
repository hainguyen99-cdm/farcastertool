"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: true,
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
        optionsSuccessStatus: 200,
    });
    await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
//# sourceMappingURL=main.js.map