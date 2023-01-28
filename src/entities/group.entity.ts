import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Location } from './location';
import { UserGroupActions } from './user-group-actions.entity';

@Schema()
export class Group extends Location {
  @Prop({
    required: [true, 'Group Name is required'],
    minlength: [6, 'Must be at least 6 characters'],
  })
  name: string;

  @Prop({
    required: true,
  })
  owner: string;

  @Prop()
  houseId: string;

  @Prop()
  description: string;

  @Prop()
  banner: string;

  @Prop()
  languages: string[];

  @Prop()
  scheduleType: string;

  @Prop()
  scheduleDays: string[];

  @Prop()
  scheduleHour: number;

  @Prop()
  scheduleMinute: number;

  @Prop()
  scheduleTimezone: string;

  @Prop()
  callInProgress: boolean;

  myActions: UserGroupActions;

  members: number;

  stars: number;

  reports: number;

  topics: string[];
}

export type GroupDocument = Group & Document;
export const GroupSchema = SchemaFactory.createForClass(Group);
