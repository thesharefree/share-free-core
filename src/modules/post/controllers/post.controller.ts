import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Req,
  Query,
  Delete,
} from '@nestjs/common';
import { Auth } from 'src/decorators/auth.decorator';
import { PostService } from '../services/post.service';
import { SFPost } from 'src/entities/post.entity';
import { Request } from 'express';

@Controller('/posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Auth('USER', 'ADMIN')
  @Get('/all')
  getAllPost(
    @Req() request: Request,
    @Query('topicIds') topicIds: string,
  ): Promise<SFPost[]> {
    const loggedInUser = request['user'];
    return this.postService.getAllPosts(topicIds, loggedInUser.email);
  }

  @Auth('USER', 'ADMIN')
  @Get('/:postId')
  getPost(
    @Req() request: Request,
    @Param('postId') postId: string,
  ): Promise<SFPost> {
    const loggedInUser = request['user'];
    return this.postService.getPost(postId, loggedInUser.email);
  }

  @Auth('USER')
  @Post('/create')
  createPost(@Req() request: Request, @Body() post: SFPost): Promise<SFPost> {
    const loggedInUser = request['user'];
    return this.postService.createPost(post, loggedInUser.email);
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

  @Auth('USER')
  @Post('/like/:postId')
  toggleLike(
    @Param('postId') postId: string,
    @Req() request: Request,
  ): Promise<SFPost> {
    const loggedInUser = request['user'];
    return this.postService.toggleLike(postId, loggedInUser.email);
  }

  @Auth('USER')
  @Post('/support/:postId')
  toggleSupport(
    @Param('postId') postId: string,
    @Req() request: Request,
  ): Promise<SFPost> {
    const loggedInUser = request['user'];
    return this.postService.toggleSupport(postId, loggedInUser.email);
  }

  @Auth('USER')
  @Post('/report/:postId')
  toggleReport(
    @Param('postId') postId: string,
    @Query('report') report: boolean,
    @Query('category') category: string,
    @Req() request: Request,
  ): Promise<SFPost> {
    const loggedInUser = request['user'];
    return this.postService.toggleReport(
      postId,
      report,
      category,
      loggedInUser.email,
    );
  }
}
