import { Injectable } from '@nestjs/common';
import { User, UserDocument } from 'src/entities/user.entity';
import { Group, GroupDocument } from 'src/entities/group.entity';
import {
  UserGroupXref,
  UserGroupXrefDocument,
} from 'src/entities/user-group-xref.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserGroupActions,
  UserGroupActionsDocument,
} from 'src/entities/user-group-actions.entity';
import { Topic, TopicDocument } from 'src/entities/topic.entity';
import {
  GroupTopicXref,
  GroupTopicXrefDocument,
} from 'src/entities/group-topic-xref.entity';

@Injectable()
export class UserGroupService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(GroupTopicXref.name)
    private readonly groupTopicXrefModel: Model<GroupTopicXrefDocument>,
    @InjectModel(UserGroupXref.name)
    private readonly userGroupXrefModel: Model<UserGroupXrefDocument>,
    @InjectModel(UserGroupActions.name)
    private readonly userGroupActionsModel: Model<UserGroupActionsDocument>,
  ) {}

  public async getUserGroups(loggedInUser: string): Promise<Group[]> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const userGroups = await this.groupModel.find({ owner: loggedInUser });
    const myGroupIds = userGroups.map((group) => {
      return group._id;
    });
    const xrefResps = await this.userGroupXrefModel.find({ userId: user._id });
    const joinedGroupIds = xrefResps.map((xref) => {
      return xref.groupId;
    });
    const groupIds = myGroupIds.concat(joinedGroupIds);
    const groups = await this.groupModel
      .find()
      .where('_id')
      .in(groupIds)
      .lean();
    const liveGroups = groups.filter((group) => !group.deleted);
    for (const group of liveGroups) {
      const users = await this.userGroupXrefModel
        .find({ groupId: group._id })
        .count();
      group.users = users;
      const userActions = await this.userGroupActionsModel.find({
        groupId: group._id,
      });
      group.stars = userActions.filter((action) => action.starred).length;
      group.reports = userActions.filter((action) => action.reported).length;
      const xrefResps = await this.groupTopicXrefModel.find({
        groupId: group._id,
      });
      const topicIds = xrefResps.map((xref) => {
        return xref.topicId;
      });
      const topics = await this.topicModel.find().where('_id').in(topicIds);
      const topicNames = topics.map((topic) => topic.name);
      group.topics = topicNames;
    }
    return liveGroups;
  }

  public async getUserActionedGroups(loggedInUser: string): Promise<Group[]> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const userActions = await this.userGroupActionsModel
      .find({
        userId: user._id,
      })
      .lean();
    const groupIds = userActions.map((action) => {
      return action.groupId;
    });
    const groups = await this.groupModel
      .find()
      .where('_id')
      .in(groupIds)
      .lean();
    const liveGroups = groups.filter((group) => !group.deleted);
    for (const group of liveGroups) {
      group.userActions = userActions.find(
        (action) => action.groupId.toString() === group._id.toString(),
      );
      const users = await this.userGroupXrefModel
        .find({ groupId: group._id })
        .count();
      group.users = users;
      const actions = await this.userGroupActionsModel.find({
        groupId: group._id,
      });
      group.stars = actions.filter((action) => action.starred).length;
      group.reports = actions.filter((action) => action.reported).length;
      const xrefResps = await this.groupTopicXrefModel.find({
        groupId: group._id,
      });
      const topicIds = xrefResps.map((xref) => {
        return xref.topicId;
      });
      const topics = await this.topicModel.find().where('_id').in(topicIds);
      const topicNames = topics.map((topic) => topic.name);
      group.topics = topicNames;
    }
    return liveGroups;
  }
}
