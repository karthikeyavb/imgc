import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import { s3Client, bucketName, region } from './s3.js';
import { PutObjectCommand, ListObjectsV2Command, GetObjectTaggingCommand } from '@aws-sdk/client-s3';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Basic config guard
function requireConfig(req, res, next) {
  const missing = [];
  if (!bucketName) missing.push('AWS_S3_BUCKET');
  if (!region) missing.push('AWS_REGION');
  if (!process.env.AWS_ACCESS_KEY_ID) missing.push('AWS_ACCESS_KEY_ID');
  if (!process.env.AWS_SECRET_ACCESS_KEY) missing.push('AWS_SECRET_ACCESS_KEY');
  if (missing.length) {
    return res.status(500).json({ error: 'Server not configured', missing });
  }
  next();
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, region, bucket: bucketName });
});

// Debug endpoint to verify envs (do not expose in production)
app.get('/api/debug/config', (req, res) => {
  res.json({
    bucket: bucketName,
    region,
    hasAccessKey: Boolean(process.env.AWS_ACCESS_KEY_ID),
    hasSecret: Boolean(process.env.AWS_SECRET_ACCESS_KEY)
  });
});

// Upload an image with optional keyword tags (comma separated)
app.post('/api/upload', requireConfig, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    const originalName = req.file.originalname.replace(/\s+/g, '_');
    const now = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `uploads/${now}-${originalName}`;

    const keywords = (req.body.keywords || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const Tagging = keywords.length > 0 ? `keywords=${encodeURIComponent(keywords.join('|'))}` : undefined;

    const put = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Tagging,
      Metadata: { originalname: originalName }
    });
    await s3Client.send(put);
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${encodeURI(key)}`;
    res.json({ key, url, keywords });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed', details: err?.message });
  }
});

// List images, optionally filtered by keyword substring (case-insensitive)
app.get('/api/search', requireConfig, async (req, res) => {
  try {
    const q = (req.query.q || '').toString().toLowerCase();
    const list = new ListObjectsV2Command({ Bucket: bucketName, Prefix: 'uploads/' });
    const results = [];
    let data = await s3Client.send(list);
    const objects = data.Contents || [];
    for (const obj of objects) {
      if (!obj.Key || obj.Size === 0) continue;
      const tagResp = await s3Client.send(new GetObjectTaggingCommand({ Bucket: bucketName, Key: obj.Key }));
      const tag = (tagResp.TagSet || []).find((t) => t.Key === 'keywords');
      const keywords = tag ? decodeURIComponent(tag.Value || '').split('|') : [];
      if (!q || keywords.some((k) => k.includes(q))) {
        results.push({
          key: obj.Key,
          url: `https://${bucketName}.s3.${region}.amazonaws.com/${encodeURI(obj.Key)}`,
          keywords
        });
      }
    }
    res.json({ items: results });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed', details: err?.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});


