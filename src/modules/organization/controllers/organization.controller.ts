import { Controller, Get, Param, Post, Body, Req, Put, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { OrganizationService } from '../services/organization.service';
import { Organization } from 'src/entities/organization.entity';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFileMetadata } from '@nestjs/azure-storage';

@Controller('/organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }

  @Auth('ADMIN')
  @Get('/all')
  getAllOrganization(): Promise<Organization[]> {
    return this.organizationService.getAllOrganizations();
  }

  @Auth('ADMIN')
  @Post('/create')
  createOrganization(
    @Req() request: Request,
    @Body() organization: Organization): Promise<Organization> {
    const loggedInUser = request['user'];
    return this.organizationService.createOrganization(organization, loggedInUser.email);
  }

  @Auth('USER', 'ADMIN')
  @Put('/update/:organizationId')
  updateOrganization(
    @Param('organizationId') organizationId: string,
    @Req() request: Request,
    @Body() organization: Organization): Promise<void> {
    const loggedInUser = request['user'];
    return this.organizationService.updateOrganization(organizationId, organization, loggedInUser.email);
  }

  @Auth('USER')
  @Post('/uploadBanner/:organizationId')
  @UseInterceptors(FileInterceptor('file'))
  uploadBanner(
    @Req() request: Request,
    @Param('organizationId') organizationId: string,
    @UploadedFile() file: UploadedFileMetadata): Promise<void> {
    const loggedInUser = request['user'];
    return this.organizationService.uploadBanner(file, organizationId, loggedInUser);
  }

  @Auth('USER', 'ADMIN')
  @Get('/:organizationId')
  getOrganization(@Param('organizationId') organizationId: string): Promise<Organization> {
    return this.organizationService.getOrganization(organizationId);
  }

  @Auth('USER', 'ADMIN')
  @Put('/toggle/:organizationId')
  toggleOrganization(
    @Param('organizationId') organizationId: string,
    @Req() request: Request): Promise<void> {
    const loggedInUser = request['user'];
    return this.organizationService.toggle(organizationId, loggedInUser.email);
  }

  @Auth('USER')
  @Post('/report/:organizationId')
  reportOrganization(
    @Param('organizationId') organizationId: string,
    @Query('category') category: string,
    @Req() request: Request): Promise<void> {
    const loggedInUser = request['user'];
    return this.organizationService.report(organizationId, category, loggedInUser.email);
  }

}
