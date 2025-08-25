declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly PINATA_JWT: string;
      readonly PINATA_GATEWAY: string;
      readonly PINATA_GROUP_ID: string;
    }
  }
}
