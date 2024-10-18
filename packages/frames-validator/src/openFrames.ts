import type {
  OpenFramesRequest,
  RequestValidator,
  ValidationResponse,
} from "@open-frames/types";
import type { XmtpOpenFramesRequest, XmtpValidationResponse } from "./types";
import { validateFramesPost } from "./validation";

export class XmtpValidator
  implements
    RequestValidator<XmtpOpenFramesRequest, XmtpValidationResponse, "xmtp">
{
  readonly protocolIdentifier = "xmtp";
  readonly minProtocolVersionDate = "2024-02-09";

  minProtocolVersion(): string {
    return `${this.protocolIdentifier}@${this.minProtocolVersionDate}`;
  }

  isSupported(payload: OpenFramesRequest): payload is XmtpOpenFramesRequest {
    if (!payload.clientProtocol) {
      return false;
    }

    const [protocol, version] = payload.clientProtocol.split("@");
    if (!protocol || !version) {
      return false;
    }

    const isCorrectClientProtocol = protocol === "xmtp";
    const isCorrectVersion = version >= this.minProtocolVersionDate;
    const isTrustedDataValid =
      typeof payload.trustedData.messageBytes === "string";

    return isCorrectClientProtocol && isCorrectVersion && isTrustedDataValid;
  }

  async validate(
    payload: XmtpOpenFramesRequest,
  ): Promise<
    ValidationResponse<XmtpValidationResponse, typeof this.protocolIdentifier>
  > {
    try {
      const validationResponse = validateFramesPost(payload);
      return await Promise.resolve({
        isValid: true,
        clientProtocol: payload.clientProtocol,
        message: validationResponse,
      });
    } catch {
      return Promise.resolve({
        isValid: false,
      });
    }
  }
}
