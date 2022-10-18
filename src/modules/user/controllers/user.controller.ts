import { UploadedFileMetadata } from '@nestjs/azure-storage';
import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { Auth } from 'src/decorators/auth.decorator';
import { Role, User } from 'src/entities/user.entity';
import { UserService } from '../services/user.service';

@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Auth('USER', 'ADMIN')
  @Get('/me')
  getUser(@Req() request: Request): Promise<User> {
    return this.userService.getUser(request['user'].email);
  }

  @Auth('USER')
  @Post('/register')
  createUser(@Req() request: Request, @Body() user: User): Promise<void> {
    const loggedInUser = request['user'];
    if (loggedInUser.email != user.email && loggedInUser.phone != user.phone) {
      throw new HttpException('Operation not allowed', 400);
    }
    user.roles = [Role.USER];
    return this.userService.register(user, loggedInUser.email);
  }

  @Auth('ADMIN')
  @Post('/createAdmin')
  createAdmin(@Req() request: Request, @Body() user: User): Promise<void> {
    const loggedInUser = request['user'];
    user.roles = [Role.ADMIN];
    return this.userService.createAdmin(user, loggedInUser.email);
  }

  @Auth('USER')
  @Put('/update')
  update(@Req() request: Request, @Body() user: User): Promise<void> {
    const loggedInUser = request['user'];
    return this.userService.update(user, loggedInUser.email);
  }

  @Auth('USER', 'ADMIN')
  @Put('/addRole')
  addRole(@Req() request: Request, @Query('role') role: string): Promise<void> {
    const loggedInUser = request['user'];
    return this.userService.addRole(role, loggedInUser.email);
  }

  @Auth('USER')
  @Post('/uploadPhoto')
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @Req() request: Request,
    @UploadedFile() file: UploadedFileMetadata,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.userService.uploadPhoto(file, loggedInUser);
  }

  @Auth('ADMIN')
  @Get('/all')
  getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }

  @Auth('ADMIN', 'USER')
  @Get('/:userId')
  getUserById(@Param('userId') userId: string): Promise<User> {
    return this.userService.getUserById(userId);
  }

  @Auth('ADMIN')
  @Put('/toggle/:userId')
  toggleUserById(
    @Req() request: Request,
    @Param('userId') userId: string,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.userService.toggleUserById(userId, loggedInUser.email);
  }
}
