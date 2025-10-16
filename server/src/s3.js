import { S3Client } from '@aws-sdk/client-s3';

export const region = process.env.AWS_REGION || 'us-east-1';
export const bucketName = process.env.AWS_S3_BUCKET || '';

if (!bucketName) {
  console.warn('WARNING: AWS_S3_BUCKET is not set. API will not work until configured.');
}

export const s3Client = new S3Client({
  region,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    : undefined
});


