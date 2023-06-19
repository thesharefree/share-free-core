import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from './audit';

@Schema({ autoIndex: true })
export class SFPostTopicXref extends Audit {
  @Prop({ index: true })
  sfpostId: string;

  @Prop()
  topicId: string;
}

export type SFPostTopicXrefDocument = SFPostTopicXref & Document;
export const SFPostTopicXrefSchema = SchemaFactory.createForClass(SFPostTopicXref);
