"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, File, FileText, FileVideo, FileAudio, FileArchive } from "lucide-react"
import { storage } from "@/lib/firebase/config"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { toast } from "sonner"
import type { DigitalFile } from "@/lib/types"

interface DigitalFileUploadProps {
  onFilesUploaded: (files: DigitalFile[]) => void
  existingFiles?: DigitalFile[]
  maxFiles?: number
  maxSizePerFile?: number // in MB
}

export function DigitalFileUpload({
  onFilesUploaded,
  existingFiles = [],
  maxFiles = 10,
  maxSizePerFile = 500 // 500MB default
}: DigitalFileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<DigitalFile[]>(existingFiles)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5" />
    if (fileType.includes('video')) return <FileVideo className="h-5 w-5" />
    if (fileType.includes('audio')) return <FileAudio className="h-5 w-5" />
    if (fileType.includes('zip') || fileType.includes('rar')) return <FileArchive className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return

    // Validate number of files
    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Validate file sizes
    const maxSizeBytes = maxSizePerFile * 1024 * 1024
    const oversizedFiles = files.filter(file => file.size > maxSizeBytes)
    if (oversizedFiles.length > 0) {
      toast.error(`Files must be less than ${maxSizePerFile}MB`)
      return
    }

    setUploading(true)

    try {
      const uploadPromises = files.map(async (file) => {
        const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const storageRef = ref(storage, `digital-products/${fileId}/${file.name}`)
        
        return new Promise<DigitalFile>((resolve, reject) => {
          const uploadTask = uploadBytesResumable(storageRef, file)

          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
            },
            (error) => {
              console.error('Upload error:', error)
              reject(error)
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              resolve({
                id: fileId,
                fileName: file.name,
                fileUrl: downloadURL,
                fileSize: file.size,
                fileType: file.type,
                uploadedAt: new Date()
              })
            }
          )
        })
      })

      const newFiles = await Promise.all(uploadPromises)
      const allFiles = [...uploadedFiles, ...newFiles]
      
      setUploadedFiles(allFiles)
      onFilesUploaded(allFiles)
      
      toast.success(`${files.length} file(s) uploaded successfully!`)
      setUploadProgress({})
    } catch (error) {
      console.error('File upload error:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId)
    setUploadedFiles(updatedFiles)
    onFilesUploaded(updatedFiles)
    toast.success('File removed')
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          onChange={handleFileSelect}
          disabled={uploading || uploadedFiles.length >= maxFiles}
          accept=".pdf,.zip,.mp4,.mp3,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.epub,.mobi"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Upload Digital Files</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supported: PDF, ZIP, MP4, MP3, DOC, XLS, PPT, EPUB, etc.
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxSizePerFile}MB per file • {uploadedFiles.length}/{maxFiles} files uploaded
          </p>
          <Button 
            type="button" 
            variant="outline" 
            className="mt-4"
            disabled={uploading || uploadedFiles.length >= maxFiles}
          >
            {uploading ? 'Uploading...' : 'Select Files'}
          </Button>
        </label>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="truncate">{fileName}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Files ({uploadedFiles.length})</h4>
          {uploadedFiles.map((file) => (
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-primary">
                      {getFileIcon(file.fileType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.fileSize)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file.id)}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {uploadedFiles.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No files uploaded yet
        </p>
      )}
    </div>
  )
}
