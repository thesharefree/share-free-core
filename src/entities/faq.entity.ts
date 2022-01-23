import { Audit } from "./audit";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';

@Schema()
export class Faq extends Audit {

    @Prop({
        required: [true, 'Question is required'],
        unique: true,
        minlength: [6, 'Must be at least 6 characters'],
    })
    question: string;

    @Prop({
        required: [true, 'Answer is required'],
        unique: true,
        minlength: [3, 'Must be at least 6 characters'],
    })
    answer: string;
}

export type FaqDocument = Faq & Document;
export const FaqSchema = SchemaFactory.createForClass(Faq);