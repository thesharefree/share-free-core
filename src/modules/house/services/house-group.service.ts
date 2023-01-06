import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from 'src/entities/group.entity';
import {
  House,
  HouseDocument,
} from 'src/entities/house.entity';

@Injectable()
export class HouseGroupService {
  constructor(
    @InjectModel(House.name)
    private readonly houseModel: Model<HouseDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
  ) {}

  public async getHouseGroups(houseId: string): Promise<Group[]> {
    const house = await this.houseModel.findById(houseId);
    if (house == null) {
      throw new HttpException('Invalid house', 400);
    } else {
      return await this.groupModel.find({ houseId: house._id });
    }
  }
}
