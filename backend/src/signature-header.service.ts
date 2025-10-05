import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SignatureHeaderService {
  generateSignature(apiKey: string, secretKey: string, payload: string): string {
    const data: string = apiKey + secretKey + payload;
    return crypto
      .createHmac('sha256', secretKey)
      .update(data)
      .digest('hex');
  }
}




