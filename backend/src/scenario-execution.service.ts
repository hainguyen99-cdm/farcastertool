import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Scenario } from './scenario.schema';
import { Account } from './account.schema';

interface ExecuteScenarioResult {
  accountId: string;
  loopsRun: number;
}

@Injectable()
export class ScenarioExecutionService {
  constructor(
    @InjectQueue('actions') private readonly actionsQueue: Queue,
    @InjectModel(Scenario.name) private readonly scenarioModel: Model<Scenario>,
    @InjectModel(Account.name) private readonly accountModel: Model<Account>,
  ) {}

  async executeScenario(scenarioId: string, accountIds: string[]): Promise<ExecuteScenarioResult[]> {
    const scenario = await this.scenarioModel.findById(new Types.ObjectId(scenarioId)).exec();
    if (!scenario) {
      throw new Error('Scenario not found');
    }
    const accounts = await this.accountModel
      .find({ _id: { $in: accountIds.map((id) => new Types.ObjectId(id)) } })
      .exec();
    const results: ExecuteScenarioResult[] = [];
    for (const account of accounts) {
      let actions = [...(scenario.actions || [])];
      if (scenario.shuffle) {
        actions = this.shuffleArray(actions);
      }
      actions.sort((a, b) => a.order - b.order);
      for (let loop = 0; loop < (scenario.loop || 1); loop++) {
        let previousResults: Record<string, unknown> = {};
        for (const action of actions) {
          const job = await this.actionsQueue.add({
            accountId: account._id.toString(),
            scenarioId: scenario._id.toString(),
            action,
            encryptedToken: account.encryptedToken,
            previousResults,
          }, {
            // Allow per-action overrides; fall back to defaults from queue
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: true,
            removeOnFail: true,
            delay: typeof (action.config as Record<string, unknown>)?.['delayBeforeMs'] === 'number'
              ? (action.config as Record<string, unknown>)['delayBeforeMs'] as number
              : 0,
          });
          const result = (await job.finished()) as Record<string, unknown>;
          previousResults = result;
        }
      }
      results.push({ accountId: account._id.toString(), loopsRun: scenario.loop || 1 });
    }
    return results;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}


