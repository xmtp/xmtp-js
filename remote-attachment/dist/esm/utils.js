var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// This is a variation of https://github.com/paulmillr/noble-secp256k1/blob/main/index.ts#L1378-L1388
// that uses `digest('SHA-256', bytes)` instead of `digest('SHA-256', bytes.buffer)`
// which seems to produce different results.
export function sha256(bytes) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Uint8Array(yield crypto.subtle.digest('SHA-256', bytes));
    });
}
//# sourceMappingURL=utils.js.map