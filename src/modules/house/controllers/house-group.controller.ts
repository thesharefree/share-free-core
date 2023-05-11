import { Controller, Get, Param } from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { HouseGroupService } from '../services/house-group.service';
import { GroupView } from 'src/entities/vw_group.entity';

@Controller('/house/groups')
export class HouseGroupController {
  constructor(private readonly houseGroupService: HouseGroupService) {}

  @Auth('USER')
  @Get('/:houseId')
  getHouseGroups(@Param('houseId') houseId: string): Promise<GroupView[]> {
    return this.houseGroupService.getHouseGroups(houseId);
  }
}
