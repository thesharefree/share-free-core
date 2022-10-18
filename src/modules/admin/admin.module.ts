import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Faq, FaqSchema } from 'src/entities/faq.entity';
import {
  GroupTopicXref,
  GroupTopicXrefSchema,
} from 'src/entities/group-topic-xref.entity';
import { Query, QuerySchema } from 'src/entities/query.entity';
import {
  TopicQueryXref,
  TopicQueryXrefSchema,
} from 'src/entities/topic-query-xref.entity';
import { Topic, TopicSchema } from 'src/entities/topic.entity';
import { User, UserSchema } from 'src/entities/user.entity';
import { QueryController } from './controllers/query.controller';
import { TopicQueryController } from './controllers/topic-query.controller';
import { TopicController } from './controllers/topic.controller';
import { QueryService } from './services/query.service';
import { TopicQueryService } from './services/topic-query.service';
import { TopicService } from './services/topic.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Faq.name, schema: FaqSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Topic.name, schema: TopicSchema }]),
    MongooseModule.forFeature([{ name: Query.name, schema: QuerySchema }]),
    MongooseModule.forFeature([
      { name: GroupTopicXref.name, schema: GroupTopicXrefSchema },
    ]),
    MongooseModule.forFeature([
      { name: TopicQueryXref.name, schema: TopicQueryXrefSchema },
    ]),
  ],
  controllers: [TopicController, QueryController, TopicQueryController],
  providers: [TopicService, QueryService, TopicQueryService],
})
export class AdminModule {}
