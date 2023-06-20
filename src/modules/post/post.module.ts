import { AzureStorageModule } from '@nestjs/azure-storage';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SFPost, PostSchema } from 'src/entities/post.entity';
import { User, UserSchema } from 'src/entities/user.entity';
import { MessageModule } from '../message/message.module';
import { PostController } from './controllers/post.controller';
import { PostService } from './services/post.service';
import {
  UserPostActions,
  UserPostActionsSchema,
} from 'src/entities/user-post-actions.entity';
import { Topic, TopicSchema } from 'src/entities/topic.entity';
import {
  PostTopicXref,
  PostTopicXrefSchema,
} from 'src/entities/post-topic-xref.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    AzureStorageModule.withConfig({
      sasKey: process.env['AZURE_STORAGE_SAS_KEY'],
      accountName: process.env['AZURE_STORAGE_ACCOUNT'],
      containerName: process.env['AZURE_STORAGE_CONTAINER'],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: SFPost.name, schema: PostSchema }]),
    MongooseModule.forFeature([{ name: Topic.name, schema: TopicSchema }]),
    MongooseModule.forFeature([
      { name: PostTopicXref.name, schema: PostTopicXrefSchema },
    ]),
    MongooseModule.forFeature([
      { name: UserPostActions.name, schema: UserPostActionsSchema },
    ]),
    MessageModule,
    UserModule,
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
