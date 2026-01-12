import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSettings } from '../../contexts/SettingsContext';
import { ACTIVITY_MAP } from '../../constants/activities';
import { Activities, ActivityType } from '../../types';

interface ActivityTilesProps {
  activities: Activities;
  onActivityClick: (type: ActivityType) => void;
}

interface SortableTileProps {
  id: ActivityType;
  isActive: boolean;
  onClick: () => void;
  isReordering: boolean;
}

const SortableTile: React.FC<SortableTileProps> = ({ id, isActive, onClick, isReordering }) => {
  const activity = ACTIVITY_MAP[id];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isReordering });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  if (!activity) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isReordering ? listeners : {})}
      onClick={!isReordering ? onClick : undefined}
      className={`
        relative p-4 rounded-xl text-center transition-all cursor-pointer
        ${isActive ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'}
        ${isDragging ? 'opacity-50 scale-105' : ''}
        ${isReordering ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      {isReordering && (
        <div className="absolute top-1 right-1">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
          </svg>
        </div>
      )}
      <span className="text-2xl block mb-1">{activity.icon}</span>
      <span className="text-sm font-medium">{activity.label}</span>
      {isActive && !isReordering && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full" />
      )}
    </div>
  );
};

const ActivityTiles: React.FC<ActivityTilesProps> = ({ activities, onActivityClick }) => {
  const { settings, setActivityOrder } = useSettings();
  const [isReordering, setIsReordering] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = settings.activityOrder.indexOf(active.id as ActivityType);
      const newIndex = settings.activityOrder.indexOf(over.id as ActivityType);
      const newOrder = arrayMove(settings.activityOrder, oldIndex, newIndex);
      setActivityOrder(newOrder);
    }
  };

  const isActivityActive = (type: ActivityType): boolean => {
    const activity = activities[type];
    if (!activity) return false;
    return Object.values(activity).some(
      (val) => val !== undefined && val !== null && val !== ''
    );
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700">Activities</label>
        <button
          onClick={() => setIsReordering(!isReordering)}
          className={`text-sm px-3 py-1 rounded-lg transition-colors ${
            isReordering
              ? 'bg-primary text-white'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          {isReordering ? 'Done' : 'Reorder'}
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={settings.activityOrder}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {settings.activityOrder.map((type) => (
              <SortableTile
                key={type}
                id={type}
                isActive={isActivityActive(type)}
                onClick={() => onActivityClick(type)}
                isReordering={isReordering}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {isReordering && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Drag tiles to reorder them
        </p>
      )}
    </div>
  );
};

export default ActivityTiles;
