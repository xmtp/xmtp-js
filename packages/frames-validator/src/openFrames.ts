import {
  OpenFramesRequest,
  RequestValidator,
  ValidationResponse,
} from "@open-frames/types"

import { XmtpOpenFramesRequest, XmtpValidationResponse } from "./types"
import { validateFramesPost } from "./validation"

const Validator: RequestValidator<
  XmtpOpenFramesRequest,
  XmtpValidationResponse,
  "xmtp"
> = {
  protocolIdentifier: "xmtp",
  minProtocolVersionDate: "2024-02-09",
  minProtocolVersion(): string {
    return "xxxxxxx.xxxxxxxxxxxxxxxxxxx@xxxxxx.xxxxxxxxxxxxxxxxxxxxxxxx"
  },
  isSupported(payload: OpenFramesRequest): payload is XmtpOpenFramesRequest {
    if (!payload.clientProtocol) {
      return false
    }

    const [protocol, version] = payload.clientProtocol.split("@")
    if (!protocol || !version) {
      return false
    }

    const isCorrectClientProtocol = protocol === "xmtp"
    const isCorrectVersion = version >= this.minProtocolVersionDate
    const isTrustedDataValid =
      typeof payload.trustedData?.messageBytes === "string"

    return isCorrectClientProtocol && isCorrectVersion && isTrustedDataValid
  },
  async validate(
    payload: XmtpOpenFramesRequest,
  ): Promise<
    ValidationResponse<XmtpValidationResponse, typeof this.protocolIdentifier>
  > {
    try {
      const validationResponse = await validateFramesPost(payload)
      return {
        isValid: true,
        clientProtocol: payload.clientProtocol,
        message: validationResponse,
      }
    } catch (error) {
      return {
        isValid: false,
      }
    }
  },
}

export class XmtpValidator
  implements
    RequestValidator<XmtpOpenFramesRequest, XmtpValidationResponse, "xmtp">
{
  readonly protocolIdentifier = "xmtp"
  readonly minProtocolVersionDate = "2024-02-09"

  minProtocolVersion(): string {
    return `${this.protocolIdentifier}@${this.minProtocolVersionDate}`
  }

  isSupported(payload: OpenFramesRequest): payload is XmtpOpenFramesRequest {
    if (!payload.clientProtocol) {
      return false
    }

    const [protocol, version] = payload.clientProtocol.split("@")
    if (!protocol || !version) {
      return false
    }

    const isCorrectClientProtocol = protocol === "xmtp"
    const isCorrectVersion = version >= this.minProtocolVersionDate
    const isTrustedDataValid =
      typeof payload.trustedData?.messageBytes === "string"

    return isCorrectClientProtocol && isCorrectVersion && isTrustedDataValid
  }

  async validate(
    payload: XmtpOpenFramesRequest,
  ): Promise<
    ValidationResponse<XmtpValidationResponse, typeof this.protocolIdentifier>
  > {
    try {
      const validationResponse = await validateFramesPost(payload)
      return {
        isValid: true,
        clientProtocol: payload.clientProtocol,
        message: validationResponse,
      }
    } catch (error) {
      return {
        isValid: false,
      }
    }
  }
}
