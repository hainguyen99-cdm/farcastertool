import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/**
 * Action types supported within a Scenario.
 */
export enum ActionType {
  GET_FEED = 'GetFeed',
  LIKE_CAST = 'LikeCast',
  RECAST_CAST = 'RecastCast',
  DELAY = 'Delay',
  JOIN_CHANNEL = 'JoinChannel',
  PIN_MINI_APP = 'PinMiniApp',
}

/**
 * Configuration structure for an Action. Kept generic to allow type-specific validation elsewhere.
 */
export type ActionConfig = Record<string, unknown>;

/**
 * Action is a subdocument within a Scenario representing a single step.
 */
@Schema()
export class Action {
  @Prop({ required: true, enum: ActionType })
  type: ActionType;

  @Prop({ type: Object })
  config: ActionConfig;

  @Prop({ default: 0 })
  order: number;
}

const ActionSchema = SchemaFactory.createForClass(Action);

/**
 * Scenario aggregates a set of Actions with execution preferences.
 */
@Schema()
export class Scenario {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [ActionSchema] })
  actions: Action[];

  @Prop({ default: false })
  shuffle: boolean;

  @Prop({ default: 1 })
  loop: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ScenarioSchema = SchemaFactory.createForClass(Scenario);


