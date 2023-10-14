import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { GroupTopicXref, GroupTopicXrefDocument } from 'src/entities/group-topic-xref.entity';
import { TopicQueryXref, TopicQueryXrefDocument } from 'src/entities/topic-query-xref.entity';
import { Topic, TopicDocument } from 'src/entities/topic.entity';

@Injectable()
export class TopicService {
  constructor(
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(GroupTopicXref.name) private readonly groupTopicXrefModel: Model<GroupTopicXrefDocument>,
    @InjectModel(TopicQueryXref.name) private readonly topicQueryXrefModel: Model<TopicQueryXrefDocument>,
  ) {}

  public async getTopic(topicId: string): Promise<Topic> {
    const topic = await this.topicModel.findById(topicId);
    if (topic == null) {
      throw new HttpException('Invalid Topic', 400);
    }
    return topic;
  }

  public async getAllTopics(): Promise<Topic[]> {
    return await this.topicModel.find();
  }

  public async createTopic(topic: Topic, loggedInUser: string): Promise<Topic> {
    topic['_id'] = new mongoose.Types.ObjectId();
    topic.active = true;
    topic.createdBy = loggedInUser;
    topic.createdDate = new Date();
    topic.updatedBy = loggedInUser;
    topic.updatedDate = new Date();
    const createdTopic = new this.topicModel(topic);
    return await createdTopic.save();
  }

  public async toggleTopicById(
    topicId: string,
    loggedInUser: string,
  ): Promise<Topic> {
    const topic = await this.topicModel.findById(topicId);
    if (topic == null) {
      throw new HttpException('Invalid Topic', 400);
    }
    return await this.topicModel.findByIdAndUpdate(topicId, {
      active: !topic.active,
      updatedBy: loggedInUser,
      updatedDate: new Date(),
    });
  }

  public async deleteTopic(topicId: string): Promise<void> {
    const topic = await this.topicModel.findById(topicId);
    if (topic == null) {
      throw new HttpException('Invalid Topic', 400);
    }
    await this.topicQueryXrefModel.deleteMany({ topicId: topicId });
    await this.groupTopicXrefModel.deleteMany({ topicId: topicId });
    await this.topicModel.findOneAndDelete({
      _id: topicId,
    });
  }
}
