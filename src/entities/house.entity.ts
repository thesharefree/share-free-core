import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Location } from './location';

@Schema()
export class House extends Location {
  @Prop({
    required: [true, 'House Name is required'],
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

export type HouseDocument = House & Document;
export const HouseSchema = SchemaFactory.createForClass(House);
