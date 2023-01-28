import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  GroupTopicXref,
  GroupTopicXrefDocument,
} from 'src/entities/group-topic-xref.entity';
import { Group, GroupDocument } from 'src/entities/group.entity';
import { House, HouseDocument } from 'src/entities/house.entity';
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
    @InjectModel(House.name) private readonly houseModel: Model<HouseDocument>,
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
    const houseFind = [
      {
        $search: {
          index: 'house',
          text: {
            query: keywordsStr,
            path: {
              wildcard: '*',
            },
          },
        },
      },
    ];
    const searchedHouses = await this.houseModel.aggregate(houseFind);
    const houseIds = searchedHouses.map((house) => {
      return house._id.toString();
    });
    const searchedHouseGroups = await this.groupModel
      .find()
      .where('houseId')
      .in(houseIds);
    const groups = searchedGroups
      .concat(searchedTopicGroups)
      .concat(searchedHouseGroups)
      .filter((group) => !group.deleted);
    const groupIds = groups.map((value) => value._id.toString());
    const uniqueGroupIds = groups
      .filter((group, pos) => {
        return groupIds.indexOf(group._id.toString()) == pos;
      })
      .map((group) => group._id.toString());
    const uniqueGroups = await this.groupModel.aggregate([
      {
        $match: {
          deleted: {
            $ne: true,
          },
        },
      },
      {
        $addFields: {
          groupId: {
            $toString: '$_id',
          },
        },
      },
      {
        $match: {
          groupId: {
            $in: uniqueGroupIds,
          },
        },
      },
      {
        $lookup: {
          from: 'usergroupxrefs',
          localField: 'groupId',
          foreignField: 'groupId',
          as: 'userXrefs',
        },
      },
      {
        $addFields: {
          members: {
            $size: '$userXrefs',
          },
        },
      },
      {
        $lookup: {
          from: 'usergroupactions',
          localField: 'groupId',
          foreignField: 'groupId',
          as: 'userActions',
        },
      },
      {
        $addFields: {
          stars: {
            $size: {
              $filter: {
                input: '$userActions',
                cond: {
                  $eq: ['$$this.starred', true],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          reports: {
            $size: {
              $filter: {
                input: '$userActions',
                cond: {
                  $eq: ['$$this.reported', true],
                },
              },
            },
          },
        },
      },
      {
        $unset: ['userActions', 'userXrefs'],
      },
    ]);
    for (const group of uniqueGroups) {
      const topics = await this.groupTopicService.getGroupTopics(group._id);
      const topicNames = topics.map((topic) => topic.name);
      group.topics = topicNames;
    }
    return uniqueGroups;
  }
}
