import { Controller, Get, Param } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { Group } from 'src/entities/group.entity';
import { HouseGroupService } from '../services/house-group.service';

@Controller('/house/groups')
export class HouseGroupController {
  constructor(
    private readonly houseGroupService: HouseGroupService,
  ) {}

  @Auth('USER')
  @Get('/:houseId')
  getHouseGroups(
    @Param('houseId') houseId: string,
  ): Promise<Group[]> {
    return this.houseGroupService.getHouseGroups(houseId);
  }
}
