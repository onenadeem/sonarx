export const CHUNK_SIZE = 64 * 1024;
export const MAX_FILE_SIZE = 1024 * 1024 * 1024;

export function calculateChunkCount(fileSize: number): number {
  return Math.ceil(fileSize / CHUNK_SIZE);
}

export interface ChunkInfo {
  index: number;
  start: number;
  end: number;
  size: number;
}

export function getChunkInfo(fileSize: number, chunkIndex: number): ChunkInfo {
  const start = chunkIndex * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, fileSize);
  return {
    index: chunkIndex,
    start,
    end,
    size: end - start,
  };
}

export async function readFileChunk(
  blob: Blob,
  chunkIndex: number,
): Promise<ArrayBuffer> {
  const chunkInfo = getChunkInfo(blob.size, chunkIndex);
  const slice = blob.slice(chunkInfo.start, chunkInfo.end);
  return slice.arrayBuffer();
}

export interface FileTransferMeta {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  chunkCount: number;
  encryptionKey: Uint8Array;
  senderId: string;
  timestamp: number;
}

export function createFileTransferMeta(
  fileId: string,
  fileName: string,
  mimeType: string,
  fileSize: number,
  encryptionKey: Uint8Array,
  senderId: string,
): FileTransferMeta {
  return {
    fileId,
    fileName,
    mimeType,
    fileSize,
    chunkCount: calculateChunkCount(fileSize),
    encryptionKey,
    senderId,
    timestamp: Date.now(),
  };
}
