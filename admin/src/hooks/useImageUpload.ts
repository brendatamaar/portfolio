import { useCallback } from 'react'
import { api } from '../lib/api.ts'

export type UploadedImage = { id: number; url: string; filename: string }

/**
 * Returns an upload function that handles a list of image files.
 * Calls onSuccess for each uploaded file and onError if any upload fails.
 */
export function useImageUpload({
  onSuccess,
  onError,
}: {
  onSuccess: (result: UploadedImage, file: File) => void
  onError: (file: File, err: unknown) => void
}) {
  const upload = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        try {
          const result = await api.images.upload(file)
          onSuccess(result, file)
        } catch (err) {
          onError(file, err)
        }
      }
    },
    [onSuccess, onError],
  )

  return { upload }
}
