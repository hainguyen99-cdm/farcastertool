import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class TestDocument extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const TestSchema = SchemaFactory.createForClass(TestDocument);
