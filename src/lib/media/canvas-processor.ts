export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/**
 * Calculates proportionally scaled dimensions ensuring neither width nor height exceeds maxDimension.
 */
export function calculateTargetDimensions(
    origWidth: number,
    origHeight: number,
    maxDimension: number = 1600
): { width: number; height: number } {
    if (origWidth <= maxDimension && origHeight <= maxDimension) {
        return { width: origWidth, height: origHeight };
    }

    if (origWidth >= origHeight) {
        const ratio = maxDimension / origWidth;
        return {
            width: maxDimension,
            height: Math.round(origHeight * ratio)
        };
    } else {
        const ratio = maxDimension / origHeight;
        return {
            width: Math.round(origWidth * ratio),
            height: maxDimension
        };
    }
}

/**
 * Validates file type and file size against security policies.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
        return { valid: false, error: "No image file provided." };
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return { valid: false, error: "Image file exceeds maximum allowed size of 5 MB." };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase()) && !file.type.startsWith("image/")) {
        return { valid: false, error: "Only JPEG, PNG, and WebP image formats are supported." };
    }

    return { valid: true };
}

/**
 * Strips EXIF metadata (including GPS coordinates, camera serials, timestamps)
 * by decoding image data onto an HTML5 Canvas and re-encoding as WebP.
 */
export async function stripExifAndCompress(
    file: File,
    maxDimension: number = 1600,
    quality: number = 0.82
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
    const validation = validateImageFile(file);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const img = new Image();

            img.onload = () => {
                const { width, height } = calculateTargetDimensions(
                    img.width,
                    img.height,
                    maxDimension
                );

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("Unable to initialize canvas 2D rendering context."));
                    return;
                }

                // Render image to canvas (completely decouples raw bytes from original EXIF headers)
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Canvas failed to serialize WebP image blob."));
                            return;
                        }
                        const cleanDataUrl = canvas.toDataURL("image/webp", quality);
                        resolve({
                            blob,
                            dataUrl: cleanDataUrl,
                            width,
                            height
                        });
                    },
                    "image/webp",
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error("Failed to decode uploaded image."));
            };

            img.src = dataUrl;
        };

        reader.onerror = () => {
            reject(new Error("Failed to read image file from disk."));
        };

        reader.readAsDataURL(file);
    });
}
