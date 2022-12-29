import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from './audit';

@Schema()
export class UserGroupActions extends Audit {
  @Prop()
  userId: string;

  @Prop()
  groupId: string;

  @Prop()
  pinned: boolean;

  @Prop()
  starred: boolean;

  @Prop()
  reported: boolean;

  @Prop()
  reportCategory: string;
}

export type UserGroupActionsDocument = UserGroupActions & Document;
export const UserGroupActionsSchema =
  SchemaFactory.createForClass(UserGroupActions);
