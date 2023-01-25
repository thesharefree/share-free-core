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
    const groups = await this.groupModel.aggregate([
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
        $addFields: {
          userIds: {
            $map: {
              input: '$userXrefs',
              in: '$$this.userId',
            },
          },
        },
      },
      {
        $match: {
          $or: [
            {
              owner: loggedInUser,
            },
            {
              userIds: user._id.toString(),
            },
          ],
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
    ]);
    for (const group of groups) {
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
    return groups;
  }

  public async getUserActionedGroups(loggedInUser: string): Promise<Group[]> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const groups = await this.groupModel.aggregate([
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
        $lookup: {
          from: 'usergroupxrefs',
          localField: 'groupId',
          foreignField: 'groupId',
          as: 'userXrefs',
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
          members: {
            $size: '$userXrefs',
          },
        },
      },
      {
        $addFields: {
          actionUserIds: {
            $map: {
              input: '$userActions',
              in: '$$this.userId',
            },
          },
        },
      },
      {
        $match: {
          actionUserIds: user._id.toString(),
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
    ]);
    for (const group of groups) {
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
    return groups;
  }
}
