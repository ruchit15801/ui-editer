
export interface StoredObject {
  url?: string;
  base64?: string;
}

export const storeImageBuffer = async (_key: string, buffer: Buffer): Promise<StoredObject> => {
  const base64 = buffer.toString("base64");
  return { base64 };
};

