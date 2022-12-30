import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from 'src/entities/group.entity';
import { Topic, TopicDocument } from 'src/entities/topic.entity';
import { GroupTopicService } from './group-topic.service';

@Injectable()
export class GroupSearchService {
  constructor(
    @InjectModel(Topic.name) private readonly topicModel: Model<TopicDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
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
    const groups = searchedGroups.concat(searchedTopicGroups);
    const groupIds = groups.map((value) => value._id.toString());
    const uniqueGroups = groups.filter((group, pos) => {
      return groupIds.indexOf(group._id.toString()) == pos;
    });
    return uniqueGroups;
  }
}
