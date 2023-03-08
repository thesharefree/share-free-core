import { Injectable } from '@nestjs/common';
import { User, UserDocument } from 'src/entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserGroupActions,
  UserGroupActionsDocument,
} from 'src/entities/user-group-actions.entity';
import { GroupView, GroupViewDocument } from 'src/entities/vw_group.entity';
import {
  UserGroupInviteXref,
  UserGroupInviteXrefDocument,
} from 'src/entities/user-group-invite-xref.entity';

@Injectable()
export class UserGroupService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(GroupView.name)
    private readonly groupViewModel: Model<GroupViewDocument>,
    @InjectModel(UserGroupActions.name)
    private readonly userGroupActionsModel: Model<UserGroupActionsDocument>,
    @InjectModel(UserGroupInviteXref.name)
    private readonly userGroupInviteXrefModel: Model<UserGroupInviteXrefDocument>,
  ) {}

  public async getUserGroups(loggedInUser: string): Promise<GroupView[]> {
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

  public async getUserActionedGroups(loggedInUser: string): Promise<GroupView[]> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const userActions = await this.userGroupActionsModel.find({
      userId: user._id,
    });
    const groupIds = userActions.map((xref) => {
      return xref['_id'].toString();
    });
    return await this.groupViewModel.aggregate([
      {
        $match: {
          groupId: {
            $in: groupIds,
          },
        },
      },
      {
        $unset: ['userActions', 'topicIds'],
      },
    ]);
  }

  public async getUserInvitedGroups(loggedInUser: string): Promise<GroupView[]> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    const userInviteXrefs = await this.userGroupInviteXrefModel.find({
      userId: user._id,
    });
    const groupIds = userInviteXrefs.map((xref) => {
      return xref['_id'].toString();
    });
    return await this.groupViewModel.aggregate([
      {
        $match: {
          groupId: {
            $in: groupIds,
          },
        },
      },
      {
        $unset: ['userActions', 'topicIds'],
      },
    ]);
  }
}
