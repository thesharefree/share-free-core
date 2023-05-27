import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Audit } from './audit';

enum OptionsType {
  SINGLE = 'SINGLE',
  MULTI = 'MULTI',
  NONE = ''
}

@Schema()
export class Query extends Audit {
  @Prop({
    required: [true, 'Query string is required'],
    unique: true,
    minlength: [6, 'Must be at least 6 characters'],
  })
  queryStr: string;

  @Prop({
    items: String,
    required: [true, 'target is required'],
  })
  target: string[];

  @Prop({
    items: String,
  })
  options?: string[];

  @Prop({
    enum: OptionsType,
  })
  optionType?: OptionsType;

  xref: boolean;
}

export type QueryDocument = Query & Document;
export const QuerySchema = SchemaFactory.createForClass(Query);
