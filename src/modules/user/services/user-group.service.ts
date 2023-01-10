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

@Injectable()
export class UserGroupService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
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
    const groups = await this.groupModel.find().where('_id').in(groupIds);
    const liveGroups = groups.filter((group) => !group.deleted);
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
    groups.forEach((group) => {
      group.userActions = userActions.find(
        (action) => action.groupId.toString() === group._id.toString(),
      );
    });
    const liveGroups = groups.filter((group) => !group.deleted);
    return liveGroups;
    return liveGroups;
  }
}
