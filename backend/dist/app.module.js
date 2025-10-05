"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const bull_1 = require("@nestjs/bull");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const test_service_1 = require("./test.service");
const test_schema_1 = require("./test.schema");
const account_schema_1 = require("./account.schema");
const test_queue_processor_1 = require("./test-queue.processor");
const redis_test_service_1 = require("./redis-test.service");
const encryption_service_1 = require("./encryption.service");
const account_service_1 = require("./account.service");
const scenario_schema_1 = require("./scenario.schema");
const scenario_service_1 = require("./scenario.service");
const scenario_controller_1 = require("./scenario.controller");
const account_controller_1 = require("./account.controller");
const log_controller_1 = require("./log.controller");
const log_schema_1 = require("./log.schema");
const logging_service_1 = require("./logging.service");
const farcaster_service_1 = require("./farcaster.service");
const signature_header_service_1 = require("./signature-header.service");
const game_record_schema_1 = require("./game-record.schema");
const game_record_service_1 = require("./game-record.service");
const game_record_controller_1 = require("./game-record.controller");
const action_processor_1 = require("./action.processor");
const scenario_execution_service_1 = require("./scenario-execution.service");
const stats_service_1 = require("./stats.service");
const stats_controller_1 = require("./stats.controller");
const script_execution_service_1 = require("./script-execution.service");
const script_controller_1 = require("./script.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                envFilePath: 'config.env',
                isGlobal: true,
            }),
            mongoose_1.MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost/farcaster-tool'),
            mongoose_1.MongooseModule.forFeature([
                { name: test_schema_1.TestDocument.name, schema: test_schema_1.TestSchema },
                { name: account_schema_1.Account.name, schema: account_schema_1.AccountSchema },
                { name: scenario_schema_1.Scenario.name, schema: scenario_schema_1.ScenarioSchema },
                { name: log_schema_1.Log.name, schema: log_schema_1.LogSchema },
                { name: game_record_schema_1.GameRecord.name, schema: game_record_schema_1.GameRecordSchema },
            ]),
            bull_1.BullModule.forRoot({
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                },
            }),
            bull_1.BullModule.registerQueue({
                name: 'test-queue',
            }),
            bull_1.BullModule.registerQueue({
                name: 'actions',
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000,
                    },
                    removeOnComplete: true,
                    removeOnFail: true,
                },
            }),
            axios_1.HttpModule,
        ],
        controllers: [app_controller_1.AppController, log_controller_1.LogController, account_controller_1.AccountController, scenario_controller_1.ScenarioController, stats_controller_1.StatsController, script_controller_1.ScriptController, game_record_controller_1.GameRecordController],
        providers: [app_service_1.AppService, test_service_1.TestService, test_queue_processor_1.TestQueueProcessor, redis_test_service_1.RedisTestService, encryption_service_1.EncryptionService, account_service_1.AccountService, scenario_service_1.ScenarioService, logging_service_1.LoggingService, farcaster_service_1.FarcasterService, action_processor_1.ActionProcessor, scenario_execution_service_1.ScenarioExecutionService, stats_service_1.StatsService, script_execution_service_1.ScriptExecutionService, signature_header_service_1.SignatureHeaderService, game_record_service_1.GameRecordService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map