export interface QROptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  darkColor?: string;
  lightColor?: string;
}

export interface QRGenerationOutput {
  svg: string;
  originalContent: string;
}

export interface QRStorageResult {
  fileId: string; // The SHA-256 hash from CAS
  isNew: boolean;
  mimeType: string;
  fileExtension: string;
}

export interface QRCodeLinkData {
  shortId: string;
  resourceType: string;
  resourceId: string;
  targetUri: string;
  sourceUrl: string;
}
