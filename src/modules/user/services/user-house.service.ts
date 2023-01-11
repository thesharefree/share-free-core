import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from 'src/entities/group.entity';
import { House, HouseDocument } from 'src/entities/house.entity';

@Injectable()
export class UserHouseService {
  constructor(
    @InjectModel(House.name) private readonly houseModel: Model<HouseDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
  ) {}

  public async getUserHouses(loggedInUser: string): Promise<House[]> {
    const houses = await this.houseModel.find({ owner: loggedInUser }).lean();
    const liveHouses = houses.filter((house) => !house.deleted);
    for(const house of liveHouses) {
      const groups = await this.groupModel.find({houseId: house._id}).count();
      house.groups = groups;
    }
    return liveHouses;
  }
}
