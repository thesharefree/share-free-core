import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';
import { Audit } from "./audit";

@Schema()
export class GroupTopicXref extends Audit {

    @Prop()
    groupId: string;

    @Prop()
    topicId: string;
}

export type GroupTopicXrefDocument = GroupTopicXref & Document;
export const GroupTopicXrefSchema = SchemaFactory.createForClass(GroupTopicXref);