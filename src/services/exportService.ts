import { Entry } from '../types';
import { exportToCSV, generateCSVPreview } from '../utils/exportCSV';

export { exportToCSV, generateCSVPreview };

// Export entries as JSON
export const exportToJSON = (entries: Entry[]): void => {
  const jsonContent = JSON.stringify(entries, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const filename = `ytt-export-${new Date().toISOString().split('T')[0]}.json`;

  downloadBlob(blob, filename);
};

// Import entries from JSON
export const importFromJSON = async (file: File): Promise<Entry[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const entries = JSON.parse(content) as Entry[];

        // Basic validation
        if (!Array.isArray(entries)) {
          throw new Error('Invalid format: expected an array of entries');
        }

        // Validate each entry has required fields
        for (const entry of entries) {
          if (!entry.id || !entry.date || !entry.location) {
            throw new Error('Invalid entry: missing required fields');
          }
        }

        resolve(entries);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Download a blob as a file
const downloadBlob = (blob: Blob, filename: string): void => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Get export statistics
export const getExportStats = (entries: Entry[]) => {
  const locations = new Set(entries.map((e) => e.location));
  const activities = entries.reduce((acc, entry) => {
    Object.keys(entry.activities).forEach((key) => {
      if (entry.activities[key as keyof typeof entry.activities]) {
        acc[key] = (acc[key] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const avgFeeling =
    entries.length > 0
      ? entries.reduce((sum, e) => sum + e.feeling, 0) / entries.length
      : 0;

  return {
    totalEntries: entries.length,
    uniqueLocations: locations.size,
    activityCounts: activities,
    averageFeeling: Math.round(avgFeeling * 10) / 10,
    dateRange: {
      earliest: entries.length > 0 ? entries[entries.length - 1].date : null,
      latest: entries.length > 0 ? entries[0].date : null,
    },
  };
};

export default {
  exportToCSV,
  exportToJSON,
  importFromJSON,
  generateCSVPreview,
  getExportStats,
};
