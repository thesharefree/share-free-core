import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Topic, TopicDocument } from 'src/entities/topic.entity';

@Injectable()
export class TopicService {

  constructor(
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
  ) { }

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

  public async createTopic(topic: Topic, loggedInUser: string): Promise<void> {
    topic['_id'] = null;
    topic.active = true;
    topic.createdBy = loggedInUser;
    topic.createdDate = new Date();
    topic.updatedBy = loggedInUser;
    topic.updatedDate = new Date();
    const createdTopic = new this.topicModel(topic);
    await createdTopic.save();
  }

  public async toggleTopicById(topicId: string, loggedInUser: string): Promise<Topic> {
    const topic = await this.topicModel.findById(topicId);
    if (topic == null) {
      throw new HttpException('Invalid Topic', 400);
    }
    return await this.topicModel.findByIdAndUpdate(topicId, {
      active: !topic.active,
      updatedBy: loggedInUser,
      updatedDate: new Date()
    });
  }
}
