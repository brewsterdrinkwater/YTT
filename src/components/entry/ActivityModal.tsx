import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Input, TextArea, Select } from '../common/Input';
import { ACTIVITY_MAP, INTENSITY_OPTIONS, PRODUCTIVITY_OPTIONS, SLEEP_QUALITY_OPTIONS, WELLNESS_FEELING_OPTIONS } from '../../constants/activities';
import { ActivityType, Activities } from '../../types';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityType: ActivityType | null;
  initialData?: Activities[ActivityType];
  onSave: (type: ActivityType, data: Activities[ActivityType]) => void;
}

// Helper to safely get a string value from form data
const getString = (data: Record<string, unknown>, key: string): string => {
  const value = data[key];
  return typeof value === 'string' ? value : '';
};

// Helper to safely get a number value from form data
const getNumber = (data: Record<string, unknown>, key: string): string => {
  const value = data[key];
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  return '';
};

const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  activityType,
  initialData,
  onSave,
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData as Record<string, unknown>);
    } else {
      setFormData({});
    }
  }, [initialData, activityType]);

  if (!activityType) return null;

  const activity = ACTIVITY_MAP[activityType];

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(activityType, formData as Activities[ActivityType]);
    onClose();
  };

  const handleClear = () => {
    setFormData({});
  };

  const renderForm = () => {
    switch (activityType) {
      case 'workout':
        return (
          <>
            <Input
              label="Workout Type"
              placeholder="e.g., Running, Weight training, Yoga"
              value={getString(formData, 'type')}
              onChange={(e) => updateField('type', e.target.value)}
            />
            <Input
              label="Duration (minutes)"
              type="number"
              placeholder="45"
              value={getNumber(formData, 'duration')}
              onChange={(e) => updateField('duration', Number(e.target.value))}
            />
            <Select
              label="Intensity"
              options={INTENSITY_OPTIONS}
              value={getString(formData, 'intensity')}
              onChange={(e) => updateField('intensity', e.target.value)}
              placeholder="Select intensity"
            />
            <TextArea
              label="Notes"
              placeholder="How did it go?"
              value={getString(formData, 'notes')}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </>
        );

      case 'travel':
        return (
          <>
            <Input
              label="Destination"
              placeholder="Where did you go?"
              value={getString(formData, 'destination')}
              onChange={(e) => updateField('destination', e.target.value)}
            />
            <Input
              label="Transportation"
              placeholder="e.g., Flight, Car, Train"
              value={getString(formData, 'transport')}
              onChange={(e) => updateField('transport', e.target.value)}
            />
            <Input
              label="Purpose"
              placeholder="e.g., Work trip, Vacation"
              value={getString(formData, 'purpose')}
              onChange={(e) => updateField('purpose', e.target.value)}
            />
            <TextArea
              label="Notes"
              placeholder="Any highlights?"
              value={getString(formData, 'notes')}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </>
        );

      case 'work':
        return (
          <>
            <TextArea
              label="Projects/Tasks"
              placeholder="What did you work on?"
              value={getString(formData, 'projects')}
              onChange={(e) => updateField('projects', e.target.value)}
            />
            <Input
              label="Hours Worked"
              type="number"
              placeholder="8"
              value={getNumber(formData, 'hours')}
              onChange={(e) => updateField('hours', Number(e.target.value))}
            />
            <Select
              label="Productivity"
              options={PRODUCTIVITY_OPTIONS}
              value={getString(formData, 'productivity')}
              onChange={(e) => updateField('productivity', e.target.value)}
              placeholder="Select productivity level"
            />
            <TextArea
              label="Notes"
              placeholder="Any wins or blockers?"
              value={getString(formData, 'notes')}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </>
        );

      case 'social':
        return (
          <>
            <Input
              label="People"
              placeholder="Who did you spend time with?"
              value={getString(formData, 'people')}
              onChange={(e) => updateField('people', e.target.value)}
            />
            <Input
              label="Activity"
              placeholder="What did you do?"
              value={getString(formData, 'activity')}
              onChange={(e) => updateField('activity', e.target.value)}
            />
            <Input
              label="Location/Venue"
              placeholder="Where?"
              value={getString(formData, 'location')}
              onChange={(e) => updateField('location', e.target.value)}
            />
            <TextArea
              label="Notes"
              placeholder="How was it?"
              value={getString(formData, 'notes')}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </>
        );

      case 'wellness':
        return (
          <>
            <Input
              label="Activity Type"
              placeholder="e.g., Meditation, Spa, Therapy"
              value={getString(formData, 'type')}
              onChange={(e) => updateField('type', e.target.value)}
            />
            <Input
              label="Duration (minutes)"
              type="number"
              placeholder="30"
              value={getNumber(formData, 'duration')}
              onChange={(e) => updateField('duration', Number(e.target.value))}
            />
            <Select
              label="Feeling After"
              options={WELLNESS_FEELING_OPTIONS}
              value={getString(formData, 'feeling')}
              onChange={(e) => updateField('feeling', e.target.value)}
              placeholder="How did you feel?"
            />
            <TextArea
              label="Notes"
              placeholder="Any reflections?"
              value={getString(formData, 'notes')}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </>
        );

      case 'creative':
        return (
          <>
            <Input
              label="Creative Activity"
              placeholder="e.g., Writing, Painting, Music"
              value={getString(formData, 'type')}
              onChange={(e) => updateField('type', e.target.value)}
            />
            <Input
              label="Project/Topic"
              placeholder="What were you working on?"
              value={getString(formData, 'project')}
              onChange={(e) => updateField('project', e.target.value)}
            />
            <Input
              label="Time Spent (minutes)"
              type="number"
              placeholder="60"
              value={getNumber(formData, 'duration')}
              onChange={(e) => updateField('duration', Number(e.target.value))}
            />
            <TextArea
              label="Notes"
              placeholder="Any breakthroughs?"
              value={getString(formData, 'notes')}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </>
        );

      case 'food':
        return (
          <>
            <Input
              label="Breakfast"
              placeholder="What did you have?"
              value={getString(formData, 'breakfast')}
              onChange={(e) => updateField('breakfast', e.target.value)}
            />
            <Input
              label="Lunch"
              placeholder="What did you have?"
              value={getString(formData, 'lunch')}
              onChange={(e) => updateField('lunch', e.target.value)}
            />
            <Input
              label="Dinner"
              placeholder="What did you have?"
              value={getString(formData, 'dinner')}
              onChange={(e) => updateField('dinner', e.target.value)}
            />
            <TextArea
              label="Notable Meals/Restaurants"
              placeholder="Any recommendations?"
              value={getString(formData, 'notes')}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </>
        );

      case 'sleep':
        return (
          <>
            <Input
              label="Bedtime"
              type="time"
              value={getString(formData, 'bedtime')}
              onChange={(e) => updateField('bedtime', e.target.value)}
            />
            <Input
              label="Wake Time"
              type="time"
              value={getString(formData, 'waketime')}
              onChange={(e) => updateField('waketime', e.target.value)}
            />
            <Select
              label="Sleep Quality"
              options={SLEEP_QUALITY_OPTIONS}
              value={getString(formData, 'quality')}
              onChange={(e) => updateField('quality', e.target.value)}
              placeholder="How did you sleep?"
            />
            <TextArea
              label="Notes"
              placeholder="Any sleep issues or dreams?"
              value={getString(formData, 'notes')}
              onChange={(e) => updateField('notes', e.target.value)}
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${activity?.icon} ${activity?.label}`} size="md">
      <div className="space-y-1">
        {renderForm()}
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={handleClear} className="flex-1">
          Clear
        </Button>
        <Button onClick={handleSave} className="flex-1">
          Save
        </Button>
      </div>
    </Modal>
  );
};

export default ActivityModal;
