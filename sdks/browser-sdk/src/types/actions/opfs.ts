export type OpfsAction =
  | {
      action: "opfs.listFiles";
      id: string;
      result: string[];
      data: undefined;
    }
  | {
      action: "opfs.wipeFiles";
      id: string;
      result: undefined;
      data: undefined;
    }
  | {
      action: "opfs.getCapacity";
      id: string;
      result: number;
      data: undefined;
    }
  | {
      action: "opfs.addCapacity";
      id: string;
      result: number;
      data: {
        n: number;
      };
    }
  | {
      action: "opfs.reduceCapacity";
      id: string;
      result: number;
      data: {
        n: number;
      };
    }
  | {
      action: "opfs.rm";
      id: string;
      result: boolean;
      data: {
        name: string;
      };
    }
  | {
      action: "opfs.error";
      id: string;
      result: string | undefined;
      data: undefined;
    };
