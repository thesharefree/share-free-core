import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from './audit';

@Schema()
export class GroupAnswer extends Audit {
  @Prop({
    required: true,
  })
  groupId: string;

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

export type GroupAnswerDocument = GroupAnswer & Document;
export const GroupAnswerSchema = SchemaFactory.createForClass(GroupAnswer);
