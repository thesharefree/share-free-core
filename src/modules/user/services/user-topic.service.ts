import { Injectable } from '@nestjs/common';
import { User, UserDocument } from 'src/entities/user.entity';
import { Topic, TopicDocument } from 'src/entities/topic.entity';
import {
  UserTopicXref,
  UserTopicXrefDocument,
} from 'src/entities/user-topic-xref.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UserTopicService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(UserTopicXref.name)
    private readonly userTopicXrefModel: Model<UserTopicXrefDocument>,
  ) {}

  public async assignTopics(
    topicIds: string,
    loggedInUser: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    await this.userTopicXrefModel.deleteMany({ userId: user._id });
    topicIds.split(',').forEach(async (topicId) => {
      const topic = await this.topicModel.findById(topicId);
      if (topic != null) {
        const xrefResp = await this.userTopicXrefModel.findOne({
          userId: user._id,
          topicId: topicId,
        });
        if (xrefResp == null) {
          const xref = this.newUserTopicXref(user._id, topicId, loggedInUser);
          const createdUserTopicXref = new this.userTopicXrefModel(xref);
          await createdUserTopicXref.save();
        }
      }
    });
    await this.userModel.findByIdAndUpdate(user._id, { onboarded: true });
  }

  private newUserTopicXref(
    userId: string,
    topicId: string,
    loggedInUser: string,
  ): UserTopicXref {
    const xref = new UserTopicXref();
    xref.userId = userId;
    xref.topicId = topicId;
    xref.active = true;
    xref.createdBy = loggedInUser;
    xref.createdDate = new Date();
    xref.updatedBy = loggedInUser;
    xref.updatedDate = new Date();
    return xref;
  }

  public async getUserTopics(loggedInUser: string): Promise<Topic[]> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const xrefResps = await this.userTopicXrefModel.find({ userId: user._id });
    const topicIds = xrefResps.map((xref) => {
      return xref.topicId;
    });
    return await this.topicModel.find().where('_id').in(topicIds);
  }
}
