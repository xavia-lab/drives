// Define the exact structural configuration parameters expected from the config file
export interface AWSStorageConfig {
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3: {
      endpoint: string;
      bucket: string;
    };
  };
}
