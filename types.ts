export interface CalculatedParameters {
  rotatingAttendees: number;
  sponsors: number;
  tables: number;
  rounds: number;
  ppt: number; // Effective people per table
  error?: string;
  warnings?: string[];
}

export interface SeatingArrangement extends CalculatedParameters {
  assignments: number[][]; // assignments[participantIndex][roundIndex] = tableIndex
}

export interface PairMeetingStats {
  pairMeetings: number[][]; // pairMeetings[participant1Index][participant2Index] = count
  maxObservedOverlap: number; // To be calculated on display
}

export interface Participant {
  name: string;
  type: 'rotator' | 'sponsor';
}

// --- New Types for SaaS Structure ---

export interface User {
  email: string;
  plan: Plan;
}

export type Plan = 'Free' | 'Pro' | 'Business' | 'Enterprise';

export interface Event {
  id: string;
  name: string;
  attendees: number;
  date: string;
}
