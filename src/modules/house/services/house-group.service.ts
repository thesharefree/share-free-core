import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from 'src/entities/group.entity';
import { House, HouseDocument } from 'src/entities/house.entity';
import { GroupView, GroupViewDocument } from 'src/entities/vw_group.entity';

@Injectable()
export class HouseGroupService {
  constructor(
    @InjectModel(House.name)
    private readonly houseModel: Model<HouseDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(GroupView.name)
    private readonly groupViewModel: Model<GroupViewDocument>,
  ) {}

  public async getHouseGroups(houseId: string): Promise<GroupView[]> {
    const house = await this.houseModel.findById(houseId);
    if (house == null) {
      throw new HttpException('Invalid house', 400);
    } else {
      return await this.groupViewModel.find({
        houseId: houseId,
        deleted: { $ne: true },
      });
    }
  }

  public async updateGroupsOfDeletedHouse(
    houseId: string,
    loggedInUser: string,
  ): Promise<void> {
    const groups = await this.groupModel.find({ houseId: houseId });
    for (const group of groups) {
      await this.groupModel.updateOne(
        { _id: group._id },
        {
          houseId: null,
          updatedBy: loggedInUser,
          updatedDate: new Date(),
        },
      );
    }
  }
}
