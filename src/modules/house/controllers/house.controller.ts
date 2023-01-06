import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Req,
  Put,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { HouseService } from '../services/house.service';
import { House } from 'src/entities/house.entity';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFileMetadata } from '@nestjs/azure-storage';

@Controller('/houses')
export class HouseController {
  constructor(private readonly houseService: HouseService) {}

  @Auth('ADMIN')
  @Get('/all')
  getAllHouse(): Promise<House[]> {
    return this.houseService.getAllHouses();
  }

  @Auth('ADMIN')
  @Post('/create')
  createHouse(
    @Req() request: Request,
    @Body() house: House,
  ): Promise<House> {
    const loggedInUser = request['user'];
    return this.houseService.createHouse(
      house,
      loggedInUser.email,
    );
  }

  @Auth('USER', 'ADMIN')
  @Put('/update/:houseId')
  updateHouse(
    @Param('houseId') houseId: string,
    @Req() request: Request,
    @Body() house: House,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.houseService.updateHouse(
      houseId,
      house,
      loggedInUser,
    );
  }

  @Auth('USER')
  @Post('/uploadBanner/:houseId')
  @UseInterceptors(FileInterceptor('file'))
  uploadBanner(
    @Req() request: Request,
    @Param('houseId') houseId: string,
    @UploadedFile() file: UploadedFileMetadata,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.houseService.uploadBanner(
      file,
      houseId,
      loggedInUser,
    );
  }

  @Auth('USER', 'ADMIN')
  @Get('/:houseId')
  getHouse(
    @Param('houseId') houseId: string,
  ): Promise<House> {
    return this.houseService.getHouse(houseId);
  }

  @Auth('USER', 'ADMIN')
  @Put('/toggle/:houseId')
  toggleHouse(
    @Param('houseId') houseId: string,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.houseService.toggle(houseId, loggedInUser);
  }

  @Auth('USER')
  @Post('/report/:houseId')
  reportHouse(
    @Param('houseId') houseId: string,
    @Query('category') category: string,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.houseService.report(
      houseId,
      category,
      loggedInUser.email,
    );
  }
}
