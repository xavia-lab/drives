// 1. Declare the explicit interface for the configuration object
export interface S3StorageConfig {
  bucket: string;
  region: string;
  endpoint: string;
  key: string;
  secret: string;
}
