import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from './audit';

@Schema()
export class UserGroupInviteXref extends Audit {
  @Prop()
  userId: string;

  @Prop()
  groupId: string;
}

export type UserGroupInviteXrefDocument = UserGroupInviteXref & Document;
export const UserGroupInviteXrefSchema =
  SchemaFactory.createForClass(UserGroupInviteXref);
