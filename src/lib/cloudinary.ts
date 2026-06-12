const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  thumbnail_url: string
  resource_type: 'image' | 'video'
  original_filename: string
  bytes: number
  duration?: number
  width?: number
  height?: number
}

export async function uploadToCloudinary(
  file: File,
  options?: {
    folder?: string
    tags?: string[]
    onProgress?: (pct: number) => void
  }
): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  if (options?.folder) formData.append('folder', options.folder)
  if (options?.tags?.length) formData.append('tags', options.tags.join(','))

  const resourceType = file.type.startsWith('video/') ? 'video' : 'image'
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && options?.onProgress) {
        options.onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        resolve({
          public_id: data.public_id,
          secure_url: data.secure_url,
          thumbnail_url: data.resource_type === 'video'
            ? data.secure_url.replace('/upload/', '/upload/so_0,w_400,h_300,c_fill/')
            : data.secure_url,
          resource_type: data.resource_type,
          original_filename: data.original_filename,
          bytes: data.bytes,
          duration: data.duration,
          width: data.width,
          height: data.height,
        })
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Upload failed — network error'))
    xhr.send(formData)
  })
}

export function getCloudinaryThumbnail(url: string, width = 400, height = 300): string {
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto/`)
}

export function getCloudinaryVideoPreview(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_0,du_5/${publicId}.gif`
}
