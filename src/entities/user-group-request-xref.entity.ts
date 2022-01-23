import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';
import { Audit } from "./audit";

@Schema()
export class UserGroupRequestXref extends Audit {

    @Prop()
    userId: string;

    @Prop()
    groupId: string;
}

export type UserGroupRequestXrefDocument = UserGroupRequestXref & Document;
export const UserGroupRequestXrefSchema = SchemaFactory.createForClass(UserGroupRequestXref);