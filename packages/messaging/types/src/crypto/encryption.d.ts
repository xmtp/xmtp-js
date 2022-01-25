import Ciphertext from './Ciphertext';
export declare function encrypt(plain: Uint8Array, secret: Uint8Array, additionalData?: Uint8Array): Promise<Ciphertext>;
export declare function decrypt(encrypted: Ciphertext, secret: Uint8Array, additionalData?: Uint8Array): Promise<Uint8Array>;
//# sourceMappingURL=encryption.d.ts.map