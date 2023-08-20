import { Injectable, HttpException } from '@nestjs/common';
import { Group, GroupDocument } from 'src/entities/group.entity';
import { Topic, TopicDocument } from 'src/entities/topic.entity';
import {
  GroupTopicXref,
  GroupTopicXrefDocument,
} from 'src/entities/group-topic-xref.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GroupTopicService {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(GroupTopicXref.name)
    private readonly groupTopicXrefModel: Model<GroupTopicXrefDocument>,
  ) {}

  public async assignTopics(
    groupId: string,
    topicIds: string,
    loggedInUser: string,
  ): Promise<Topic[]> {
    const group = await this.groupModel.findById(groupId);
    if (group == null) {
      throw new HttpException('Invalid group', 400);
    }
    if (topicIds.split(',').length > 5) {
      throw new HttpException('Please select a maximum of 5 topics', 400);
    }
    await this.groupTopicXrefModel.deleteMany({ groupId: group._id });
    const topics = await this.topicModel
      .find()
      .where('_id')
      .in(topicIds.split(','));
    for (const topic of topics) {
      const xrefResp = await this.groupTopicXrefModel.findOne({
        groupId: group._id,
        topicId: topic._id.toString(),
      });
      if (xrefResp == null) {
        const xref = this.newGroupTopicXref(
          group._id,
          topic._id.toString(),
          loggedInUser,
        );
        const createdGroupTopicXref = new this.groupTopicXrefModel(xref);
        await createdGroupTopicXref.save();
      }
    }
    return await this.getGroupTopics(groupId);
  }

  private newGroupTopicXref(
    groupId: string,
    topicId: string,
    loggedInUser: string,
  ): GroupTopicXref {
    const xref = new GroupTopicXref();
    xref.groupId = groupId;
    xref.topicId = topicId;
    xref.active = true;
    xref.createdBy = loggedInUser;
    xref.createdDate = new Date();
    xref.updatedBy = loggedInUser;
    xref.updatedDate = new Date();
    return xref;
  }

  public async getGroupTopics(groupId: string): Promise<Topic[]> {
    const group = await this.groupModel.findById(groupId);
    if (group == null) {
      throw new HttpException('Invalid group', 400);
    } else {
      const xrefResps = await this.groupTopicXrefModel.find({
        groupId: group._id,
      });
      const topicIds = xrefResps.map((xref) => {
        return xref.topicId;
      });
      return await this.topicModel.find().where('_id').in(topicIds).lean();
    }
  }

  public async getTopicsGroups(topicIds: string[]): Promise<Group[]> {
    const xrefResps = await this.groupTopicXrefModel
      .find()
      .where('topicId')
      .in(topicIds);
    const groupIds = xrefResps.map((xref) => {
      return xref.groupId;
    });
    return await this.groupModel.find().where('_id').in(groupIds).lean();
  }
}
