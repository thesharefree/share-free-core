import { Controller, Get, Param } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { Group } from 'src/entities/group.entity';
import { OrganizationGroupService } from '../services/organization-group.service';

@Controller('/organization/groups')
export class OrganizationGroupController {
  constructor(private readonly organizationGroupService: OrganizationGroupService) { }

  @Auth('USER')
  @Get('/:organizationId')
  getOrganizationGroups(@Param('organizationId') organizationId: string): Promise<Group[]> {
    return this.organizationGroupService.getOrganizationGroups(organizationId);
  }
}
