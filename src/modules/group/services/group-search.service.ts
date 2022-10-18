import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from 'src/entities/group.entity';
import {
  UserGroupXref,
  UserGroupXrefDocument,
} from 'src/entities/user-group-xref.entity';
import { User, UserDocument } from 'src/entities/user.entity';

@Injectable()
export class GroupSearchService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(UserGroupXref.name)
    private readonly userGroupXrefModel: Model<UserGroupXrefDocument>,
  ) {}

  public async searchGroups(loggedInUser: string): Promise<Group[]> {
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
    return await this.groupModel.find().where('_id').nin(groupIds);
  }
}
