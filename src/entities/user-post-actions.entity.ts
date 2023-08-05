import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from './audit';

@Schema({ autoIndex: true })
export class UserPostActions extends Audit {
  @Prop()
  userId: string;

  @Prop({ index: true })
  postId: string;

  @Prop()
  supported: boolean;

  @Prop()
  reported: boolean;

  @Prop()
  reportCategory: string;
}

export type UserPostActionsDocument = UserPostActions & Document;
export const UserPostActionsSchema = SchemaFactory.createForClass(UserPostActions);
