import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';
import { Audit } from "./audit";

@Schema()
export class UserTopicXref extends Audit {

    @Prop()
    userId: string;

    @Prop()
    topicId: string;
}

export type UserTopicXrefDocument = UserTopicXref & Document;
export const UserTopicXrefSchema = SchemaFactory.createForClass(UserTopicXref);