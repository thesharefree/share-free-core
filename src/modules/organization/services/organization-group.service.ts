import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Group, GroupDocument } from 'src/entities/group.entity';
import { Organization, OrganizationDocument } from 'src/entities/organization.entity';

@Injectable()
export class OrganizationGroupService {

  constructor(
    @InjectModel(Organization.name) private readonly organizationModel: Model<OrganizationDocument>,
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
  ) { }

  public async getOrganizationGroups(organizationId: string): Promise<Group[]> {
    const organization = await this.organizationModel.findById(organizationId);
    if (organization == null) {
      throw new HttpException('Invalid organization', 400);
    } else {
      return await this.groupModel.find({ organizationId: organization._id });
    }
  }

}
