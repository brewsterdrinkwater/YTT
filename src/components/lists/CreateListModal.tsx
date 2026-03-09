import React, { useState } from 'react';
import { useLists } from '../../contexts/ListsContext';
import {
  ListTemplate,
  LIST_TEMPLATES,
  CUSTOM_LIST_ICONS,
  CUSTOM_LIST_COLORS,
  CustomFieldDefinition,
  CustomFieldType,
} from '../../types/customList';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (listId: string) => void;
}

type Step = 'template' | 'customize';

const CreateListModal: React.FC<CreateListModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { createCustomList } = useLists();
  const [step, setStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<ListTemplate | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📝');
  const [color, setColor] = useState('bg-gray-100 border-gray-500');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [extraFields, setExtraFields] = useState<Omit<CustomFieldDefinition, 'id'>[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text');

  const handleSelectTemplate = (template: ListTemplate) => {
    setSelectedTemplate(template);
    setName(template.name);
    setIcon(template.icon);
    setColor(template.color);
    setExtraFields([]);
    setStep('customize');
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    setExtraFields([
      ...extraFields,
      { name: newFieldName.trim(), type: newFieldType, required: false },
    ]);
    setNewFieldName('');
    setNewFieldType('text');
  };

  const handleRemoveField = (index: number) => {
    setExtraFields(extraFields.filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const list = createCustomList(name.trim(), icon, color, selectedTemplate, extraFields);
    resetForm();
    onCreated?.(list.id);
    onClose();
  };

  const resetForm = () => {
    setStep('template');
    setSelectedTemplate(null);
    setName('');
    setIcon('📝');
    setColor('bg-gray-100 border-gray-500');
    setExtraFields([]);
    setNewFieldName('');
    setNewFieldType('text');
    setShowIconPicker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const allFields = [
    ...(selectedTemplate?.fields || []),
    ...extraFields,
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New List" size="md">
      {step === 'template' && (
        <div className="space-y-4">
          <p className="text-sm text-slate">Choose a template or start from scratch.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LIST_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`p-4 border-2 rounded-sm text-left transition-colors hover:border-black ${template.color}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{template.icon}</span>
                  <span className="font-bold text-sm">{template.name}</span>
                </div>
                <p className="text-xs text-slate">{template.description}</p>
                {template.fields.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.fields.map((f, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 bg-white/70 rounded text-charcoal">
                        {f.name}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'customize' && (
        <div className="space-y-4">
          <button
            onClick={() => setStep('template')}
            className="text-sm text-slate hover:text-black flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to templates
          </button>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">List Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My List"
              className="w-full px-4 py-3 border-2 border-black rounded-sm text-sm placeholder:text-slate"
              autoFocus
            />
          </div>

          {/* Icon & Color */}
          <div className="flex gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Icon</label>
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-12 h-12 border-2 border-steel rounded-sm flex items-center justify-center text-2xl hover:border-black transition-colors"
              >
                {icon}
              </button>
              {showIconPicker && (
                <div className="absolute mt-1 p-2 bg-white border-2 border-black rounded-sm shadow-lg z-10 grid grid-cols-6 gap-1 w-56">
                  {CUSTOM_LIST_ICONS.map((ic) => (
                    <button
                      key={ic}
                      onClick={() => { setIcon(ic); setShowIconPicker(false); }}
                      className={`w-8 h-8 rounded-sm flex items-center justify-center text-lg hover:bg-concrete ${
                        icon === ic ? 'bg-concrete' : ''
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-charcoal mb-1">Color</label>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_LIST_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 ${c} ${
                      color === c ? 'ring-2 ring-black ring-offset-1' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Fields preview */}
          {allFields.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Fields</label>
              <div className="space-y-1">
                {(selectedTemplate?.fields || []).map((f, i) => (
                  <div key={`tmpl-${i}`} className="flex items-center gap-2 px-3 py-2 bg-concrete rounded-sm text-sm">
                    <span className="flex-1">{f.name}</span>
                    <span className="text-xs text-slate px-2 py-0.5 bg-white rounded">{f.type}</span>
                    <span className="text-xs text-slate">(template)</span>
                  </div>
                ))}
                {extraFields.map((f, i) => (
                  <div key={`extra-${i}`} className="flex items-center gap-2 px-3 py-2 bg-concrete rounded-sm text-sm">
                    <span className="flex-1">{f.name}</span>
                    <span className="text-xs text-slate px-2 py-0.5 bg-white rounded">{f.type}</span>
                    <button
                      onClick={() => handleRemoveField(i)}
                      className="p-1 text-slate hover:text-red-500"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add custom field */}
          <div className="p-3 border border-steel rounded-sm bg-concrete/50">
            <p className="text-xs font-semibold text-slate uppercase mb-2">Add a field</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="Field name"
                className="flex-1 px-3 py-2 border border-steel rounded-sm text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
              />
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)}
                className="px-3 py-2 border border-steel rounded-sm text-sm"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="url">URL</option>
                <option value="date">Date</option>
                <option value="boolean">Checkbox</option>
                <option value="select">Dropdown</option>
              </select>
              <Button onClick={handleAddField} disabled={!newFieldName.trim()} size="sm">
                Add
              </Button>
            </div>
          </div>

          {/* Create button */}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim()} className="flex-1">
              Create List
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreateListModal;
