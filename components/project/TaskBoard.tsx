'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useMilestones } from '@/lib/hooks/useMilestones'
import { useProjectTasks, useUpdateTask } from '@/lib/hooks/useTasks'
import { TaskCard } from './TaskCard'
import { Skeleton } from '@/components/ui/skeleton'
import { InlineAddTask } from './InlineAddTask'
import { AddTaskModal } from './AddTaskModal'

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' }
]

export function TaskBoard({ projectId, role }: { projectId: string, role?: string }) {
  console.log('TaskBoard role check:', role)
  const isEditable = role === 'admin' || role === 'team'
  const { data: initialTasks, isLoading: tasksLoading } = useProjectTasks(projectId)
  const { data: milestones, isLoading: milestonesLoading } = useMilestones(projectId)
  const { mutate: updateTask } = useUpdateTask(projectId)
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    if (initialTasks) {
      setTasks(initialTasks)
    }
  }, [initialTasks])

  if (tasksLoading || milestonesLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    )
  }

  const onDragEnd = (result: DropResult) => {
    if (!isEditable) return
    const { destination, source, draggableId } = result

    // Dropped outside a valid column
    if (!destination) return

    // Dropped in the same place
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const draggedTask = tasks.find(t => t.id === draggableId)
    if (!draggedTask) return

    // Optimistic UI update
    const newTasks = Array.from(tasks)
    const taskIndex = newTasks.findIndex(t => t.id === draggedTask.id)
    
    // Update status in local state
    newTasks[taskIndex] = {
      ...newTasks[taskIndex],
      status: destination.droppableId
    }
    
    setTasks(newTasks)
    
    // Server update
    updateTask({
      id: draggableId,
      updates: { status: destination.droppableId as any }
    })
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 overflow-x-auto pb-4 h-full min-h-[500px]">
        {COLUMNS.map(col => (
          <div key={col.id} className="bg-gray-50/50 rounded-xl border border-gray-200 p-4 w-80 min-w-[320px] flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-semibold text-gray-700">{col.title}</h3>
              <span className="text-xs font-semibold bg-gray-200 text-gray-600 py-1 px-2.5 rounded-full">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>

            <Droppable droppableId={col.id} isDropDisabled={!isEditable}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 transition-colors rounded-lg flex flex-col gap-3 min-h-[150px] p-1 
                    ${snapshot.isDraggingOver ? 'bg-gray-100/80' : ''}`}
                >
                  {tasks.filter(t => t.status === col.id).length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No {col.title} tasks</p>
                    </div>
                  )}
                  {tasks
                    .filter(t => t.status === col.id)
                    .map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!isEditable}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <TaskCard 
                              task={task} 
                              milestoneTitle={task.milestoneTitle}
                              role={role}
                              projectId={projectId}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
