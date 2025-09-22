import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum AccountStatus {
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  ERROR = 'Error',
}

@Schema()
export class Account {
  @Prop({ required: true })
  name: string;
  
  @Prop({ required: true })
  encryptedToken: string;
  
  @Prop({ enum: AccountStatus, default: AccountStatus.ACTIVE })
  status: AccountStatus;
  
  @Prop()
  lastUsed: Date;
  
  @Prop()
  error: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);

