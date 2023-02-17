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
import { GroupView, GroupViewDocument } from 'src/entities/vw_group.entity';

@Injectable()
export class UserGroupService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(GroupTopicXref.name)
    private readonly groupTopicXrefModel: Model<GroupTopicXrefDocument>,
    @InjectModel(GroupView.name)
    private readonly groupViewModel: Model<GroupViewDocument>,
    @InjectModel(UserGroupActions.name)
    private readonly userGroupActionsModel: Model<UserGroupActionsDocument>,
  ) {}

  public async getUserGroups(loggedInUser: string): Promise<Group[]> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    return await this.groupViewModel.aggregate([
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
        $unset: ['userActions', 'topicIds'],
      },
    ]);
  }

  public async getUserActionedGroups(loggedInUser: string): Promise<Group[]> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    return await this.groupViewModel.aggregate([
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
          myActions: {
            $filter: {
              input: '$userActions',
              cond: {
                $eq: ['$$this.userId', user._id.toString()],
              },
            },
          },
        },
      },
      {
        $unset: ['userActions', 'actionUserIds', 'topicIds'],
      },
    ]);
  }
}
