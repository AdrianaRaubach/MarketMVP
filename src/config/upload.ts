import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';

export type UploadDriver = 'local' | 's3';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const maxFileSizeInBytes = 5 * 1024 * 1024;
const uploadDriver: UploadDriver = process.env.UPLOAD_DRIVER === 's3' ? 's3' : 'local';
const appRootDir = path.resolve(__dirname, '..', '..');
const uploadRootDir = path.join(appRootDir, 'uploads');
const productUploadDir = path.join(uploadRootDir, 'products');

function sanitizeBaseName(fileName: string) {
  return path
    .parse(fileName)
    .name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function buildFileName(file: Express.Multer.File) {
  const extension = path.extname(file.originalname).toLowerCase() || '.bin';
  const baseName = sanitizeBaseName(file.originalname) || 'produto';
  return `${Date.now()}-${baseName}${extension}`;
}

const localStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    fs.mkdirSync(productUploadDir, { recursive: true });
    callback(null, productUploadDir);
  },
  filename: (_req, file, callback) => {
    callback(null, buildFileName(file));
  },
});

const memoryStorage = multer.memoryStorage();

function imageFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    callback(new Error('Envie uma imagem JPG, PNG, WEBP ou GIF.'));
    return;
  }

  callback(null, true);
}

export const productImageUpload = multer({
  storage: uploadDriver === 's3' ? memoryStorage : localStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: maxFileSizeInBytes,
  },
});

export const multipleProductImageUpload = multer({
  storage: uploadDriver === 's3' ? memoryStorage : localStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: maxFileSizeInBytes,
    files: 10,
  },
});

export function getUploadDriver() {
  return uploadDriver;
}

export function getUploadDriverLabel() {
  return uploadDriver === 's3' ? 'Amazon S3' : 'armazenamento local';
}

export function getLocalProductImageUrl(file: Express.Multer.File) {
  if (!file.filename) {
    throw new Error('Arquivo local nao encontrado para gerar a URL da imagem.');
  }

  return `/uploads/products/${file.filename}`;
}

export function getLocalProductImageUrls(files: Express.Multer.File[]) {
  return files.map(file => ({
    imageUrl: `/uploads/products/${file.filename}`,
    imageStorage: 'local' as UploadDriver,
  }));
}

export async function removeLocalProductImage(file?: Express.Multer.File) {
  if (uploadDriver !== 'local' || !file?.path) {
    return;
  }

  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Nao foi possivel remover a imagem local apos falha no cadastro.', error);
    }
  }
}

export async function removeLocalProductImages(files?: Express.Multer.File[]) {
  if (uploadDriver !== 'local' || !files || files.length === 0) {
    return;
  }

  for (const file of files) {
    await removeLocalProductImage(file);
  }
}

export async function removeLocalCommentImage(file?: Express.Multer.File) {
  if (uploadDriver !== 'local' || !file?.path) {
    return;
  }

  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error('Nao foi possivel remover a imagem local apos falha no cadastro.', error);
    }
  }
}

const commentStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    const commentUploadDir = path.join(uploadRootDir, 'comments');
    fs.mkdirSync(commentUploadDir, { recursive: true });
    callback(null, commentUploadDir);
  },
  filename: (_req, file, callback) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    callback(null, `${Date.now()}-${uniqueSuffix}${extension}`);
  },
});

export const commentImageUpload = multer({
  storage: uploadDriver === 's3' ? memoryStorage : commentStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: maxFileSizeInBytes,
    files: 5,
  },
});

export function getLocalCommentImageUrls(files: Express.Multer.File[]) {
  return files.map(file => ({
    imageUrl: `/uploads/comments/${file.filename}`,
    imageStorage: 'local' as UploadDriver,
  }));
}

export async function removeLocalCommentImages(files: Express.Multer.File[]) {
  if (uploadDriver !== 'local' || !files || files.length === 0) {
    return;
  }
  for (const file of files) {
    try {
      await fs.promises.unlink(file.path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Erro ao remover imagem:', error);
      }
    }
  }
}
