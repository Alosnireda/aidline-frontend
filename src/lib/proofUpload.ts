export interface ProofUploadFile {
  name: string;
  size: number;
  type: string;
}

const ACCEPTED_TYPES = [
  { mime: 'image/jpeg', label: 'JPEG' },
  { mime: 'image/png', label: 'PNG' },
  { mime: 'image/webp', label: 'WebP' },
  { mime: 'application/pdf', label: 'PDF' },
] as const;

/** One source of truth for the upload hint, the input accept list and validation. */
export const PROOF_UPLOAD_LIMITS = {
  maxFiles: 5,
  maxFileSizeBytes: 5 * 1024 * 1024,
  acceptedTypes: ACCEPTED_TYPES,
} as const;

export const PROOF_UPLOAD_ACCEPT = ACCEPTED_TYPES.map((type) => type.mime).join(',');

const acceptedLabels = ACCEPTED_TYPES.map((type) => type.label);
const acceptedLabelText = `${acceptedLabels.slice(0, -1).join(', ')} or ${acceptedLabels.at(-1)}`;

export function formatFileSize(bytes: number): string {
  const roundUp = (value: number) => Math.ceil(value * 10) / 10;
  if (bytes >= 1024 * 1024) return `${roundUp(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${roundUp(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function proofUploadHint(): string {
  const { maxFiles, maxFileSizeBytes } = PROOF_UPLOAD_LIMITS;
  return `Up to ${maxFiles} files, ${formatFileSize(maxFileSizeBytes)} each. ${acceptedLabelText}.`;
}

export function isAcceptedProofType(file: ProofUploadFile): boolean {
  return PROOF_UPLOAD_LIMITS.acceptedTypes.some((type) => type.mime === file.type);
}

export function proofUploadErrors(files: readonly ProofUploadFile[]): string[] {
  const errors: string[] = [];
  const { maxFiles, maxFileSizeBytes } = PROOF_UPLOAD_LIMITS;
  if (files.length > maxFiles) errors.push(`Choose no more than ${maxFiles} files.`);

  for (const file of files) {
    if (!isAcceptedProofType(file)) {
      errors.push(`${file.name}: unsupported file type. Use ${acceptedLabelText}.`);
    }
    if (file.size > maxFileSizeBytes) {
      errors.push(
        `${file.name}: ${formatFileSize(file.size)} is over the ${formatFileSize(maxFileSizeBytes)} limit.`,
      );
    }
  }
  return errors;
}

export function isProofSelectionValid(files: readonly ProofUploadFile[]): boolean {
  return proofUploadErrors(files).length === 0;
}

export function proofFileKey(file: ProofUploadFile & { lastModified?: number }): string {
  return `${file.name}:${file.size}:${file.type}:${file.lastModified ?? 0}`;
}
