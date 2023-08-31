import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { House } from './house.entity';
import { Location } from './location';
import { Topic } from './topic.entity';
import { UserGroupActions } from './user-group-actions.entity';

@Schema({ collection: 'vw_groups', autoCreate: false })
export class GroupView extends Location {
  @Prop()
  name: string;

  @Prop()
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

  @Prop()
  callStarted: Date;

  @Prop()
  callOffer: string;

  topics: Topic[];

  house: House;

  myActions: UserGroupActions[];

  stars: number;

  reports: number;
}

export type GroupViewDocument = GroupView & Document;
export const GroupViewSchema = SchemaFactory.createForClass(GroupView);
