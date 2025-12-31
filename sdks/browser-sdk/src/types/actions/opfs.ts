export type OpfsAction =
  | {
      action: "opfs.init";
      id: string;
      result: undefined;
      data: {
        enableLogging?: boolean;
      };
    }
  | {
      action: "opfs.listFiles";
      id: string;
      result: string[];
      data: undefined;
    }
  | {
      action: "opfs.fileCount";
      id: string;
      result: number;
      data: undefined;
    }
  | {
      action: "opfs.poolCapacity";
      id: string;
      result: number;
      data: undefined;
    }
  | {
      action: "opfs.fileExists";
      id: string;
      result: boolean;
      data: {
        path: string;
      };
    }
  | {
      action: "opfs.deleteFile";
      id: string;
      result: boolean;
      data: {
        path: string;
      };
    }
  | {
      action: "opfs.exportDb";
      id: string;
      result: Uint8Array;
      data: {
        path: string;
      };
    }
  | {
      action: "opfs.importDb";
      id: string;
      result: undefined;
      data: {
        path: string;
        data: Uint8Array;
      };
    }
  | {
      action: "opfs.clearAll";
      id: string;
      result: undefined;
      data: undefined;
    };
