import { Audit } from './audit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Topic extends Audit {
  @Prop({
    required: [true, 'Topic Name is required'],
    unique: true,
    minlength: [4, 'Must be at least 4 characters'],
  })
  name: string;
}

export type TopicDocument = Topic & Document;
export const TopicSchema = SchemaFactory.createForClass(Topic);
