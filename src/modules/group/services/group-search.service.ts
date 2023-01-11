import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GroupTopicXref,
  GroupTopicXrefDocument,
} from 'src/entities/group-topic-xref.entity';
import { Group, GroupDocument } from 'src/entities/group.entity';
import { Topic, TopicDocument } from 'src/entities/topic.entity';
import {
  UserGroupActions,
  UserGroupActionsDocument,
} from 'src/entities/user-group-actions.entity';
import {
  UserGroupXref,
  UserGroupXrefDocument,
} from 'src/entities/user-group-xref.entity';
import { GroupTopicService } from './group-topic.service';

@Injectable()
export class GroupSearchService {
  constructor(
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(UserGroupXref.name)
    private readonly userGroupXrefModel: Model<UserGroupXrefDocument>,
    @InjectModel(UserGroupActions.name)
    private readonly userGroupActionsModel: Model<UserGroupActionsDocument>,
    private readonly groupTopicService: GroupTopicService,
  ) {}

  public async searchGroups(keywordsStr: string): Promise<Group[]> {
    const groupFind = [
      {
        $search: {
          index: 'group',
          text: {
            query: keywordsStr,
            path: {
              wildcard: '*',
            },
          },
        },
      },
    ];
    const searchedGroups = await this.groupModel.aggregate(groupFind);
    const topicFind = [
      {
        $search: {
          index: 'topic',
          text: {
            query: keywordsStr,
            path: {
              wildcard: '*',
            },
          },
        },
      },
    ];
    const searchedTopics = await this.topicModel.aggregate(topicFind);
    const topicIds = searchedTopics.map((topic) => {
      return topic._id.toString();
    });
    const searchedTopicGroups = await this.groupTopicService.getTopicsGroups(
      topicIds,
    );
    const groups = searchedGroups
      .concat(searchedTopicGroups)
      .filter((group) => !group.deleted);
    const groupIds = groups.map((value) => value._id.toString());
    const uniqueGroupIds = groups.filter((group, pos) => {
      return groupIds.indexOf(group._id.toString()) == pos;
    }).map(group => group._id);
    const uniqueGroups = await this.groupModel.find().where('_id').in(uniqueGroupIds).lean();
    for (const group of uniqueGroups) {
      const users = await this.userGroupXrefModel
        .find({ groupId: group._id })
        .count();
      group.users = users;
      const userActions = await this.userGroupActionsModel.find({
        groupId: group._id,
      });
      group.stars = userActions.filter((action) => action.starred).length;
      group.reports = userActions.filter((action) => action.reported).length;
      const topics = await this.groupTopicService.getGroupTopics(
        group._id,
      );
      const topicNames = topics.map((topic) => topic.name);
      group.topics = topicNames;
    }
    return uniqueGroups;
  }
}
