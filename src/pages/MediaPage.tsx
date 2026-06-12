import { useState, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useMediaAssets } from '@/hooks/useData'
import { supabase } from '@/lib/supabase'
import { uploadToCloudinary, getCloudinaryThumbnail } from '@/lib/cloudinary'
import { cn, formatDate } from '@/lib/utils'
import type { MediaAsset } from '@/lib/database.types'
import toast from 'react-hot-toast'

export default function MediaPage() {
  const { profile } = useAuthStore()
  const { assets, loading } = useMediaAssets()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all')
  const [preview, setPreview] = useState<MediaAsset | null>(null)

  const filtered = assets.filter(a => filter === 'all' || a.resource_type === filter)

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)

    for (const file of Array.from(files)) {
      try {
        toast.loading(`Mengupload ${file.name}...`, { id: file.name })

        const result = await uploadToCloudinary(file, {
          folder: 'streamhive',
          tags: ['streamhive'],
          onProgress: setUploadProgress,
        })

        const { error } = await supabase.from('media_assets').insert({
          cloudinary_public_id: result.public_id,
          cloudinary_url: result.secure_url,
          thumbnail_url: result.thumbnail_url,
          resource_type: result.resource_type,
          original_filename: result.original_filename,
          file_size: result.bytes,
          duration_seconds: result.duration,
          width: result.width,
          height: result.height,
          uploaded_by: profile?.id,
          tags: ['streamhive'],
        })

        if (error) throw error
        toast.success(`✅ ${file.name} berhasil diupload`, { id: file.name })
      } catch (err) {
        toast.error(`Gagal upload ${file.name}`, { id: file.name })
        console.error(err)
      }
    }

    setUploading(false)
    setUploadProgress(0)
  }, [profile?.id])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }, [handleUpload])

  const handleDelete = async (asset: MediaAsset) => {
    if (!confirm('Hapus file ini?')) return
    const { error } = await supabase.from('media_assets').delete().eq('id', asset.id)
    if (error) toast.error('Gagal menghapus')
    else toast.success('File dihapus')
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—'
    if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
    return `${(bytes / 1_000).toFixed(0)} KB`
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-widest text-text">MEDIA <span className="text-accent">LIBRARY</span></h1>
          <p className="text-muted text-sm font-body mt-1">{assets.length} file tersimpan di Cloudinary</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center transition-all relative',
          dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
        )}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="text-2xl">⬆️</div>
            <div className="font-body text-sm text-text">Mengupload... {uploadProgress}%</div>
            <div className="w-48 mx-auto h-1.5 bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="text-3xl mb-3 opacity-50">🖼️</div>
            <div className="font-body text-sm text-text mb-1">Drag & drop file di sini</div>
            <div className="text-muted text-xs font-body mb-4">atau klik tombol di bawah untuk pilih file</div>
            <label className="inline-flex items-center gap-2 bg-accent text-bg px-5 py-2 rounded-xl font-bold text-sm cursor-pointer hover:brightness-110 transition-all">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={e => handleUpload(e.target.files)}
                className="hidden"
              />
              Pilih File
            </label>
            <div className="text-muted text-xs font-body mt-3">
              Mendukung: JPG, PNG, GIF, MP4, MOV, AVI — Max 100MB per file
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'image', 'video'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-body font-medium transition-all',
              filter === f ? 'bg-accent/10 border border-accent/30 text-accent' : 'bg-surface2 border border-border text-muted hover:text-text'
            )}
          >
            {f === 'all' ? 'Semua' : f === 'image' ? '🖼️ Gambar' : '🎬 Video'}
            <span className="ml-1.5 opacity-60">
              ({f === 'all' ? assets.length : assets.filter(a => a.resource_type === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center text-muted font-body">Memuat media...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-4xl mb-3 opacity-30">🖼️</div>
          <div className="text-muted font-body text-sm">Belum ada media diupload</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(asset => (
            <div
              key={asset.id}
              className="bg-surface border border-border rounded-xl overflow-hidden group hover:border-accent/30 transition-all cursor-pointer"
              onClick={() => setPreview(asset)}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-surface2 relative overflow-hidden">
                {asset.cloudinary_url ? (
                  <img
                    src={getCloudinaryThumbnail(asset.thumbnail_url || asset.cloudinary_url, 300, 200)}
                    alt={asset.original_filename || ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-3xl opacity-20">
                    {asset.resource_type === 'video' ? '🎬' : '🖼️'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                {asset.resource_type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white text-lg">▶</div>
                  </div>
                )}
                <div className="absolute top-1.5 left-1.5">
                  <span className="text-xs bg-black/60 text-white px-1.5 py-0.5 rounded font-mono">
                    {asset.resource_type === 'video' ? '🎬' : '🖼️'}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5">
                <div className="text-xs font-body text-text truncate">{asset.original_filename || 'Untitled'}</div>
                <div className="text-xs text-muted font-body mt-0.5 flex items-center justify-between">
                  <span>{formatSize(asset.file_size)}</span>
                  <span>{formatDate(asset.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 text-muted hover:text-text transition-colors text-2xl"
            >✕</button>

            {preview.resource_type === 'video' ? (
              <video
                src={preview.cloudinary_url}
                controls
                className="w-full rounded-2xl max-h-[70vh]"
              />
            ) : (
              <img
                src={preview.cloudinary_url}
                alt={preview.original_filename || ''}
                className="w-full rounded-2xl max-h-[70vh] object-contain"
              />
            )}

            <div className="bg-surface border border-border rounded-2xl p-4 mt-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-body font-medium text-sm text-text">{preview.original_filename}</div>
                <div className="text-xs text-muted font-body mt-0.5">
                  {formatSize(preview.file_size)} · {preview.width}×{preview.height}
                  {preview.duration_seconds && ` · ${preview.duration_seconds}s`}
                  · {formatDate(preview.created_at)}
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={preview.cloudinary_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-accent text-bg rounded-xl text-xs font-bold hover:brightness-110 transition-all"
                >
                  Buka
                </a>
                <button
                  onClick={() => { handleDelete(preview); setPreview(null) }}
                  className="px-4 py-2 bg-accent2/10 border border-accent2/30 text-accent2 rounded-xl text-xs font-bold hover:bg-accent2/20 transition-all"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
