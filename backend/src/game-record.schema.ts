import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum GameRecordStatus {
  UNUSED = 'Unused',
  USED = 'Used',
}

@Schema()
export class GameRecord {
  @Prop({ type: Types.ObjectId, ref: 'Account', required: true })
  accountId: Types.ObjectId;

  @Prop({ required: true })
  gameLabel: string;

  @Prop({ required: false })
  recordId?: string;

  @Prop({ required: false })
  gameId?: string;

  @Prop({ required: false })
  wallet?: string;

  @Prop({ required: false })
  signature?: string;

  @Prop({ required: false })
  points?: number;

  @Prop({ required: false })
  nonce?: number;

  @Prop({ enum: GameRecordStatus, default: GameRecordStatus.UNUSED })
  status: GameRecordStatus;

  @Prop({ type: Object })
  apiResponse: Record<string, unknown>;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const GameRecordSchema = SchemaFactory.createForClass(GameRecord);

// No unique indexes - all records are saved without duplicate checking


