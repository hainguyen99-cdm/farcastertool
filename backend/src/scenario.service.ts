import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Action, ActionType, Scenario } from './scenario.schema';

export interface CreateScenarioInput {
  readonly name: string;
  readonly actions?: Scenario['actions'];
  readonly shuffle?: boolean;
  readonly loop?: number;
}

export interface UpdateScenarioInput {
  readonly name?: string;
  readonly actions?: Scenario['actions'];
  readonly shuffle?: boolean;
  readonly loop?: number;
}

@Injectable()
export class ScenarioService {
  constructor(@InjectModel(Scenario.name) private readonly scenarioModel: Model<Scenario>) {}

  async createScenario(input: CreateScenarioInput): Promise<Scenario> {
    if (input.actions && input.actions.length > 0) {
      this.validateActions(input.actions);
    }
    const created = new this.scenarioModel({ ...input });
    return await created.save();
  }

  async getScenarios(): Promise<Scenario[]> {
    return await this.scenarioModel.find().sort({ createdAt: -1 }).lean();
  }

  async getScenarioById(id: string): Promise<Scenario> {
    const isValid = Types.ObjectId.isValid(id);
    if (!isValid) {
      throw new NotFoundException('Scenario not found');
    }
    const scenario = await this.scenarioModel.findById(id).lean();
    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }
    return scenario as unknown as Scenario;
  }

  async updateScenario(id: string, input: UpdateScenarioInput): Promise<Scenario> {
    const isValid = Types.ObjectId.isValid(id);
    if (!isValid) {
      throw new NotFoundException('Scenario not found');
    }
    if (input.actions && input.actions.length > 0) {
      this.validateActions(input.actions);
    }
    const updated = await this.scenarioModel
      .findByIdAndUpdate(
        id,
        { ...input, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
      .lean();
    if (!updated) {
      throw new NotFoundException('Scenario not found');
    }
    return updated as unknown as Scenario;
  }

  async deleteScenario(id: string): Promise<{ deleted: boolean }>{
    const isValid = Types.ObjectId.isValid(id);
    if (!isValid) {
      throw new NotFoundException('Scenario not found');
    }
    const res = await this.scenarioModel.findByIdAndDelete(id);
    if (!res) {
      throw new NotFoundException('Scenario not found');
    }
    return { deleted: true };
  }

  private validateActions(actions: Action[]): void {
    const errors: string[] = [];
    actions.forEach((action, index) => {
      if (!action || typeof action !== 'object') {
        errors.push(`Action at index ${index} must be an object.`);
        return;
      }
      if (!Object.values(ActionType).includes(action.type)) {
        errors.push(`Action at index ${index} has invalid type.`);
        return;
      }
      if (action.order !== undefined && (typeof action.order !== 'number' || Number.isNaN(action.order))) {
        errors.push(`Action at index ${index} has invalid order. It must be a number.`);
      }
      switch (action.type) {
        case ActionType.DELAY: {
          const config = action.config as Record<string, unknown> | undefined;
          const durationMs = config && (config['durationMs'] as number);
          if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs <= 0) {
            errors.push(`Action at index ${index} (Delay) requires a numeric 'durationMs' > 0.`);
          }
          break;
        }
        case ActionType.JOIN_CHANNEL: {
          const config = action.config as Record<string, unknown> | undefined;
          const channelKey = config && (config['channelKey'] as string);
          const inviteCode = config && (config['inviteCode'] as string);
          if (!channelKey || typeof channelKey !== 'string') {
            errors.push(`Action at index ${index} (JoinChannel) requires 'channelKey' (string).`);
          }
          if (!inviteCode || typeof inviteCode !== 'string') {
            errors.push(`Action at index ${index} (JoinChannel) requires 'inviteCode' (string).`);
          }
          break;
        }
        case ActionType.GET_FEED: {
          const config = action.config as Record<string, unknown> | undefined;
          if (config) {
            if ('feedKey' in config && typeof config['feedKey'] !== 'string') {
              errors.push(`Action at index ${index} (GetFeed) optional 'feedKey' must be a string.`);
            }
            if ('feedType' in config && typeof config['feedType'] !== 'string') {
              errors.push(`Action at index ${index} (GetFeed) optional 'feedType' must be a string.`);
            }
          }
          break;
        }
        case ActionType.LIKE_CAST: {
          const config = action.config as Record<string, unknown> | undefined;
          const likeMethod = config && (config['likeMethod'] as string);
          
          if (likeMethod === 'url') {
            const castUrl = config && (config['castUrl'] as string);
            if (!castUrl || typeof castUrl !== 'string') {
              errors.push(`Action at index ${index} (LikeCast) with URL method requires 'castUrl' (string).`);
            } else {
              // Basic URL validation for Farcaster URLs
              try {
                const url = new URL(castUrl);
                if (url.hostname !== 'farcaster.xyz' && url.hostname !== 'warpcast.com') {
                  errors.push(`Action at index ${index} (LikeCast) castUrl must be a valid Farcaster URL (farcaster.xyz or warpcast.com).`);
                }
                // Validate URL format: /username/0x...
                const pathParts = url.pathname.split('/');
                if (pathParts.length < 3 || !pathParts[2].startsWith('0x')) {
                  errors.push(`Action at index ${index} (LikeCast) castUrl must be in format: https://farcaster.xyz/username/0x...`);
                }
              } catch {
                errors.push(`Action at index ${index} (LikeCast) castUrl must be a valid URL.`);
              }
            }
          } else if (likeMethod && likeMethod !== 'random') {
            errors.push(`Action at index ${index} (LikeCast) has invalid likeMethod. Must be 'random' or 'url'.`);
          }
          // 'random' method is the default and requires no additional validation
          break;
        }
        case ActionType.RECAST_CAST: {
          const config = action.config as Record<string, unknown> | undefined;
          const recastMethod = config && (config['likeMethod'] as string);
          
          if (recastMethod === 'url') {
            const castUrl = config && (config['castUrl'] as string);
            if (!castUrl || typeof castUrl !== 'string') {
              errors.push(`Action at index ${index} (RecastCast) with URL method requires 'castUrl' (string).`);
            } else {
              // Basic URL validation for Farcaster URLs
              try {
                const url = new URL(castUrl);
                if (url.hostname !== 'farcaster.xyz' && url.hostname !== 'warpcast.com') {
                  errors.push(`Action at index ${index} (RecastCast) castUrl must be a valid Farcaster URL (farcaster.xyz or warpcast.com).`);
                }
                // Validate URL format: /username/0x...
                const pathParts = url.pathname.split('/');
                if (pathParts.length < 3 || !pathParts[2].startsWith('0x')) {
                  errors.push(`Action at index ${index} (RecastCast) castUrl must be in format: https://farcaster.xyz/username/0x...`);
                }
              } catch {
                errors.push(`Action at index ${index} (RecastCast) castUrl must be a valid URL.`);
              }
            }
          } else if (recastMethod && recastMethod !== 'random') {
            errors.push(`Action at index ${index} (RecastCast) has invalid likeMethod. Must be 'random' or 'url'.`);
          }
          // 'random' method is the default and requires no additional validation
          break;
        }
        case ActionType.PIN_MINI_APP: {
          const config = action.config as Record<string, unknown> | undefined;
          const domain = config && (config['domain'] as string);
          if (!domain || typeof domain !== 'string') {
            errors.push(`Action at index ${index} (PinMiniApp) requires 'domain' (string).`);
          }
          break;
        }
        case ActionType.FOLLOW_USER: {
          const config = action.config as Record<string, unknown> | undefined;
          const userLink = config && (config['userLink'] as string);
          if (!userLink || typeof userLink !== 'string') {
            errors.push(`Action at index ${index} (FollowUser) requires 'userLink' (string).`);
          } else {
            // Basic URL validation for Farcaster user URLs
            try {
              const url = new URL(userLink);
              if (url.hostname !== 'farcaster.xyz' && url.hostname !== 'warpcast.com') {
                errors.push(`Action at index ${index} (FollowUser) userLink must be a valid Farcaster URL (farcaster.xyz or warpcast.com).`);
              }
              // Validate URL format: /username
              const pathParts = url.pathname.split('/');
              if (pathParts.length < 2 || !pathParts[1]) {
                errors.push(`Action at index ${index} (FollowUser) userLink must be in format: https://farcaster.xyz/username`);
              }
            } catch {
              errors.push(`Action at index ${index} (FollowUser) userLink must be a valid URL.`);
            }
          }
          break;
        }
        default: {
          errors.push(`Action at index ${index} has unsupported type.`);
        }
      }
    });
    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Invalid actions', errors });
    }
  }

  async reorderActionsByIds(scenarioId: string, orderedActionIds: string[]): Promise<Scenario> {
    const isValid = Types.ObjectId.isValid(scenarioId);
    if (!isValid) {
      throw new NotFoundException('Scenario not found');
    }
    if (!Array.isArray(orderedActionIds) || orderedActionIds.length === 0) {
      throw new BadRequestException('orderedActionIds must be a non-empty array');
    }
    const scenario = await this.scenarioModel.findById(scenarioId);
    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }
    const idToAction = new Map<string, Action>();
    (scenario.actions || []).forEach(a => {
      // @ts-expect-error subdocument has _id in mongoose
      const key = String(a._id);
      idToAction.set(key, a as unknown as Action);
    });
    const reordered: Action[] = [];
    orderedActionIds.forEach((id, index) => {
      const act = idToAction.get(String(id));
      if (!act) {
        return;
      }
      act.order = index;
      reordered.push(act);
      idToAction.delete(String(id));
    });
    // Append any remaining actions that were not specified to preserve them at the end
    Array.from(idToAction.values()).forEach((act, idx) => {
      act.order = reordered.length + idx;
      reordered.push(act);
    });
    // Replace and save
    scenario.actions = reordered as unknown as Scenario['actions'];
    scenario.updatedAt = new Date();
    await scenario.save();
    return (await this.scenarioModel.findById(scenarioId).lean()) as unknown as Scenario;
  }

  async moveActionToIndex(scenarioId: string, actionId: string, toIndex: number): Promise<Scenario> {
    const isValid = Types.ObjectId.isValid(scenarioId);
    if (!isValid) {
      throw new NotFoundException('Scenario not found');
    }
    if (typeof toIndex !== 'number' || !Number.isFinite(toIndex) || toIndex < 0) {
      throw new BadRequestException('toIndex must be a non-negative number');
    }
    const scenario = await this.scenarioModel.findById(scenarioId);
    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }
    const actions = (scenario.actions || []) as unknown as Array<Action & { _id?: Types.ObjectId }>;
    const currentIndex = actions.findIndex(a => String(a._id) === String(actionId));
    if (currentIndex === -1) {
      throw new NotFoundException('Action not found in scenario');
    }
    const boundedIndex = Math.min(Math.max(0, Math.trunc(toIndex)), Math.max(0, actions.length - 1));
    const [moved] = actions.splice(currentIndex, 1);
    actions.splice(boundedIndex, 0, moved);
    actions.forEach((a, idx) => {
      a.order = idx;
    });
    scenario.actions = actions as unknown as Scenario['actions'];
    scenario.updatedAt = new Date();
    await scenario.save();
    return (await this.scenarioModel.findById(scenarioId).lean()) as unknown as Scenario;
  }

  async normalizeActionOrders(scenarioId: string): Promise<Scenario> {
    const isValid = Types.ObjectId.isValid(scenarioId);
    if (!isValid) {
      throw new NotFoundException('Scenario not found');
    }
    const scenario = await this.scenarioModel.findById(scenarioId);
    if (!scenario) {
      throw new NotFoundException('Scenario not found');
    }
    const actions = (scenario.actions || []) as unknown as Action[];
    actions
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((a, idx) => {
        a.order = idx;
      });
    scenario.actions = actions as unknown as Scenario['actions'];
    scenario.updatedAt = new Date();
    await scenario.save();
    return (await this.scenarioModel.findById(scenarioId).lean()) as unknown as Scenario;
  }
}


