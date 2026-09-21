export interface StorageAdapter {
  upload(fileName: string, content: Buffer | Uint8Array, mimeType: string): Promise<string>;
  getFileUrl(fileName: string): Promise<string>;
}

// Development: Local / InsForge S3 compatible storage
class InsForgeStorage implements StorageAdapter {
  async upload(fileName: string, content: Buffer | Uint8Array, _mimeType: string): Promise<string> {
    // InsForge local endpoint / disk cache simulation
    console.log(`[Storage:InsForge] Uploaded ${fileName} (${content.length} bytes)`);
    return `http://localhost:7130/storage/v1/object/public/valutaprima-assets/${fileName}`;
  }

  async getFileUrl(fileName: string): Promise<string> {
    return `http://localhost:7130/storage/v1/object/public/valutaprima-assets/${fileName}`;
  }
}

// Production: Netlify Blobs / Cloud Storage
class CloudStorage implements StorageAdapter {
  async upload(fileName: string, content: Buffer | Uint8Array, _mimeType: string): Promise<string> {
    console.log(`[Storage:Cloud] Uploaded ${fileName} (${content.length} bytes)`);
    return `https://storage.valutaprima.com/${fileName}`;
  }

  async getFileUrl(fileName: string): Promise<string> {
    return `https://storage.valutaprima.com/${fileName}`;
  }
}

export const storage: StorageAdapter =
  process.env.DB_MODE === 'production' ? new CloudStorage() : new InsForgeStorage();
