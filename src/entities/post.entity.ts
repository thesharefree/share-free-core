import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Location } from './location';
import { Topic } from './topic.entity';
import { User } from './user.entity';
import { UserPostActions } from './user-post-actions.entity';

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

  likes: number;

  postedBy: User;

  myActions: UserPostActions[];
}

export type PostDocument = SFPost & Document;
export const PostSchema = SchemaFactory.createForClass(SFPost);
