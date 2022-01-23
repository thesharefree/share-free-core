import { AzureStorageService, UploadedFileMetadata } from '@nestjs/azure-storage';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, User, UserDocument } from 'src/entities/user.entity';
import { defaultApp } from '../../../auth/firebaseAdmin';

@Injectable()
export class UserService {

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly azureStorage: AzureStorageService
  ) { }

  public async getUser(loggedInUser: string): Promise<User> {
    const user = await this.userModel.findOne({ email: loggedInUser });
    if (user == null) {
      throw new HttpException('Invalid User', 400);
    }
    return user;
  }

  public async createAdmin(user: User, loggedInUser: string): Promise<void> {
    const service = this;
    const userResp = await service.userModel.findOne({ email: user.email });
    if (userResp != null) {
      console.error('User already exists');
      throw new HttpException('User already exists', 400);
    } else {
      defaultApp.auth().createUser({
        email: user.email,
        emailVerified: false,
        password: 'password@123',
        displayName: user.name,
        disabled: false
      })
        .then(async function (userRecord) {
          console.log('User created in Firebase:', userRecord.uid);
          await service.register(user, loggedInUser);

        })
        .catch(function (error) {
          console.error('Error creating user in Firebase:', error);
        });
    }
  }

  public async register(user: User, loggedInUser: string): Promise<void> {
    const userResp = await this.userModel.findOne({ email: user.email });
    if (userResp != null) {
      throw new HttpException('User already exists', 400);
    } else {
      user['_id'] = null;
      user.active = true;
      user.createdBy = loggedInUser;
      user.createdDate = new Date();
      user.updatedBy = loggedInUser;
      user.updatedDate = new Date();
      const createdUser = new this.userModel(user);
      await createdUser.save();
      console.log('User registered successfully');
    }
  }

  public async update(user: User, loggedInUser: string): Promise<void> {
    const userResp = await this.userModel.findOne({ email: loggedInUser });
    await this.userModel.updateOne({ _id: userResp._id }, {
      name: user.name,
      email: user.email,
      phone: user.phone,
      sex: user.sex,
      intro: user.intro,
      latitude: user.latitude,
      longitude: user.longitude,
      city: user.city,
      province: user.province,
      country: user.country,
      updatedBy: loggedInUser,
      updatedDate: new Date()
    });
  }

  public async addRole(role: string, loggedInUser: string): Promise<void> {
    if (!Object.values(Role).includes(Role[role])) {
      throw new HttpException('Invalid role: ' + role, 400);
    }
    const userResp = await this.userModel.findOne({ email: loggedInUser });
    const userRoles = userResp.roles;
    if (userRoles.includes(Role[role])) {
      throw new HttpException('Role already assigned to the user: ' + role, 400);
    }
    userRoles.push(Role[role]);
    await this.userModel.updateOne({ _id: userResp._id }, {
      roles: userRoles,
      updatedBy: loggedInUser,
      updatedDate: new Date()
    });
  }

  public async updateRegistrationToken(registrationToken: string, loggedInUser: string): Promise<void> {
    const userResp = await this.userModel.findOne({ email: loggedInUser });
    await this.userModel.updateOne({ _id: userResp._id }, {
      registrationToken: registrationToken,
      updatedBy: loggedInUser,
      updatedDate: new Date()
    });
  }

  public async uploadPhoto(file: UploadedFileMetadata, loggedInUser: string): Promise<void> {
    const userResp = await this.userModel.findOne({ email: loggedInUser });
    const fileNameParts = file.originalname.split(".");
    const extension = fileNameParts[fileNameParts.length - 1];
    file = {
      ...file,
      originalname: 'users/images/' + userResp._id.toString() + '.' + extension,
    };
    const storageUrl = await this.azureStorage.upload(file);
    console.log(JSON.stringify(storageUrl));
    await this.userModel.updateOne({ _id: userResp._id }, {
      photoUrl: storageUrl,
      updatedBy: loggedInUser,
      updatedDate: new Date()
    });
  }

  public async getAllUsers(): Promise<User[]> {
    return await this.userModel.find();
  }

  public async getUserById(userId: string): Promise<User> {
    return await this.userModel.findById(userId);
  }

  public async toggleUserById(userId: string, loggedInUser: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (user == null) {
      throw new HttpException('Invalid User', 400);
    }
    await this.userModel.findByIdAndUpdate(userId, {
      active: !user.active,
      updatedBy: loggedInUser,
      updatedDate: new Date()
    });
  }

}
