"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
        res.header('Access-Control-Allow-Credentials', 'true');
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
        next();
    });
    app.enableCors({
        origin: (origin, callback) => {
            callback(null, true);
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
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
            'Access-Control-Allow-Credentials',
        ],
        exposedHeaders: [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Credentials',
        ],
        credentials: true,
        optionsSuccessStatus: 200,
        preflightContinue: false,
    });
    await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
//# sourceMappingURL=main.js.map