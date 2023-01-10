import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { House, HouseDocument } from 'src/entities/house.entity';

@Injectable()
export class UserHouseService {
  constructor(
    @InjectModel(House.name)
    private readonly houseModel: Model<HouseDocument>,
  ) {}

  public async getUserHouses(loggedInUser: string): Promise<House[]> {
    const houses = await this.houseModel.find({ owner: loggedInUser });
    return houses.filter((house) => !house.deleted);
  }
}
