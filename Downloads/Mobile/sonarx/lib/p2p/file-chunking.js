export const CHUNK_SIZE = 64 * 1024;
export const MAX_FILE_SIZE = 1024 * 1024 * 1024;
export function calculateChunkCount(fileSize) {
    return Math.ceil(fileSize / CHUNK_SIZE);
}
export function getChunkInfo(fileSize, chunkIndex) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, fileSize);
    return {
        index: chunkIndex,
        start,
        end,
        size: end - start,
    };
}
export async function readFileChunk(blob, chunkIndex) {
    const chunkInfo = getChunkInfo(blob.size, chunkIndex);
    const slice = blob.slice(chunkInfo.start, chunkInfo.end);
    return slice.arrayBuffer();
}
export function createFileTransferMeta(fileId, fileName, mimeType, fileSize, encryptionKey, senderId) {
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
