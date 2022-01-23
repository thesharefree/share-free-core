import { AzureStorageModule } from '@nestjs/azure-storage';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupAnswer, GroupAnswerSchema } from 'src/entities/group-answer.entity';
import { GroupTopicXref, GroupTopicXrefSchema } from 'src/entities/group-topic-xref.entity';
import { Group, GroupSchema } from 'src/entities/group.entity';
import { Query, QuerySchema } from 'src/entities/query.entity';
import { TopicQueryXref, TopicQueryXrefSchema } from 'src/entities/topic-query-xref.entity';
import { Topic, TopicSchema } from 'src/entities/topic.entity';
import { UserGroupRequestXref, UserGroupRequestXrefSchema } from 'src/entities/user-group-request-xref.entity';
import { UserGroupXref, UserGroupXrefSchema } from 'src/entities/user-group-xref.entity';
import { User, UserSchema } from 'src/entities/user.entity';
import { MessageModule } from '../message/message.module';
import { GroupAnswerController } from './controllers/group-answer.controller';
import { GroupSearchController } from './controllers/group-search.controller';
import { GroupTopicController } from './controllers/group-topic.controller';
import { GroupUserController } from './controllers/group-user.controller';
import { GroupController } from './controllers/group.controller';
import { GroupAnswerService } from './services/group-answer.service';
import { GroupSearchService } from './services/group-search.service';
import { GroupTopicService } from './services/group-topic.service';
import { GroupUserService } from './services/group-user.service';
import { GroupService } from './services/group.service';

@Module({
    imports: [
        AzureStorageModule.withConfig({
            sasKey: process.env['AZURE_STORAGE_SAS_KEY'],
            accountName: process.env['AZURE_STORAGE_ACCOUNT'],
            containerName: process.env['AZURE_STORAGE_CONTAINER'],
        }),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        MongooseModule.forFeature([{ name: Topic.name, schema: TopicSchema }]),
        MongooseModule.forFeature([{ name: Query.name, schema: QuerySchema }]),
        MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
        MongooseModule.forFeature([{ name: GroupAnswer.name, schema: GroupAnswerSchema }]),
        MongooseModule.forFeature([{ name: TopicQueryXref.name, schema: TopicQueryXrefSchema }]),
        MongooseModule.forFeature([{ name: GroupTopicXref.name, schema: GroupTopicXrefSchema }]),
        MongooseModule.forFeature([{ name: UserGroupXref.name, schema: UserGroupXrefSchema }]),
        MongooseModule.forFeature([{ name: UserGroupRequestXref.name, schema: UserGroupRequestXrefSchema }]),
        MessageModule
    ],
    controllers: [
        GroupController,
        GroupTopicController,
        GroupAnswerController,
        GroupSearchController,
        GroupUserController
    ],
    providers: [
        GroupService,
        GroupTopicService,
        GroupAnswerService,
        GroupSearchService,
        GroupUserService
    ],
})
export class GroupModule { }