import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  randomBytes(size: number): Buffer {
    return crypto.randomBytes(size);
  }

  createHash(algorithm: string): crypto.Hash {
    return crypto.createHash(algorithm);
  }
}
