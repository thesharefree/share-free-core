import { HttpException, Injectable } from '@nestjs/common';
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
    if (topicIds.split(',').length > 5) {
      throw new HttpException('Please select a maximum of 5 topics', 400);
    }
    var isTopics = false;
    const topics = await this.topicModel
      .find()
      .where('_id')
      .in(topicIds.split(','));
    await this.userTopicXrefModel.deleteMany({ userId: user._id });
    for (const topic of topics) {
      isTopics = true;
      const xrefResp = await this.userTopicXrefModel.findOne({
        userId: user._id,
        topicId: topic._id.toString(),
      });
      if (xrefResp == null) {
        const xref = this.newUserTopicXref(
          user._id,
          topic._id.toString(),
          loggedInUser,
        );
        const createdUserTopicXref = new this.userTopicXrefModel(xref);
        await createdUserTopicXref.save();
      }
    }
    if (isTopics) {
      await this.userModel.findByIdAndUpdate(user._id, { onboarded: true });
    } else {
      await this.userModel.findByIdAndUpdate(user._id, { onboarded: false });
    }
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

  public async getUserTopicsByUserId(userId: string): Promise<Topic[]> {
    const xrefResps = await this.userTopicXrefModel.find({ userId: userId });
    const topicIds = xrefResps.map((xref) => {
      return xref.topicId;
    });
    return await this.topicModel.find().where('_id').in(topicIds);
  }
}
