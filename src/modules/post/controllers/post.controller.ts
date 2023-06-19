import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Req,
  Put,
  Query,
  Delete,
} from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { PostService } from '../services/post.service';
import { SFPost } from 'src/entities/sfpost.entity';
import { Request } from 'express';

@Controller('/posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Auth('ADMIN')
  @Get('/all')
  getAllPost(): Promise<SFPost[]> {
    return this.postService.getAllSFPosts();
  }

  @Auth('USER', 'ADMIN')
  @Post('/create')
  createPost(@Req() request: Request, @Body() post: SFPost): Promise<SFPost> {
    const loggedInUser = request['user'];
    return this.postService.createSFPost(post, loggedInUser.email);
  }

  @Auth('USER', 'ADMIN')
  @Put('/update/:postId')
  updatePost(
    @Param('postId') postId: string,
    @Req() request: Request,
    @Body() post: SFPost,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.postService.updatePost(postId, post, loggedInUser);
  }

  @Auth('USER', 'ADMIN')
  @Get('/:postId')
  getPost(@Param('postId') postId: string): Promise<SFPost> {
    return this.postService.getSFPost(postId);
  }

  @Auth('USER', 'ADMIN')
  @Delete('/delete/:postId')
  deletePost(
    @Param('postId') postId: string,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.postService.delete(postId, loggedInUser);
  }

  @Auth('USER', 'ADMIN')
  @Put('/support/:postId')
  togglePost(
    @Param('postId') postId: string,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.postService.toggleSupport(postId, loggedInUser);
  }

  @Auth('USER')
  @Post('/report/:postId')
  reportPost(
    @Param('postId') postId: string,
    @Query('category') category: string,
    @Req() request: Request,
  ): Promise<void> {
    const loggedInUser = request['user'];
    return this.postService.toggleReport(postId, category, loggedInUser.email);
  }
}
