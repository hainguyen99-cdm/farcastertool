import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ActionType } from './scenario.schema';

/**
 * Action is a subdocument within a Script representing a single step.
 */
@Schema()
export class ScriptAction {
  @Prop({ required: true, enum: ActionType })
  type: ActionType;

  @Prop({ type: Object })
  config: Record<string, unknown>;

  @Prop({ default: 0 })
  order: number;
}

const ScriptActionSchema = SchemaFactory.createForClass(ScriptAction);

/**
 * Script aggregates a set of Actions with execution preferences.
 */
@Schema()
export class Script {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [ScriptActionSchema] })
  actions: ScriptAction[];

  @Prop({ default: false })
  shuffle: boolean;

  @Prop({ default: 1 })
  loop: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const ScriptSchema = SchemaFactory.createForClass(Script);
