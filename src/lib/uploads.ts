import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const MAX_PROOF_SIZE = 5 * 1024 * 1024;
const PROOF_DIR = path.join(process.cwd(), "public", "uploads", "bukti");
const PROOF_URL_PREFIX = "/uploads/bukti/";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export type ProofUploadResult =
  | { path: string }
  | { error: string };

export async function savePaymentProof(
  file: FormDataEntryValue | null,
): Promise<ProofUploadResult> {
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Bukti pembayaran wajib diunggah." };
  }

  if (file.size > MAX_PROOF_SIZE) {
    return { error: "Ukuran bukti maksimal 5 MB." };
  }

  const extension = MIME_EXTENSIONS[file.type];

  if (!extension) {
    return {
      error: "Format bukti harus JPG, PNG, WEBP, atau PDF.",
    };
  }

  try {
    await mkdir(PROOF_DIR, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(
      path.join(PROOF_DIR, filename),
      Buffer.from(await file.arrayBuffer()),
    );

    return { path: `${PROOF_URL_PREFIX}${filename}` };
  } catch (error) {
    console.error("Gagal menyimpan bukti pembayaran:", error);
    return { error: "Bukti pembayaran gagal disimpan. Silakan coba lagi." };
  }
}

export async function deletePaymentProof(proofPath: string | null) {
  if (!proofPath?.startsWith(PROOF_URL_PREFIX)) return;

  const filename = path.basename(proofPath);

  try {
    await unlink(path.join(PROOF_DIR, filename));
  } catch {
    // File mungkin sudah tidak ada; abaikan.
  }
}

export function isImageProof(proofPath: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(proofPath);
}
