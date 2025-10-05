import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ActionType } from './scenario.schema';

/**
 * Status values for a log entry representing the outcome of an action.
 */
export enum LogStatus {
  SUCCESS = 'Success',
  FAILURE = 'Failure',
  UNUSED = 'Unused',
}

/**
 * Log records the execution result of a specific action for an account within a scenario.
 */
@Schema()
export class Log {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Scenario', required: true })
  scenarioId: Types.ObjectId;

  @Prop({ required: true, enum: ActionType })
  actionType: ActionType;

  @Prop({ enum: LogStatus, required: true })
  status: LogStatus;

  @Prop()
  error: string;

  @Prop({ type: Object })
  result: Record<string, unknown>;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const LogSchema = SchemaFactory.createForClass(Log);


