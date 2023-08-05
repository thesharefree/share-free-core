import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from './audit';

@Schema({ autoIndex: true })
export class PostTopicXref extends Audit {
  @Prop({ index: true })
  postId: string;

  @Prop()
  topicId: string;
}

export type PostTopicXrefDocument = PostTopicXref & Document;
export const PostTopicXrefSchema = SchemaFactory.createForClass(PostTopicXref);
