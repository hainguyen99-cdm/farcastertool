import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum AccountStatus {
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  ERROR = 'Error',
}

@Schema({ _id: true })
export class PrivyToken {
  @Prop({ required: true })
  gameLabel: string;
  
  @Prop({ required: true })
  encryptedPrivyToken: string;
}

const PrivyTokenSchema = SchemaFactory.createForClass(PrivyToken);

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
  
  @Prop()
  walletAddress: string;
  
  @Prop()
  username: string;
  
  @Prop()
  fid: number;
  
  @Prop({ type: [PrivyTokenSchema], default: [] })
  privyTokens: PrivyToken[];
}

export const AccountSchema = SchemaFactory.createForClass(Account);

