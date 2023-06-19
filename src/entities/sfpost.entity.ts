import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Location } from './location';
import { Topic } from './topic.entity';

@Schema()
export class SFPost extends Location {
  @Prop({
    required: [true, 'Content is required'],
    minlength: [50, 'Must be at least 50 characters'],
  })
  content: string;

  topics: Topic[];

  topicIds: string;

  supports: number;
}

export type SFPostDocument = SFPost & Document;
export const SFPostSchema = SchemaFactory.createForClass(SFPost);
