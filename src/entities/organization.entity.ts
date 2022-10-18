import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Location } from './location';

@Schema()
export class Organization extends Location {
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
  description: string;

  @Prop()
  banner: string;
}

export type OrganizationDocument = Organization & Document;
export const OrganizationSchema = SchemaFactory.createForClass(Organization);
