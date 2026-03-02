// Storage service is structured to be S3 ready while keeping this demo local and simple.
// In the demo we return base64 data, but the abstraction allows switching to real S3 upload.

export interface StoredObject {
  url?: string;
  base64?: string;
}

export const storeImageBuffer = async (_key: string, buffer: Buffer): Promise<StoredObject> => {
  // TODO Integrate real S3 client here when backend storage is required
  const base64 = buffer.toString("base64");
  return { base64 };
};

