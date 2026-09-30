import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decryptField, encryptField } from './field-cipher.js';

export class FieldCipher {
  constructor(private readonly key: Buffer) {}

  encrypt(plain: string) {
    return encryptField(plain, this.key);
  }

  decrypt(payload: string) {
    return decryptField(payload, this.key);
  }
}

@Global()
@Module({
  providers: [
    {
      provide: FieldCipher,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new FieldCipher(
          Buffer.from(config.getOrThrow<string>('FIELD_ENCRYPTION_KEY'), 'base64'),
        ),
    },
  ],
  exports: [FieldCipher],
})
export class CryptoModule {}
