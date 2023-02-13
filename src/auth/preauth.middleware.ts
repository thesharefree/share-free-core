import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request, Response } from 'express';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/entities/user.entity';
import { defaultApp } from './firebaseAdmin';

@Injectable()
export class PreauthMiddleware implements NestMiddleware {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  use(req: Request, res: Response, next: Function) {
    const token = req.headers.authorization;
    if (token != null && token != '') {
      console.debug(token);
      defaultApp
        .auth()
        .verifyIdToken(token.replace('Bearer ', ''))
        .then(async (decodedToken) => {
          const isPasswordFlow = decodedToken.firebase.sign_in_provider === 'password';
          console.debug(JSON.stringify(decodedToken));
          const user = {
            email: decodedToken.email ? decodedToken.email : '',
            phone: decodedToken.phone_number ? decodedToken.phone_number : '',
            firebaseUserId: decodedToken.uid,
            roles: [],
          };
          const userExist = await this.userModel.findOne({
            $or: [{ email: user.email }, { phone: user.phone }, { firebaseUserId: decodedToken.uid}],
          });
          if (userExist != null) {
            console.debug(userExist);
            user.email = userExist.email;
            user.phone = userExist.phone;
            user.roles = userExist.roles;
          } else {
            console.log('baseUrl', req.url);
            if (isPasswordFlow || !req.url.includes('register')) {
              this.accessDenied(req.url, res);
              return;
            } else {
              user.roles = ['USER'];
            }
          }
          console.debug(user);
          req['user'] = user;
          next();
        })
        .catch((error) => {
          console.error(error);
          this.accessDenied(req.url, res);
          return;
        });
    } else {
      next();
    }
  }

  private accessDenied(url: string, res: Response) {
    res.status(403).json({
      statusCode: 403,
      timestamp: new Date().toISOString(),
      path: url,
      message: 'Access Denied',
    });
  }
}
