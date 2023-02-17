import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from 'src/entities/group.entity';
import { House, HouseDocument } from 'src/entities/house.entity';
import { Topic, TopicDocument } from 'src/entities/topic.entity';
import { GroupView, GroupViewDocument } from 'src/entities/vw_group.entity';

@Injectable()
export class GroupSearchService {
  constructor(
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(GroupView.name)
    private readonly groupViewModel: Model<GroupViewDocument>,
    @InjectModel(House.name) private readonly houseModel: Model<HouseDocument>,
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
    const groupIds = searchedGroups.map((group) => {
      return group._id.toString();
    });
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
    const uniqueGroups = await this.groupViewModel.aggregate([
      {
        $match: {
          $or: [
            {
              groupId: {
                $in: groupIds,
              },
            },
            {
              houseId: {
                $in: houseIds,
              },
            },
            {
              topicIds: {
                $in: topicIds,
              },
            },
          ],
        },
      },
      {
        $unset: ['userActions', 'topicIds'],
      },
    ]);
    return uniqueGroups;
  }
}
