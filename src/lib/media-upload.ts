export type MediaCategory = "biblioteca" | "bitacora" | "catedras" | "servicios";

type UploadTokenResponse = {
  token: string;
  uploadUrl: string;
};

type UploadResponse = {
  ok: boolean;
  url?: string;
  path?: string;
  fileName?: string;
  size?: number;
  error?: string;
};

export async function uploadToAtrioMedia({
  file,
  category,
  subfolder = "",
  onProgress,
}: {
  file: File;
  category: MediaCategory;
  subfolder?: string;
  onProgress?: (percentage: number) => void;
}): Promise<{ url: string; fileName: string; path: string }> {
  const tokenResponse = await fetch("/api/media-token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      category,
      subfolder,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
    }),
  });

  const tokenData = (await tokenResponse.json().catch(() => null)) as UploadTokenResponse | { error?: string } | null;
  if (!tokenResponse.ok || !tokenData || !("token" in tokenData)) {
    throw new Error(tokenData && "error" in tokenData && tokenData.error ? tokenData.error : "No se pudo autorizar la subida.");
  }

  const form = new FormData();
  form.append("file", file, file.name);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", tokenData.uploadUrl, true);
    xhr.setRequestHeader("Authorization", `Bearer ${tokenData.token}`);
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100))));
    };

    xhr.onerror = () => reject(new Error("No se pudo conectar con el servidor de archivos ge01.com."));
    xhr.ontimeout = () => reject(new Error("La subida tardó demasiado y fue cancelada."));
    xhr.onload = () => {
      const body = (xhr.response ?? {}) as UploadResponse;
      if (xhr.status < 200 || xhr.status >= 300 || !body.ok || !body.url) {
        reject(new Error(body.error || `Error de subida (${xhr.status}).`));
        return;
      }
      onProgress?.(100);
      resolve({
        url: body.url,
        fileName: body.fileName || file.name,
        path: body.path || "",
      });
    };

    xhr.send(form);
  });
}
