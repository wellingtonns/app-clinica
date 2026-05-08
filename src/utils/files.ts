import { StoredAsset } from "../types";

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function filesToStoredAssets(files: FileList | File[], description = ""): Promise<StoredAsset[]> {
  const fileArray = Array.from(files);
  return Promise.all(
    fileArray.map(async (file, index) => ({
      id: `asset-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      dataUrl: await readFileAsDataUrl(file),
      uploadedAt: new Date().toISOString(),
      description
    }))
  );
}

export function triggerDownload(asset: StoredAsset) {
  const link = document.createElement("a");
  link.href = asset.dataUrl;
  link.download = asset.fileName;
  link.click();
}

export function isPdf(mimeType: string) {
  return mimeType === "application/pdf";
}

export function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}
