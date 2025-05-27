// Default bookstore image showing a row of books on wooden shelves
export const DEFAULT_STORE_IMAGE = "/images/default-bookstore.jpg";

export function getStoreImage(imageUrl: string | undefined | null): string {
    if (!imageUrl) {
        return DEFAULT_STORE_IMAGE;
    }
    return imageUrl;
} 