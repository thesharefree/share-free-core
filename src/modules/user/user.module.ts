import { AzureStorageModule } from '@nestjs/azure-storage';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Group, GroupSchema } from 'src/entities/group.entity';
import { GroupView, GroupViewSchema } from 'src/entities/vw_group.entity';
import { House, HouseSchema } from 'src/entities/house.entity';
import { Query, QuerySchema } from 'src/entities/query.entity';
import {
  TopicQueryXref,
  TopicQueryXrefSchema,
} from 'src/entities/topic-query-xref.entity';
import { Topic, TopicSchema } from 'src/entities/topic.entity';
import { UserAnswer, UserAnswerSchema } from 'src/entities/user-answer.entity';
import {
  UserGroupXref,
  UserGroupXrefSchema,
} from 'src/entities/user-group-xref.entity';
import {
  UserTopicXref,
  UserTopicXrefSchema,
} from 'src/entities/user-topic-xref.entity';
import {
  UserGroupActions,
  UserGroupActionsSchema,
} from 'src/entities/user-group-actions.entity';
import { User, UserSchema } from 'src/entities/user.entity';
import { UserAnswerController } from './controllers/user-answer.controller';
import { UserGroupController } from './controllers/user-group.controller';
import { UserHouseController } from './controllers/user-house.controller';
import { UserTopicController } from './controllers/user-topic.controller';
import { UserController } from './controllers/user.controller';
import { UserAnswerService } from './services/user-answer.service';
import { UserGroupService } from './services/user-group.service';
import { UserHouseService } from './services/user-house.service';
import { UserTopicService } from './services/user-topic.service';
import { UserService } from './services/user.service';
import {
  GroupTopicXref,
  GroupTopicXrefSchema,
} from 'src/entities/group-topic-xref.entity';

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
    MongooseModule.forFeature([{ name: House.name, schema: HouseSchema }]),
    MongooseModule.forFeature([{ name: Group.name, schema: GroupSchema }]),
    MongooseModule.forFeature([{ name: GroupView.name, schema: GroupViewSchema }]),
    MongooseModule.forFeature([
      { name: TopicQueryXref.name, schema: TopicQueryXrefSchema },
    ]),
    MongooseModule.forFeature([
      { name: UserTopicXref.name, schema: UserTopicXrefSchema },
    ]),
    MongooseModule.forFeature([
      { name: UserGroupXref.name, schema: UserGroupXrefSchema },
    ]),
    MongooseModule.forFeature([
      { name: UserAnswer.name, schema: UserAnswerSchema },
    ]),
    MongooseModule.forFeature([
      { name: UserGroupActions.name, schema: UserGroupActionsSchema },
    ]),
    MongooseModule.forFeature([
      { name: GroupTopicXref.name, schema: GroupTopicXrefSchema },
    ]),
  ],
  controllers: [
    UserController,
    UserTopicController,
    UserAnswerController,
    UserGroupController,
    UserHouseController,
  ],
  providers: [
    UserService,
    UserTopicService,
    UserAnswerService,
    UserGroupService,
    UserHouseService,
  ],
})
export class UserModule {}
