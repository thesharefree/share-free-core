import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { Auth } from 'src/decorators/auth.decorator';
import { Organization } from 'src/entities/organization.entity';
import { UserOrganizationService } from '../services/user-organization.service';

@Controller('/user/organizations')
export class UserOrganizationController {
  constructor(private readonly userOrganizationService: UserOrganizationService) { }

  @Get()
  @Auth('USER')
  getUserOrganizations(@Req() request: Request): Promise<Organization[]> {
    const loggedInUser = request['user'];
    return this.userOrganizationService.getUserOrganizations(loggedInUser.email);
  }
}
