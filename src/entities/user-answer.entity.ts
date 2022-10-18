import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from './audit';

@Schema()
export class UserAnswer extends Audit {
  @Prop({
    required: true,
  })
  userId: string;

  @Prop({
    required: true,
  })
  queryId: string;

  @Prop({
    required: true,
  })
  answer: string;

  queryStr: string;
}

export type UserAnswerDocument = UserAnswer & Document;
export const UserAnswerSchema = SchemaFactory.createForClass(UserAnswer);
