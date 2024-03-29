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
      defaultApp
        .auth()
        .verifyIdToken(token.replace('Bearer ', ''))
        .then(async (decodedToken) => {
          const isPasswordFlow = decodedToken.firebase.sign_in_provider === 'password';
          // 1st try: decodedToken[email/phone] != null
          const user = {
            email: decodedToken.email ?? '',
            phone: decodedToken.phoneNumber ?? '',
            firebaseUserId: decodedToken.uid,
            roles: [],
          };
          let userExist = await this.userModel.findOne({
            $or: [{ email: user.email }, { phone: user.phone }, { firebaseUserId: user.firebaseUserId }],
          });
          // 2nd try: decodedToken[email/phone] == null
          if(userExist == null) {
            const firebaseUser = await defaultApp.auth().getUser(user.firebaseUserId);
            user.email = firebaseUser.email ?? firebaseUser.providerData[0].email;
            user.phone = firebaseUser.phoneNumber ?? firebaseUser.providerData[0].phoneNumber;
            userExist = await this.userModel.findOne({
              $or: [{ email: user.email }, { phone: user.phone }, { firebaseUserId: user.firebaseUserId }],
            });
          }
          if (userExist != null) {
            user.email = userExist.email;
            user.phone = userExist.phone;
            user.roles = userExist.roles;
          } else {
            if (isPasswordFlow || !req.url.includes('register')) {
              this.accessDenied(req.url, res);
              return;
            } else {
              user.roles = ['USER'];
            }
          }
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
