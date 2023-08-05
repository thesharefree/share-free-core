import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { Auth } from 'src/decorators/auth.decorator';
import { SFPost } from 'src/entities/post.entity';
import { UserPostService } from '../services/user-post.service';

@Controller('/user/posts')
export class UserPostController {
  constructor(
    private readonly userPostService: UserPostService,
  ) {}

  @Get()
  @Auth('USER')
  getUserPosts(@Req() request: Request): Promise<SFPost[]> {
    const loggedInUser = request['user'];
    return this.userPostService.getUserPosts(
      loggedInUser.email,
    );
  }
}
