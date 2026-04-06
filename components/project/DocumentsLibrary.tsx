'use client'

import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { FileIcon, Download, Trash2, Plus, Loader2 } from 'lucide-react'
import { useFiles } from '@/lib/hooks/useFiles'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

const FOLDERS = ['Requirements', 'Designs', 'Deliverables', 'Invoices'] as const

export function DocumentsLibrary({ projectId, isEditable }: { projectId: string, isEditable: boolean }) {
  const [activeFolder, setActiveFolder] = useState<typeof FOLDERS[number]>('Requirements')

  return (
    <div className="bg-white p-2 rounded-[40px] border-2 border-gray-100 shadow-xl shadow-gray-50 overflow-hidden">
      <Tabs 
        defaultValue="Requirements" 
        value={activeFolder} 
        onValueChange={(v: any) => setActiveFolder(v)} 
        className="w-full"
      >
        <div className="p-8 pb-0">
          <TabsList className="bg-gray-100/50 p-1.5 h-auto rounded-[24px] flex gap-2 border-none">
            {FOLDERS.map(folder => (
              <TabsTrigger 
                key={folder} 
                value={folder}
                className="flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all border-none"
              >
                {folder}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        {FOLDERS.map(folder => (
          <TabsContent key={folder} value={folder} className="p-8 pt-6 outline-none">
             <FolderContent 
               projectId={projectId} 
               folder={folder} 
               isActive={activeFolder === folder} 
               isEditable={isEditable} 
             />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function FolderContent({ projectId, folder, isActive, isEditable }: { projectId: string, folder: string, isActive: boolean, isEditable: boolean }) {
  const { data: files, isLoading } = useFiles(projectId, folder, isActive)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setProgress(10)
    
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${projectId}/${folder}/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file)

      if (uploadError) throw uploadError
      setProgress(70)

      const { data: publicUrlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath)

      await supabase.from('files').insert({
        project_id: projectId,
        url: publicUrlData.publicUrl,
        folder,
        uploaded_by: userData.user.id
      })
      
      setProgress(100)
      toast.success('File uploaded')
      queryClient.invalidateQueries({ queryKey: ['files', projectId, folder] })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setTimeout(() => {
        setUploading(false)
        setProgress(0)
      }, 500)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Permanent delete?')) return
    const { error } = await supabase.from('files').delete().eq('id', id)
    if (!error) {
      toast.success('Deleted')
      queryClient.invalidateQueries({ queryKey: ['files', projectId, folder] })
    }
  }

  if (isLoading && isActive) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-3xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-gray-900 tracking-tight">{folder} Docs</h3>
        {isEditable && (
          <div className="relative">
            <Button 
               disabled={uploading}
               className="bg-gray-900 text-white hover:bg-black font-black uppercase text-[10px] tracking-widest h-11 px-6 rounded-2xl shadow-xl shadow-gray-200"
               onClick={() => document.getElementById(`upload-${folder}`)?.click()}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Upload File
            </Button>
            <input 
              id={`upload-${folder}`}
              type="file" 
              className="hidden" 
              onChange={handleUpload}
            />
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-600">
              <span>Uploading to {folder}...</span>
              <span>{progress}%</span>
           </div>
           <div className="h-2 w-full bg-blue-50 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
           </div>
        </div>
      )}

      <div className="space-y-3">
        {files?.map(file => {
          const fileName = file.url.split('/').pop()?.split('?')[0] || 'document'
          return (
            <div key={file.id} className="group flex items-center justify-between p-5 bg-white border-2 border-gray-50 rounded-3xl hover:border-blue-100 hover:shadow-xl hover:shadow-blue-50 transition-all">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                   <FileIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 truncate max-w-xs">{fileName}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">
                    {format(new Date(file.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a 
                  href={file.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="h-10 w-10 bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl flex items-center justify-center transition-colors shadow-sm"
                >
                  <Download className="h-4 w-4" />
                </a>
                {isEditable && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl"
                    onClick={() => handleDelete(file.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}

        {files?.length === 0 && !isLoading && (
          <div className="text-center py-20 bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100">
             <p className="text-xs font-black uppercase tracking-widest text-gray-400">No files in this folder yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
