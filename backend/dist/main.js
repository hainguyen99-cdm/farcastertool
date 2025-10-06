"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: (requestOrigin, callback) => {
            if (!requestOrigin)
                return callback(null, true);
            const allowList = [
                /^http:\/\/localhost:\d+$/,
                /^http:\/\/127\.0\.0\.1:\d+$/,
                /^http:\/\/192\.168\.[0-9]{1,3}\.[0-9]{1,3}(?::\d+)?$/,
                /^http:\/\/10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(?::\d+)?$/,
                /^http:\/\/54\.151\.242\.118:3000$/,
                /^https:\/\/54\.151\.242\.118:3000$/,
            ];
            const isAllowed = allowList.some((rx) => rx.test(requestOrigin));
            callback(null, isAllowed);
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
        ],
        credentials: false,
    });
    app.use((req, res, next) => {
        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }
        next();
    });
    await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
//# sourceMappingURL=main.js.map