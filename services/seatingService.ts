import type { CalculatedParameters } from '../types';

interface CalculateParamsInput {
  totalAttendeesInput: number;
  tablesInput: number | null;
  roundsInput: number | null;
  pptInput: number | null;
}

export const calculateEffectiveParameters = (input: CalculateParamsInput): CalculatedParameters => {
  const { totalAttendeesInput, tablesInput, roundsInput, pptInput } = input;
  const warnings: string[] = [];
  const baseParams = { rotatingAttendees: 0, sponsors: 0, tables: 0, rounds: 0, ppt: 0 };

  if (!totalAttendeesInput || totalAttendeesInput <= 0) {
    return { ...baseParams, error: "Total Number of Attendees must be greater than 0." };
  }

  let tables: number;
  if (tablesInput && tablesInput > 0) {
    tables = tablesInput;
  } else {
    // If tables are not specified, calculate them.
    if (pptInput && pptInput > 1) {
        tables = Math.ceil(totalAttendeesInput / pptInput);
        warnings.push(`Number of Tables was not specified; calculated as ${tables} based on your 'People Per Table' input.`);
    } else {
        // Default to tables of about 5 if no other info is provided.
        tables = Math.ceil(totalAttendeesInput / 5);
        warnings.push(`Number of Tables was not specified; calculated as ${tables} to target ~5 people per table.`);
    }
    tables = Math.max(1, tables); // Ensure at least 1 table.
  }
  
  const sponsors = tables;
  
  if (totalAttendeesInput <= sponsors) {
    return { ...baseParams, tables, sponsors, error: "Total Attendees must be greater than the number of tables (which determines the number of sponsors)." };
  }
  
  const rotatingAttendees = totalAttendeesInput - sponsors;

  let ppt: number;
  
  if (pptInput && pptInput < 2) {
    return { ...baseParams, rotatingAttendees, sponsors, tables, error: "People Per Table cannot be less than 2." };
  }

  // Determine People Per Table (PPT)
  if (pptInput && pptInput > 1) {
    ppt = pptInput;
    const requiredRotatorSpots = rotatingAttendees;
    const availableRotatorSpots = tables * (ppt - 1);
    if (availableRotatorSpots < requiredRotatorSpots) {
        warnings.push(`The specified ${ppt} people per table is not enough for all rotating attendees. PPT will be adjusted upwards.`);
        ppt = Math.ceil(rotatingAttendees / tables) + 1;
    }
  } else {
    ppt = Math.ceil(rotatingAttendees / tables) + 1; // +1 for the sponsor
    if (!pptInput) {
        warnings.push(`People Per Table was not specified; calculated as ${ppt} to fit all attendees.`);
    }
  }

  // Determine Number of Rounds
  let rounds: number;
  if (roundsInput !== null && roundsInput > 0) {
    rounds = roundsInput;
  } else {
    // Aim for each rotator to meet each sponsor
    rounds = sponsors; 
    warnings.push(`Number of Rounds was not specified; calculated as ${rounds} (to match number of sponsors).`);
  }
  
  // Intelligent warning for sponsor interaction
  const rotatorsMetBySponsor = rounds * (ppt - 1);
  if (rotatorsMetBySponsor < rotatingAttendees) {
      warnings.push(`Sponsors will have a high unmet count. With current settings, each sponsor only meets ~${rotatorsMetBySponsor} of the ${rotatingAttendees} rotating attendees. Consider increasing the number of rounds for better coverage.`);
  }

  return { rotatingAttendees, tables, sponsors, rounds, ppt, warnings };
};

export const generateSeatingAssignments = (params: CalculatedParameters) => {
  const { rotatingAttendees, tables, sponsors, rounds, ppt } = params;
  const totalParticipants = rotatingAttendees + sponsors;

  const assignments: (number | null)[][] = Array(totalParticipants).fill(null).map(() => Array(rounds).fill(null));
  const pairMeetings: number[][] = Array(totalParticipants).fill(null).map(() => Array(totalParticipants).fill(0));
  const totalUniqueMeetings: number[] = Array(totalParticipants).fill(0);

  // 1. Assign static sponsors to their tables
  for (let sponsorIdx = 0; sponsorIdx < sponsors; sponsorIdx++) {
    const participantIdx = rotatingAttendees + sponsorIdx;
    for (let roundIdx = 0; roundIdx < rounds; roundIdx++) {
      assignments[participantIdx][roundIdx] = sponsorIdx; // Sponsor `sponsorIdx` is always at table `sponsorIdx`
    }
  }

  // 2. Assign rotating attendees
  const rotatorList = Array.from({ length: rotatingAttendees }, (_, i) => i);
  const rotatingSeatsPerTable = ppt - 1;

  for (let roundIdx = 0; roundIdx < rounds; roundIdx++) {
    const tableContents: number[][] = Array(tables).fill(null).map(() => []);
    const unassignedRotators = new Set(rotatorList);

    for (let tableIdx = 0; tableIdx < tables; tableIdx++) {
        const sponsorOfThisTable = rotatingAttendees + tableIdx;
        
        while(tableContents[tableIdx].length < rotatingSeatsPerTable && unassignedRotators.size > 0) {
            let bestRotator = -1;
            let minPenalty = Infinity;

            for (const rotatorId of unassignedRotators) {
                let remeetingPenalty = 0;
                
                // Penalty for remeeting sponsor of the current table
                remeetingPenalty += Math.pow(pairMeetings[rotatorId][sponsorOfThisTable], 2);
                
                // Penalty for remeeting other rotators already assigned to this table in this round
                for (const member of tableContents[tableIdx]) {
                    remeetingPenalty += Math.pow(pairMeetings[rotatorId][member], 2);
                }

                // Penalty for having a high number of unique connections already.
                // This helps give connections to those who are "behind".
                const connectivityPenalty = totalUniqueMeetings[rotatorId];

                // Adjust weights to balance avoiding remeets (primary goal) and equitable connection distribution (secondary goal).
                const totalPenalty = (remeetingPenalty * 3) + connectivityPenalty;

                if (totalPenalty < minPenalty) {
                    minPenalty = totalPenalty;
                    bestRotator = rotatorId;
                }
            }

            if (bestRotator !== -1) {
                // Assign rotator and update data structures
                assignments[bestRotator][roundIdx] = tableIdx;
                
                // Update meetings with sponsor
                if (pairMeetings[bestRotator][sponsorOfThisTable] === 0) {
                  totalUniqueMeetings[bestRotator]++;
                  totalUniqueMeetings[sponsorOfThisTable]++;
                }
                pairMeetings[bestRotator][sponsorOfThisTable]++;
                pairMeetings[sponsorOfThisTable][bestRotator]++;
                
                // Update meetings with other rotators at the table
                for (const memberInTable of tableContents[tableIdx]) {
                    if (pairMeetings[bestRotator][memberInTable] === 0) {
                      totalUniqueMeetings[bestRotator]++;
                      totalUniqueMeetings[memberInTable]++;
                    }
                    pairMeetings[bestRotator][memberInTable]++;
                    pairMeetings[memberInTable][bestRotator]++;
                }
                tableContents[tableIdx].push(bestRotator);
                unassignedRotators.delete(bestRotator);
            } else {
                // No rotator could be placed, break to avoid infinite loop
                break;
            }
        }
    }
  }

  return { assignments, pairMeetings };
};