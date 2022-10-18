import { Injectable } from '@nestjs/common';

@Injectable()
export class HomeService {
  public getHello(name: string, message: string): any {
    return {
      message: message + '! ' + name + 'wa',
    };
  }
}
