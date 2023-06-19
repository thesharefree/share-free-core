import { AzureStorageModule } from '@nestjs/azure-storage';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SFPost, SFPostSchema } from 'src/entities/sfpost.entity';
import { User, UserSchema } from 'src/entities/user.entity';
import { MessageModule } from '../message/message.module';
import { PostController } from './controllers/post.controller';
import { PostService } from './services/post.service';
import {
  UserSFPostActions,
  UserSFPostActionsSchema,
} from 'src/entities/user-sfpost-actions.entity';
import { Topic, TopicSchema } from 'src/entities/topic.entity';
import {
  SFPostTopicXref,
  SFPostTopicXrefSchema,
} from 'src/entities/sfpost-topic-xref.entity';

@Module({
  imports: [
    AzureStorageModule.withConfig({
      sasKey: process.env['AZURE_STORAGE_SAS_KEY'],
      accountName: process.env['AZURE_STORAGE_ACCOUNT'],
      containerName: process.env['AZURE_STORAGE_CONTAINER'],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: SFPost.name, schema: SFPostSchema }]),
    MongooseModule.forFeature([{ name: Topic.name, schema: TopicSchema }]),
    MongooseModule.forFeature([
      { name: SFPostTopicXref.name, schema: SFPostTopicXrefSchema },
    ]),
    MongooseModule.forFeature([
      { name: UserSFPostActions.name, schema: UserSFPostActionsSchema },
    ]),
    MessageModule,
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
