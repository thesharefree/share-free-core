import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { House, HouseDocument } from 'src/entities/house.entity';

@Injectable()
export class UserHouseService {
  constructor(
    @InjectModel(House.name) private readonly houseModel: Model<HouseDocument>,
  ) {}

  public async getUserHouses(loggedInUser: string): Promise<House[]> {
    const houses = await this.houseModel.aggregate([
      {
        $match: {
          deleted: {
            $ne: true,
          },
        },
      },
      {
        $addFields: {
          houseId: {
            $toString: '$_id',
          },
        },
      },
      {
        $match: {
          owner: loggedInUser,
        },
      },
      {
        $lookup: {
          from: 'groups',
          localField: 'houseId',
          foreignField: 'houseId',
          as: 'houseGroups',
        },
      },
      {
        $addFields: {
          groups: {
            $size: {
              $filter: {
                input: '$houseGroups',
                cond: {
                  $eq: ['$$this.deleted', false],
                },
              },
            },
          },
        },
      },
      {
        $unset: ['houseGroups'],
      },
    ]);
    return houses;
  }
}
