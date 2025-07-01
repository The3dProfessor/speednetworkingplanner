import React, { useState, useCallback, useContext } from 'react';
import { InputSection, type InputValues } from '../components/InputSection';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { LoadingSpinner } from '../components/LoadingSpinner';
import AppNavbar from '../components/AppNavbar';
import { calculateEffectiveParameters, generateSeatingAssignments } from '../services/seatingService';
import type { SeatingArrangement, CalculatedParameters, PairMeetingStats, Participant } from '../types';
import { AuthContext } from '../context/AuthContext';

const PlannerPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [calculatedParams, setCalculatedParams] = useState<CalculatedParameters | null>(null);
  const [seatingArrangement, setSeatingArrangement] = useState<SeatingArrangement | null>(null);
  const [pairMeetingStats, setPairMeetingStats] = useState<PairMeetingStats | null>(null);
  const [maxOverlap, setMaxOverlap] = useState<number>(1);
  const [participants, setParticipants] = useState<Participant[] | null>(null);

  const handleGenerate = useCallback((values: InputValues & { participants?: Participant[] }) => {
    setIsLoading(true);
    setError(null);
    setWarnings([]);
    setCalculatedParams(null);
    setSeatingArrangement(null);
    setPairMeetingStats(null);
    setParticipants(null);
    setMaxOverlap(values.maxOverlap);

    let finalParticipants: Participant[] | null = null;
    let effectiveTables = values.tables;
    let effectiveTotalAttendees = values.totalAttendees;
    const newWarnings: string[] = [];

    if (values.participants) {
        let sourceParticipants = [...values.participants];
        effectiveTotalAttendees = sourceParticipants.length;
        
        const sponsorsInFile = sourceParticipants.filter(p => p.type === 'sponsor');
        const rotatorsInFile = sourceParticipants.filter(p => p.type === 'rotator');
        
        const finalTableCount = values.tables!;

        if (finalTableCount > sponsorsInFile.length) {
            const promotionsNeeded = finalTableCount - sponsorsInFile.length;
            if (promotionsNeeded > rotatorsInFile.length) {
                setError(`You requested ${finalTableCount} tables, but there are only ${sponsorsInFile.length} sponsors and ${rotatorsInFile.length} rotators available to host.`);
                setIsLoading(false);
                return;
            }
            const promotedRotators = rotatorsInFile.slice(0, promotionsNeeded).map(p => ({ ...p, type: 'sponsor' as 'sponsor'}));
            const remainingRotators = rotatorsInFile.slice(promotionsNeeded);
            finalParticipants = [...remainingRotators, ...sponsorsInFile, ...promotedRotators];
            newWarnings.push(`${promotionsNeeded} rotating attendee(s) were assigned as table hosts to meet the specified ${finalTableCount} tables.`);

        } else if (finalTableCount < sponsorsInFile.length) {
            const demotionsNeeded = sponsorsInFile.length - finalTableCount;
            const remainingSponsors = sponsorsInFile.slice(0, finalTableCount);
            const demotedSponsors = sponsorsInFile.slice(finalTableCount).map(p => ({ ...p, type: 'rotator' as 'rotator' }));
            finalParticipants = [...rotatorsInFile, ...demotedSponsors, ...remainingSponsors];
            newWarnings.push(`${demotionsNeeded} sponsor(s) were reassigned as rotating attendees to match the specified ${finalTableCount} tables.`);
        } else {
            finalParticipants = sourceParticipants;
        }

        effectiveTables = finalTableCount;
        setParticipants(finalParticipants);

    } else {
      setParticipants(null);
    }

    setTimeout(() => {
        try {
            if (effectiveTables !== null && effectiveTotalAttendees <= effectiveTables) {
              setError("Total attendees must be greater than the number of tables.");
              setIsLoading(false);
              return;
            }
            
            const params = calculateEffectiveParameters({
                totalAttendeesInput: effectiveTotalAttendees,
                tablesInput: effectiveTables,
                roundsInput: values.rounds,
                pptInput: values.peoplePerTable,
            });

            if (params.error) {
                setError(params.error);
                setIsLoading(false);
                return;
            }
            
            const allWarnings = [...newWarnings, ...(params.warnings || [])];
            if (allWarnings.length > 0) {
                setWarnings(allWarnings);
            }
            
            setCalculatedParams(params);

            const { assignments, pairMeetings } = generateSeatingAssignments(params);

            const arrangement: SeatingArrangement = {
                ...params,
                assignments: assignments,
            };
            setSeatingArrangement(arrangement);
            
            setPairMeetingStats({ pairMeetings, maxObservedOverlap: 0 });
            
        } catch (e) {
            console.error("Error generating schedule:", e);
            setError(e instanceof Error ? e.message : "An unknown error occurred during generation.");
        } finally {
            setIsLoading(false);
        }
    }, 50);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-gray-100 font-sans">
      <AppNavbar />
      <div className="p-4 sm:p-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Event Planner
          </h1>
          <p className="text-slate-400 mt-2 text-lg">
            Configure your event and generate an optimized seating chart.
          </p>
        </header>

        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <InputSection onGenerate={handleGenerate} isLoading={isLoading} plan={user?.plan || 'Free'} />
          </div>

          <div className="lg:col-span-2">
            {isLoading && <LoadingSpinner />}
            {error && !isLoading && (
              <div className="bg-red-700/50 border border-red-500 text-red-200 px-4 py-3 rounded-md mb-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {warnings.length > 0 && !isLoading && !error && (
              <div className="bg-slate-800 shadow-xl rounded-lg p-6 mb-6">
                  <h2 className="text-2xl font-semibold text-cyan-400 mb-4">Configuration Notes</h2>
                  <div className="bg-yellow-700/20 border border-yellow-600 text-yellow-200 px-4 py-3 rounded-md" role="alert">
                    <ul className="list-disc list-inside space-y-1">
                      {warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
              </div>
            )}

            {calculatedParams && !isLoading && !error && (
               <div className="bg-slate-800 shadow-xl rounded-lg p-6 mb-6">
                  <h2 className="text-2xl font-semibold text-emerald-400 mb-4">Effective Event Parameters</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-slate-300">
                      <ParameterDisplay label="Rotators" value={calculatedParams.rotatingAttendees} />
                      <ParameterDisplay label="Sponsors" value={calculatedParams.sponsors} />
                      <ParameterDisplay label="Total People" value={calculatedParams.rotatingAttendees + calculatedParams.sponsors} />
                      <ParameterDisplay label="Tables" value={calculatedParams.tables} />
                      <ParameterDisplay label="Rounds" value={calculatedParams.rounds} />
                  </div>
              </div>
            )}

            {seatingArrangement && pairMeetingStats && !isLoading && !error && (
              <ResultsDisplay 
                arrangement={seatingArrangement} 
                pairMeetingStats={pairMeetingStats}
                maxOverlapInput={maxOverlap}
                participants={participants}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

interface ParameterDisplayProps {
  label: string;
  value: number | string;
}

const ParameterDisplay: React.FC<ParameterDisplayProps> = ({ label, value }) => (
  <div className="bg-slate-700 p-3 rounded-md shadow text-center">
    <span className="block text-xs text-emerald-400 uppercase">{label}</span>
    <span className="text-xl font-bold text-gray-100">{value}</span>
  </div>
);

export default PlannerPage;
