import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Organization,
  OrganizationDocument,
} from 'src/entities/organization.entity';

@Injectable()
export class UserOrganizationService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  public async getUserOrganizations(
    loggedInUser: string,
  ): Promise<Organization[]> {
    return await this.organizationModel.find({ owner: loggedInUser });
  }
}
