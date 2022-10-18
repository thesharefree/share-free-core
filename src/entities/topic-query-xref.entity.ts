import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from './audit';

@Schema()
export class TopicQueryXref extends Audit {
  @Prop()
  topicId: string;

  @Prop()
  queryId: string;
}

export type TopicQueryXrefDocument = TopicQueryXref & Document;
export const TopicQueryXrefSchema =
  SchemaFactory.createForClass(TopicQueryXref);
