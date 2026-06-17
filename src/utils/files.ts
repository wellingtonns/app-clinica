import { StoredAsset } from "../types";

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type StoredAssetUploadOptions = {
  patientId?: string;
  folder?: "anamneses" | "contracts" | "procedures" | "patient-files";
};

async function uploadFileToBlob(
  file: File,
  dataUrl: string,
  description: string,
  options: StoredAssetUploadOptions
): Promise<StoredAsset> {
  const response = await fetch("/api/blob/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      dataUrl,
      description,
      patientId: options.patientId,
      folder: options.folder
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "Não foi possível enviar o arquivo.");
  }

  return response.json() as Promise<StoredAsset>;
}

export async function filesToStoredAssets(
  files: FileList | File[],
  description = "",
  options: StoredAssetUploadOptions = {}
): Promise<StoredAsset[]> {
  const fileArray = Array.from(files);
  return Promise.all(
    fileArray.map(async (file, index) => {
      const dataUrl = await readFileAsDataUrl(file);
      return uploadFileToBlob(file, dataUrl, description, options);
    })
  );
}

export function triggerDownload(asset: StoredAsset) {
  const link = document.createElement("a");
  link.href = asset.blobDownloadUrl || asset.dataUrl;
  link.download = asset.fileName;
  link.click();
}

export function isPdf(mimeType: string) {
  return mimeType === "application/pdf";
}

export function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}
