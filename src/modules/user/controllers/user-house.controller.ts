import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { Auth } from 'src/decorators/auth.decorator';
import { House } from 'src/entities/house.entity';
import { UserHouseService } from '../services/user-house.service';

@Controller('/user/houses')
export class UserHouseController {
  constructor(
    private readonly userHouseService: UserHouseService,
  ) {}

  @Get()
  @Auth('USER')
  getUserHouses(@Req() request: Request): Promise<House[]> {
    const loggedInUser = request['user'];
    return this.userHouseService.getUserHouses(
      loggedInUser.email,
    );
  }
}
