import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from './audit';

@Schema({ autoIndex: true })
export class UserGroupXref extends Audit {
  @Prop({ index: true })
  userId: string;

  @Prop()
  groupId: string;

  @Prop()
  isAdmin: boolean;
  
  @Prop()
  messageLastRead: Date;
}

export type UserGroupXrefDocument = UserGroupXref & Document;
export const UserGroupXrefSchema = SchemaFactory.createForClass(UserGroupXref);
