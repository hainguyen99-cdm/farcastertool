import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestService } from './test.service';
import { TestDocument, TestSchema } from './test.schema';
import { Account, AccountSchema } from './account.schema';
import { TestQueueProcessor } from './test-queue.processor';
import { RedisTestService } from './redis-test.service';
import { EncryptionService } from './encryption.service';
import { AccountService } from './account.service';
import { Scenario, ScenarioSchema } from './scenario.schema';
import { ScenarioService } from './scenario.service';
import { ScenarioController } from './scenario.controller';
import { AccountController } from './account.controller';
import { LogController } from './log.controller';
import { Log, LogSchema } from './log.schema';
import { LoggingService } from './logging.service';
import { FarcasterService } from './farcaster.service';
import { ActionProcessor } from './action.processor';
import { ScenarioExecutionService } from './scenario-execution.service';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { ScriptExecutionService } from './script-execution.service';
import { ScriptController } from './script.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: 'config.env',
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost/farcaster-tool'),
    MongooseModule.forFeature([
      { name: TestDocument.name, schema: TestSchema },
      { name: Account.name, schema: AccountSchema },
      { name: Scenario.name, schema: ScenarioSchema },
      { name: Log.name, schema: LogSchema },
    ]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'test-queue',
    }),
    BullModule.registerQueue({
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
    HttpModule,
  ],
  controllers: [AppController, LogController, AccountController, ScenarioController, StatsController, ScriptController],
  providers: [AppService, TestService, TestQueueProcessor, RedisTestService, EncryptionService, AccountService, ScenarioService, LoggingService, FarcasterService, ActionProcessor, ScenarioExecutionService, StatsService, ScriptExecutionService],
})
export class AppModule {}
