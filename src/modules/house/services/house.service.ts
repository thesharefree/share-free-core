import {
  AzureStorageService,
  UploadedFileMetadata,
} from '@nestjs/azure-storage';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  House,
  HouseDocument,
} from 'src/entities/house.entity';
import { Role, User, UserDocument } from 'src/entities/user.entity';

@Injectable()
export class HouseService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(House.name)
    private readonly houseModel: Model<HouseDocument>,
    private readonly azureStorage: AzureStorageService,
  ) {}

  public async getAllHouses(): Promise<House[]> {
    return await this.houseModel.find();
  }

  public async getHouse(houseId: string): Promise<House> {
    const house = await this.houseModel.findById(houseId);
    if (house == null) {
      throw new HttpException('Invalid House', 400);
    }
    return house;
  }

  public async createHouse(
    house: House,
    loggedInUser: string,
  ): Promise<House> {
    const owner = this.userModel.findOne({ email: house.owner });
    if (owner == null) {
      throw new HttpException('Invalid Owner', 400);
    }
    house['_id'] = null;
    house.active = true;
    house.createdBy = loggedInUser;
    house.createdDate = new Date();
    house.updatedBy = loggedInUser;
    house.updatedDate = new Date();
    const createdHouse = new this.houseModel(house);
    const newHouse = await createdHouse.save();
    return newHouse;
  }

  public async updateHouse(
    houseId: string,
    house: House,
    loggedInUser: User,
  ): Promise<void> {
    const extHouse = await this.houseModel.findById(
      houseId,
    );
    if (extHouse == null) {
      throw new HttpException('Invalid House', 400);
    }
    if (
      extHouse.owner !== loggedInUser.email &&
      !loggedInUser.roles.includes(Role.ADMIN)
    ) {
      throw new HttpException("You don't own this House", 400);
    }
    await this.houseModel.updateOne(
      { _id: houseId },
      {
        name: house.name,
        description: house.description,
        latitude: house.latitude,
        longitude: house.longitude,
        city: house.city,
        province: house.province,
        country: house.country,
        updatedBy: loggedInUser.email,
        updatedDate: new Date(),
      },
    );
  }

  public async uploadBanner(
    file: UploadedFileMetadata,
    houseId: string,
    loggedInUser: User,
  ): Promise<void> {
    const extHouse = await this.houseModel.findById(
      houseId,
    );
    if (
      extHouse.owner !== loggedInUser.email &&
      !loggedInUser.roles.includes(Role.ADMIN)
    ) {
      throw new HttpException("You don't own this House", 400);
    }
    const fileNameParts = file.originalname.split('.');
    const extension = fileNameParts[fileNameParts.length - 1];
    file = {
      ...file,
      originalname:
        'house/images/' + extHouse._id.toString() + '.' + extension,
    };
    const storageUrl = await this.azureStorage.upload(file);
    console.log(JSON.stringify(storageUrl));
    await this.houseModel.updateOne(
      { _id: extHouse._id },
      {
        banner: storageUrl,
        updatedBy: loggedInUser.email,
        updatedDate: new Date(),
      },
    );
  }

  public async toggle(
    houseId: string,
    loggedInUser: User,
  ): Promise<void> {
    const extHouse = await this.houseModel.findById(
      houseId,
    );
    if (extHouse == null) {
      throw new HttpException('Invalid House', 400);
    }
    if (
      extHouse.owner !== loggedInUser.email &&
      !loggedInUser.roles.includes(Role.ADMIN)
    ) {
      throw new HttpException("You don't own this House", 400);
    }
    await this.houseModel.updateOne(
      { _id: houseId },
      {
        active: !extHouse.active,
        updatedBy: loggedInUser.email,
        updatedDate: new Date(),
      },
    );
  }

  public async delete(
    houseId: string,
    loggedInUser: User,
  ): Promise<void> {
    const extHouse = await this.houseModel.findById(
      houseId,
    );
    if (extHouse == null) {
      throw new HttpException('Invalid House', 400);
    }
    if (
      extHouse.owner !== loggedInUser.email &&
      !loggedInUser.roles.includes(Role.ADMIN)
    ) {
      throw new HttpException("You don't own this House", 400);
    }
    await this.houseModel.updateOne(
      { _id: houseId },
      {
        deleted: !extHouse.deleted,
        updatedBy: loggedInUser.email,
        updatedDate: new Date(),
      },
    );
  }

  public async report(
    houseId: string,
    category: string,
    loggedInUser: string,
  ): Promise<void> {
    const extHouse = await this.houseModel.findById(
      houseId,
    );
    if (extHouse == null) {
      throw new HttpException('Invalid House', 400);
    }
    // create house report created by loggedInUser
  }
}
