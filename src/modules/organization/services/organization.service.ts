import { AzureStorageService, UploadedFileMetadata } from '@nestjs/azure-storage';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Organization, OrganizationDocument } from 'src/entities/organization.entity';
import { User, UserDocument } from 'src/entities/user.entity';

@Injectable()
export class OrganizationService {

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Organization.name) private readonly organizationModel: Model<OrganizationDocument>,
    private readonly azureStorage: AzureStorageService
  ) { }

  public async getAllOrganizations(): Promise<Organization[]> {
    return await this.organizationModel.find();
  }

  public async getOrganization(organizationId: string): Promise<Organization> {
    const organization = await this.organizationModel.findById(organizationId);
    if (organization == null) {
      throw new HttpException('Invalid Organization', 400);
    }
    return organization;
  }

  public async createOrganization(organization: Organization, loggedInUser: string): Promise<Organization> {
    const owner = this.userModel.findOne({ email: organization.owner });
    if (owner == null) {
      throw new HttpException('Invalid Owner', 400);
    }
    organization['_id'] = null;
    organization.active = true;
    organization.createdBy = loggedInUser;
    organization.createdDate = new Date();
    organization.updatedBy = loggedInUser;
    organization.updatedDate = new Date();
    const createdOrganization = new this.organizationModel(organization);
    const newOrganization = await createdOrganization.save();
    return newOrganization;
  }

  public async updateOrganization(organizationId: string, organization: Organization, loggedInUser: string): Promise<void> {
    const extOrganization = await this.organizationModel.findById(organizationId);
    if (extOrganization == null) {
      throw new HttpException('Invalid Organization', 400);
    }
    if (extOrganization.owner !== loggedInUser) {
      throw new HttpException('You don\'t own this Organization', 400);
    }
    await this.organizationModel.updateOne({ _id: organizationId }, {
      name: organization.name,
      description: organization.description,
      latitude: organization.latitude,
      longitude: organization.longitude,
      city: organization.city,
      province: organization.province,
      country: organization.country,
      updatedBy: loggedInUser,
      updatedDate: new Date()
    });
  }

  public async uploadBanner(file: UploadedFileMetadata, organizationId: string, loggedInUser: string): Promise<void> {
    const extOrganization = await this.organizationModel.findById(organizationId);
    if (extOrganization.owner !== loggedInUser) {
      throw new HttpException('You don\'t own this Organization', 400);
    }
    const fileNameParts = file.originalname.split(".");
    const extension = fileNameParts[fileNameParts.length - 1];
    file = {
      ...file,
      originalname: 'org/images/' + extOrganization._id.toString() + '.' + extension,
    };
    const storageUrl = await this.azureStorage.upload(file);
    console.log(JSON.stringify(storageUrl));
    await this.organizationModel.updateOne({ _id: extOrganization._id }, {
      banner: storageUrl,
      updatedBy: loggedInUser,
      updatedDate: new Date()
    });
  }

  public async toggle(organizationId: string, loggedInUser: string): Promise<void> {
    const extOrganization = await this.organizationModel.findById(organizationId);
    if (extOrganization == null) {
      throw new HttpException('Invalid Organization', 400);
    }
    if (extOrganization.owner !== loggedInUser) {
      throw new HttpException('You don\'t own this Organization', 400);
    }
    await this.organizationModel.updateOne({ _id: organizationId }, {
      active: !extOrganization.active,
      updatedDate: new Date()
    });
  }

  public async report(organizationId: string, category: string, loggedInUser: string): Promise<void> {
    const extOrganization = await this.organizationModel.findById(organizationId);
    if (extOrganization == null) {
      throw new HttpException('Invalid Organization', 400);
    }
    // create organization report created by loggedInUser
  }

}
