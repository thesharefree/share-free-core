import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from './audit';

@Schema({ autoIndex: true })
export class UserSFPostActions extends Audit {
  @Prop()
  userId: string;

  @Prop({ index: true })
  sfpostId: string;

  @Prop()
  supported: boolean;

  @Prop()
  reported: boolean;

  @Prop()
  reportCategory: string;
}

export type UserSFPostActionsDocument = UserSFPostActions & Document;
export const UserSFPostActionsSchema = SchemaFactory.createForClass(UserSFPostActions);
