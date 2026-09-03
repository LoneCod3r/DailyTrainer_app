// Storage abstraction (Prompt2 §7). Everything that needs to store a file
// (future Articles, Courses, ...) should go through this interface instead
// of talking to a specific provider directly — that's what lets us switch
// from local dev storage to S3-compatible storage later with a one-line
// config change and zero call-site changes.

export interface StorageProvider {
  // Returns the public URL the uploaded file can be served from.
  upload(input: { buffer: Buffer; fileName: string; mimeType: string }): Promise<{ url: string }>;
  remove(url: string): Promise<void>;
}

// Local filesystem provider for development. Files are written under
// /public/uploads so Next.js serves them directly — never used in
// production; production deployments should set STORAGE_PROVIDER to an
// S3-compatible implementation (not included in this foundation phase).
class LocalStorageProvider implements StorageProvider {
  async upload(): Promise<{ url: string }> {
    throw new Error(
      'LocalStorageProvider.upload is a foundation-phase stub. ' +
        'Wire this up to an actual filesystem/S3 write once the Media module ships.',
    );
  }

  async remove(): Promise<void> {
    throw new Error('LocalStorageProvider.remove is a foundation-phase stub.');
  }
}

export function getStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? 'local';
  switch (provider) {
    case 'local':
      return new LocalStorageProvider();
    default:
      throw new Error(
        `Unknown STORAGE_PROVIDER "${provider}". Only "local" is implemented in this foundation phase.`,
      );
  }
}
