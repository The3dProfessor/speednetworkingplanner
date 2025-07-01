import * as XLSX from 'xlsx';
import type { Participant } from '../types';

// Helper to find a key in an object with case-insensitivity
const findKey = (obj: object, keysToFind: string[]): string | null => {
  const objKeys = Object.keys(obj);
  for (const keyToFind of keysToFind) {
    const found = objKeys.find(k => k.toLowerCase().trim() === keyToFind);
    if (found) return found;
  }
  return null;
};

// Heuristics for finding columns
const findNameKeys = (row: object): { fullNameKey: string | null; firstNameKey: string | null; lastNameKey: string | null } => {
    return {
        fullNameKey: findKey(row, ['full name', 'name', 'attendee name', 'participant']),
        firstNameKey: findKey(row, ['first name', 'first', 'firstname']),
        lastNameKey: findKey(row, ['last name', 'last', 'lastname', 'surname']),
    };
};
const findStatusKey = (row: object): string | null => {
    return findKey(row, ['status', 'type', 'role', 'designation']);
};

export const parseSpreadsheet = async (file: File): Promise<{ participants: Participant[], error?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({ participants: [], error: 'Failed to read file.' });
          return;
        }

        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          resolve({ participants: [], error: 'Spreadsheet is empty or could not be read.' });
          return;
        }

        const firstRow = json[0];
        const { fullNameKey, firstNameKey, lastNameKey } = findNameKeys(firstRow);
        const statusKey = findStatusKey(firstRow);

        if (!fullNameKey && !(firstNameKey && lastNameKey)) {
          resolve({ participants: [], error: "Could not find name columns. Please use headers like 'Full Name' or 'First Name' and 'Last Name'." });
          return;
        }

        const rotators: Participant[] = [];
        const sponsors: Participant[] = [];

        json.forEach((row) => {
          let name: string | null = null;
          if (fullNameKey && row[fullNameKey]) {
            name = String(row[fullNameKey]).trim();
          } else if (firstNameKey && lastNameKey && row[firstNameKey] && row[lastNameKey]) {
            name = `${String(row[firstNameKey]).trim()} ${String(row[lastNameKey]).trim()}`;
          }

          // Skip row if name is empty or missing
          if (!name) {
            return;
          }

          let type: 'rotator' | 'sponsor' = 'rotator';
          if (statusKey && row[statusKey] && String(row[statusKey]).toLowerCase().trim() === 'sponsor') {
            type = 'sponsor';
          }
          
          if (type === 'sponsor') {
              sponsors.push({ name, type });
          } else {
              rotators.push({ name, type });
          }
        });
        
        // Sponsors must have unique names for table assignment display
        const sponsorNames = new Set();
        sponsors.forEach(s => sponsorNames.add(s.name));
        if (sponsorNames.size !== sponsors.length) {
             resolve({ participants: [], error: "Sponsor names must be unique. Please check your spreadsheet." });
             return;
        }

        // Final list with rotators first, then sponsors
        const participants = [...rotators, ...sponsors];
        resolve({ participants });

      } catch (err) {
        console.error('Spreadsheet parsing error:', err);
        resolve({ participants: [], error: err instanceof Error ? err.message : 'An unknown error occurred during parsing.' });
      }
    };
    reader.onerror = (err) => {
        console.error('File reading error:', err);
        resolve({ participants: [], error: 'There was an error reading the file.' });
    };
    reader.readAsArrayBuffer(file);
  });
};
