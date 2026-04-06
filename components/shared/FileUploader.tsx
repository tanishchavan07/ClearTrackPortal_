'use client'

import { useState, useRef } from 'react'
import { UploadCloud, X, File as FileIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAddFile } from '@/lib/hooks/useFiles'

interface FileUploaderProps {
  projectId: string
  folder: 'Requirements' | 'Designs' | 'Deliverables' | 'Invoices'
  onUploadSuccess?: () => void
}

export function FileUploader({ projectId, folder, onUploadSuccess }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { mutateAsync: addFileLog } = useAddFile(projectId)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await handleUpload(files[0])
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleUpload(e.target.files[0])
    }
  }

  const handleUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File exceeds 50MB limit')
      return
    }

    setUploading(true)
    setProgress(10) // Simulate starting progress
    
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${projectId}/${folder}/${fileName}`
      
      // We simulate progress for better UX since Supabase js doesn't support upload progress natively yet
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 300)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file)

      clearInterval(progressInterval)
      setProgress(100)

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath)

      // Add record to DB
      await addFileLog({
        project_id: projectId,
        url: publicUrlData.publicUrl,
        folder,
        uploaded_by: userData.user.id
      } as any)
      
      // Add activity feed entry
      await supabase.from('activity_feed').insert({
        project_id: projectId,
        user_id: userData.user.id,
        action: 'file_upload',
        message: `uploaded a new file: ${file.name}`
      })

      toast.success('File uploaded successfully')
      if (onUploadSuccess) onUploadSuccess()
      
    } catch (error: any) {
      toast.error(error.message || 'Error uploading file')
    } finally {
      setUploading(false)
      setProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50 bg-white'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
          {uploading ? <Loader2 className="h-6 w-6 animate-spin text-blue-600" /> : <UploadCloud className="h-6 w-6" />}
        </div>
        
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          {uploading ? 'Uploading...' : 'Click or drag file to this area to upload'}
        </h3>
        <p className="text-xs text-gray-500 max-w-xs text-center">
          Upload any document relevant to this {folder.toLowerCase()} folder. Maximum file size 50MB.
        </p>
        
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          disabled={uploading}
        />
        
        {uploading && (
          <div className="w-full max-w-xs mt-4 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
