import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { parseSpreadsheet } from '../services/spreadsheetService';
import type { Participant, Plan } from '../types';

export interface InputValues {
  totalAttendees: number;
  tables: number | null;
  rounds: number | null;
  peoplePerTable: number | null;
  maxOverlap: number;
}

interface InputSectionProps {
  onGenerate: (values: InputValues & { participants?: Participant[] }) => void;
  isLoading: boolean;
  plan: Plan;
}

const planLimits = {
  Free: { attendees: 50, tables: 5, rounds: 5 },
  Pro: { attendees: 100, tables: 12, rounds: 12 },
  Business: { attendees: 200, tables: 25, rounds: 25 },
  Enterprise: { attendees: Infinity, tables: Infinity, rounds: Infinity },
};


const Label: React.FC<{ htmlFor: string; children: React.ReactNode; tooltip?: string }> = ({ htmlFor, children, tooltip }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300 mb-1 relative group">
    {children}
    {tooltip && (
      <span className="absolute left-0 bottom-full mb-1 w-max max-w-xs p-2 text-xs text-white bg-slate-600 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
        {tooltip}
      </span>
    )}
  </label>
);

const InputField: React.FC<{ id: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string; min?: string; disabled?: boolean; isLimited?: boolean }> = 
  ({ id, value, onChange, placeholder, type = "number", min = "0", disabled = false, isLimited = false }) => (
  <input
    type={type}
    id={id}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    min={min}
    disabled={disabled || isLimited}
    className={`mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md shadow-sm py-2 px-3 text-gray-100 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm placeholder-slate-400 disabled:bg-slate-600 disabled:cursor-not-allowed ${isLimited ? 'border-yellow-500' : ''}`}
  />
);

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isLoading, plan }) => {
  const limits = planLimits[plan] || planLimits.Free;

  const [totalAttendees, setTotalAttendees] = useState<string>('20');
  const [tables, setTables] = useState<string>('');
  const [rounds, setRounds] = useState<string>('');
  const [peoplePerTable, setPeoplePerTable] = useState<string>('');
  const [maxOverlap, setMaxOverlap] = useState<string>('1');

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [participantsFromFile, setParticipantsFromFile] = useState<Participant[] | null>(null);
  const [sponsorCountFromFile, setSponsorCountFromFile] = useState<number>(0);

  const attendeeCountFromFile = participantsFromFile?.length || 0;
  
  // Check against plan limits
  const isAttendeesLimited = (participantsFromFile ? attendeeCountFromFile : parseInt(totalAttendees, 10)) > limits.attendees;
  const isTablesLimited = (tables ? parseInt(tables, 10) : 0) > limits.tables;
  const isRoundsLimited = (rounds ? parseInt(rounds, 10) : 0) > limits.rounds;


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setIsParsing(true);
      setParseError(null);
      setParticipantsFromFile(null);
      setSponsorCountFromFile(0);
      
      const { participants, error } = await parseSpreadsheet(file);
      setIsParsing(false);

      if (error) {
        setParseError(error);
        e.target.value = '';
        setUploadedFile(null);
      } else {
        setParticipantsFromFile(participants);
        const sponsorCount = participants.filter(p => p.type === 'sponsor').length;
        setSponsorCountFromFile(sponsorCount);
        setTables(String(sponsorCount));
      }
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setParticipantsFromFile(null);
    setParseError(null);
    setSponsorCountFromFile(0);
    setTables('');
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParseError(null);
    
    if (isAttendeesLimited || isTablesLimited || isRoundsLimited) {
      setParseError(`Your current plan does not support these event parameters. Please upgrade your plan.`);
      return;
    }

    const currentTableCount = parseInt(tables, 10);
    if(participantsFromFile) {
      if (isNaN(currentTableCount) || currentTableCount < 0) {
        setParseError("Number of Tables for Event must be a valid number.");
        return;
      }
      if (attendeeCountFromFile <= currentTableCount) {
        setParseError("Total attendees from file must be greater than the number of tables.");
        return;
      }
    }

    onGenerate({
      totalAttendees: participantsFromFile ? attendeeCountFromFile : (parseInt(totalAttendees, 10) || 0),
      tables: tables ? parseInt(tables, 10) : null,
      rounds: rounds ? parseInt(rounds, 10) : null,
      peoplePerTable: peoplePerTable ? parseInt(peoplePerTable, 10) : null,
      maxOverlap: parseInt(maxOverlap, 10) || 1,
      participants: participantsFromFile || undefined,
    });
  };

  const isGenerateDisabled = isLoading || isParsing || (!participantsFromFile && (!totalAttendees || parseInt(totalAttendees, 10) <= 0)) || isAttendeesLimited || isTablesLimited || isRoundsLimited;

  return (
    <div className="bg-slate-800 shadow-xl rounded-lg p-6 sticky top-8">
      <h2 className="text-2xl font-semibold text-emerald-400 mb-6">Event Configuration</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="file-upload" tooltip="Upload a spreadsheet with columns for names and roles (e.g., 'Sponsor').">Upload Attendee List (Optional)</Label>
          <div className="mt-1 flex items-center space-x-2">
            <label className="w-full flex items-center justify-center px-4 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-100 hover:bg-slate-600 cursor-pointer">
              <svg className="w-5 h-5 mr-2 text-slate-300" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4 4-4-4h3V9h2v2z" /></svg>
              <span>{uploadedFile ? uploadedFile.name : 'Select File'}</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv, .xlsx, .xls" disabled={isParsing}/>
            </label>
            {uploadedFile && (
              <button type="button" onClick={clearFile} className="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors">&times;</button>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">Supported formats: .xlsx, .xls, .csv</p>
          {isParsing && <p className="mt-2 text-sm text-cyan-400 animate-pulse">Parsing file...</p>}
          {(parseError && !isAttendeesLimited && !isRoundsLimited && !isTablesLimited) && <p className="mt-2 text-sm text-red-400">{parseError}</p>}
        </div>
        
        <div className="border-t border-slate-600 my-4"></div>

        <div>
          <Label htmlFor="totalAttendees" tooltip="Total number of people participating. Auto-filled from spreadsheet if provided.">Total Number of Attendees*</Label>
          <InputField id="totalAttendees" value={participantsFromFile ? String(attendeeCountFromFile) : totalAttendees} onChange={(e) => setTotalAttendees(e.target.value)} min="1" disabled={!!participantsFromFile} isLimited={isAttendeesLimited} />
           {isAttendeesLimited && <PlanLimitWarning currentPlan={plan} limit={limits.attendees} type="attendees"/>}
        </div>

        {participantsFromFile && (
           <div>
              <Label htmlFor="sponsorsFromFile" tooltip="The number of people identified as 'Sponsor' in your file. This is for information only.">Sponsors Found in File</Label>
              <InputField id="sponsorsFromFile" value={String(sponsorCountFromFile)} onChange={()=>{}} disabled={true}/>
           </div>
        )}
        
        <div>
          <Label htmlFor="tables" tooltip={participantsFromFile ? "Editable. Set the number of tables for the event. Defaults to sponsor count." : "Number of tables for the event. Leave blank for auto-calculation."}>
            {participantsFromFile ? "Number of Tables for Event" : "Number of Tables"}
          </Label>
          <InputField id="tables" value={tables} onChange={(e) => setTables(e.target.value)} placeholder="Auto" min="0" isLimited={isTablesLimited} />
           {isTablesLimited && <PlanLimitWarning currentPlan={plan} limit={limits.tables} type="tables"/>}
        </div>
        
        <div>
          <Label htmlFor="rounds" tooltip="Number of networking rounds. Leave blank for auto-calculation.">Number of Rounds</Label>
          <InputField id="rounds" value={rounds} onChange={(e) => setRounds(e.target.value)} placeholder="Auto" min="1" isLimited={isRoundsLimited} />
           {isRoundsLimited && <PlanLimitWarning currentPlan={plan} limit={limits.rounds} type="rounds"/>}
        </div>
        <div>
          <Label htmlFor="peoplePerTable" tooltip="Total people (sponsors + rotators) per table. Leave blank for auto.">Total People Per Table</Label>
          <InputField id="peoplePerTable" value={peoplePerTable} onChange={(e) => setPeoplePerTable(e.target.value)} placeholder="Auto" min="2"/>
        </div>
         <div>
          <Label htmlFor="maxOverlap" tooltip="Client-side check for maximum times any two people should meet. Default is 1.">Max Overlap Per Pair</Label>
          <InputField id="maxOverlap" value={maxOverlap} onChange={(e) => setMaxOverlap(e.target.value)} min="0"/>
        </div>
        <button
          type="submit"
          disabled={isGenerateDisabled}
          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-md shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-emerald-400"
        >
          {isLoading ? 'Generating...' : (isParsing ? 'Processing...' : 'Generate Schedule')}
        </button>
      </form>
    </div>
  );
};

const PlanLimitWarning: React.FC<{currentPlan: Plan, limit: number, type: string}> = ({ currentPlan, limit, type}) => (
    <div className="mt-2 text-xs text-yellow-300 bg-yellow-900/50 p-2 rounded-md">
        Your <span className="font-bold">{currentPlan}</span> plan limit is <span className="font-bold">{limit}</span> {type}. Please lower the count or{' '}
        <Link to="/pricing" className="font-bold underline hover:text-yellow-200">Upgrade your plan</Link>.
    </div>
);
