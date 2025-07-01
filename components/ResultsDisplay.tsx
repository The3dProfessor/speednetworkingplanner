import React, { useMemo } from 'react';
import type { SeatingArrangement, PairMeetingStats, Participant } from '../types';
import jsPDF from 'jspdf';

interface ResultsDisplayProps {
  arrangement: SeatingArrangement;
  pairMeetingStats: PairMeetingStats;
  maxOverlapInput: number;
  participants: Participant[] | null;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ arrangement, pairMeetingStats, maxOverlapInput, participants }) => {
  const { assignments, rotatingAttendees, sponsors, rounds } = arrangement;
  const totalParticipants = rotatingAttendees + sponsors;

  const participantLabels = useMemo(() => {
      if (participants) {
        return participants.map((p, index) => {
          if (p.type === 'sponsor') {
            // The sponsor's table number is its index within the sponsor-only group.
            const sponsorIndex = index - rotatingAttendees;
            return `${p.name} (Table ${sponsorIndex + 1})`;
          }
          return p.name;
        });
      }
      
      // Fallback to original generic labels
      const rotators = Array.from({ length: rotatingAttendees }, (_, i) => `Attendee ${i + 1}`);
      const sponsorLabels = Array.from({ length: sponsors }, (_, i) => `Sponsor ${i + 1} (Table ${i+1})`);
      return [...rotators, ...sponsorLabels];
  }, [participants, rotatingAttendees, sponsors]);
  
  const roundLabels = useMemo(() => Array.from({ length: rounds }, (_, i) => `Round ${i + 1}`), [rounds]);
  
  const { maxObservedOverlap, overlapDistribution, totalPossiblePairs, pairsThatMet, unmetCounts, percentUnmet } = useMemo(() => {
    let max = 0;
    const distribution: { [key: number]: number } = {};
    const totalPairs = (totalParticipants * (totalParticipants - 1)) / 2;
    const unmetCounts: number[] = Array(totalParticipants).fill(totalParticipants - 1); // Start with max unmet

    if (pairMeetingStats && pairMeetingStats.pairMeetings && totalParticipants > 1) {
      for (let i = 0; i < totalParticipants; i++) {
        let metCount = 0;
        for (let j = 0; j < totalParticipants; j++) {
            if (i === j) continue;
            const meetings = pairMeetingStats.pairMeetings[i][j];
            if (i < j) { // Process each pair only once for distribution stats
                if (meetings > max) {
                    max = meetings;
                }
                distribution[meetings] = (distribution[meetings] || 0) + 1;
            }
            if (meetings > 0) {
                metCount++;
            }
        }
        unmetCounts[i] = totalParticipants - 1 - metCount;
      }
    }
    const metPairCount = totalPairs - (distribution[0] || 0);
    const unmetPairsCount = distribution[0] || 0;
    const percentUnmetString = totalPairs > 0 ? (unmetPairsCount / totalPairs * 100).toFixed(1) : '0.0';
    
    return { 
      maxObservedOverlap: max, 
      overlapDistribution: distribution,
      totalPossiblePairs: totalPairs,
      pairsThatMet: metPairCount,
      unmetCounts,
      percentUnmet: percentUnmetString,
    };
  }, [pairMeetingStats, totalParticipants]);

  const sortedUnmetList = useMemo(() => {
    if (!participantLabels || !unmetCounts) return [];

    return participantLabels
      .map((label, index) => ({
        label,
        count: unmetCounts[index],
      }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count; // Sort by unmet count descending
        }
        return a.label.localeCompare(b.label); // Secondary sort by name
      });
  }, [participantLabels, unmetCounts]);

  const handleDownloadCSV = () => {
    const headers = ['Participant', ...roundLabels];
    const rows = participantLabels.map((label, pIdx) => {
        const rowData = [`"${label.replace(/"/g, '""')}"`]; // Handle quotes in names
        for (let rIdx = 0; rIdx < rounds; rIdx++) {
            const tableNum = assignments[pIdx]?.[rIdx];
            rowData.push(tableNum !== null && tableNum !== undefined ? `Table ${tableNum + 1}` : 'N/A');
        }
        return rowData.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'seating-chart.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadPDF = () => {
    // Determine orientation based on number of rounds for better layout
    const orientation = rounds > 8 ? 'l' : 'p';
    const doc = new jsPDF({
        orientation,
        unit: 'pt',
        format: 'letter'
    });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageW - margin * 2;
    
    // Increased cell height for better text fitting, especially for two-line text.
    const cellHeight = 28;
    const attendeeBlockSpacing = 15;
    const headerColWidth = 90;
    
    const maxColsInARow = 12;
    const numRoundRows = Math.ceil(rounds / maxColsInARow);
    const colsPerRoundRow = Math.ceil(rounds / numRoundRows);
    
    const dataGridWidth = contentWidth - headerColWidth;
    const dataColWidth = dataGridWidth / colsPerRoundRow;

    let y = margin;

    participantLabels.forEach((label, pIdx) => {
        const attendeeRounds = assignments[pIdx];

        const roundEntryHeight = cellHeight * 2;
        const blockContentHeight = roundEntryHeight * numRoundRows;
        
        if (y + blockContentHeight + attendeeBlockSpacing > pageH - margin) {
            doc.addPage();
            y = margin;
        }
        
        const blockStartY = y;

        // Loop through each row of rounds for this participant
        for (let i = 0; i < numRoundRows; i++) {
            const rowStartY = y;
            const roundHeaderY = rowStartY;
            const tableDataY = rowStartY + cellHeight;

            const startRoundForThisRow = i * colsPerRoundRow;
            const colsInThisRow = Math.min(colsPerRoundRow, rounds - startRoundForThisRow);

            let roundX = margin + headerColWidth;
            // Draw Round Headers
            doc.setFontSize(9);
            for (let j = 0; j < colsInThisRow; j++) {
                const roundIdx = startRoundForThisRow + j;
                const roundNum = roundIdx + 1;
                const centerX = roundX + dataColWidth / 2;

                doc.setFont('helvetica', 'bold');
                if (roundNum >= 10) {
                    doc.text('Round', centerX, roundHeaderY + cellHeight * 0.35, { align: 'center', baseline: 'middle' });
                    doc.setFont('helvetica', 'normal');
                    doc.text(String(roundNum), centerX, roundHeaderY + cellHeight * 0.75, { align: 'center', baseline: 'middle' });
                } else {
                    doc.text(`Round ${roundNum}`, centerX, roundHeaderY + cellHeight / 2, { align: 'center', baseline: 'middle' });
                }
                roundX += dataColWidth;
            }

            let tableX = margin + headerColWidth;
            // Draw Table Numbers
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            for (let j = 0; j < colsInThisRow; j++) {
                const roundIdx = startRoundForThisRow + j;
                const tableNumData = attendeeRounds[roundIdx];
                const centerX = tableX + dataColWidth / 2;

                if (tableNumData !== null && tableNumData !== undefined) {
                    const tableNum = tableNumData + 1;
                    if (tableNum >= 10) {
                        doc.text('Table', centerX, tableDataY + cellHeight * 0.35, { align: 'center', baseline: 'middle' });
                        doc.text(String(tableNum), centerX, tableDataY + cellHeight * 0.75, { align: 'center', baseline: 'middle' });
                    } else {
                        doc.text(`Table ${tableNum}`, centerX, tableDataY + cellHeight / 2, { align: 'center', baseline: 'middle' });
                    }
                } else {
                    doc.text('N/A', centerX, tableDataY + cellHeight / 2, { align: 'center', baseline: 'middle' });
                }
                tableX += dataColWidth;
            }
            
            y += roundEntryHeight;
        }
        
        const blockEndY = y;

        // --- Draw Borders and Attendee Label ---
        doc.setDrawColor(0);

        const blockCenterY = blockStartY + (blockEndY - blockStartY) / 2;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin + 5, blockCenterY, { baseline: 'middle', maxWidth: headerColWidth - 10 });
        
        doc.rect(margin, blockStartY, contentWidth, blockContentHeight);
        doc.line(margin + headerColWidth, blockStartY, margin + headerColWidth, blockEndY);
        
        let rowYCursor = blockStartY;
        for (let i = 0; i < numRoundRows; i++) {
            const startRoundForThisRow = i * colsPerRoundRow;
            const colsInThisRow = Math.min(colsPerRoundRow, rounds - startRoundForThisRow);
            const rowWidth = dataColWidth * colsInThisRow;

            // Horizontal line separating Round from Table
            doc.setDrawColor(150);
            doc.line(margin + headerColWidth, rowYCursor + cellHeight, margin + headerColWidth + rowWidth, rowYCursor + cellHeight);

            // Horizontal line separating this round-row from the next one
            if (i < numRoundRows - 1) {
                doc.setDrawColor(0);
                doc.line(margin, rowYCursor + roundEntryHeight, pageW - margin, rowYCursor + roundEntryHeight);
            }
            
            // Vertical lines between data columns
            doc.setDrawColor(0);
            let lineX = margin + headerColWidth;
            for (let j = 0; j < colsInThisRow - 1; j++) {
                lineX += dataColWidth;
                doc.line(lineX, rowYCursor, lineX, rowYCursor + roundEntryHeight);
            }
            
            rowYCursor += roundEntryHeight;
        }

        y = blockEndY + attendeeBlockSpacing;
    });

    doc.save('attendee-schedules.pdf');
  };
  
  const baseButtonStyles = "text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 text-sm";

  return (
    <div className="bg-slate-800 shadow-xl rounded-lg p-6">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-emerald-400">Seating Arrangement</h2>
        <div className="flex items-center space-x-2 print:hidden">
            <button
                onClick={handleDownloadCSV}
                className={`${baseButtonStyles} bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 focus:ring-emerald-400`}
            >
                Download CSV
            </button>
            <button
                onClick={handleDownloadPDF}
                className={`${baseButtonStyles} bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:ring-purple-400`}
            >
                Download PDF
            </button>
        </div>
      </div>
      
      <div className="mb-8 p-4 bg-slate-700 rounded-md">
        <h3 className="text-lg font-semibold text-cyan-400 mb-3">Interaction Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-center">
            <div className="bg-slate-600 p-3 rounded">
                <div className="text-2xl font-bold text-white">{totalPossiblePairs}</div>
                <div className="text-sm text-slate-300">Total Unique Pairs</div>
            </div>
            <div className="bg-slate-600 p-3 rounded">
                <div className="text-2xl font-bold text-white">{pairsThatMet}</div>
                <div className="text-sm text-slate-300">Pairs That Met</div>
            </div>
            <div className="bg-slate-600 p-3 rounded">
                <div className="text-2xl font-bold text-white">{totalPossiblePairs - pairsThatMet}</div>
                <div className="text-sm text-slate-300">Pairs That Didn't Meet</div>
            </div>
            <div className="bg-slate-600 p-3 rounded">
                <div className="text-2xl font-bold text-white">{percentUnmet}%</div>
                <div className="text-sm text-slate-300">% of Pairs Unmet</div>
            </div>
        </div>

        <h4 className="text-md font-semibold text-cyan-400 mb-2">Meeting Distribution</h4>
        <div className="text-sm text-slate-300 space-y-1">
            {Object.entries(overlapDistribution).sort((a,b) => Number(a[0]) - Number(b[0])).map(([meetings, count]) => (
                <p key={meetings}>- <span className="font-bold text-white">{count}</span> pairs met <span className="font-bold text-white">{meetings}</span> time(s).</p>
            ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-600">
            <p className="text-slate-300">Target Max Overlap: <span className="font-bold text-white">{maxOverlapInput}</span></p>
            <p className="text-slate-300">Actual Max Overlap: <span className="font-bold text-white">{maxObservedOverlap}</span></p>
            {maxObservedOverlap > maxOverlapInput && (
                <p className="text-yellow-400 text-sm mt-1">Note: Some pairs exceeded the target max overlap.</p>
            )}
        </div>
      </div>

      <div className="mb-8 p-4 bg-slate-700 rounded-md">
        <h3 className="text-lg font-semibold text-cyan-400 mb-3">Unmet Connections Report</h3>
        <p className="text-slate-300 mb-4">
            <span className="font-bold text-white">{totalPossiblePairs - pairsThatMet}</span> pairs ({percentUnmet}%) did not get to meet.
        </p>
        <h4 className="text-md font-semibold text-cyan-400 mb-2">Unmet Count per Participant:</h4>
        {sponsors > 0 && (
          <div className="text-xs text-slate-400 bg-slate-700/50 p-2 rounded-md mb-3">
            <strong>Note on Sponsor Stats:</strong> Sponsors are static hosts and do not move. Their unmet count may appear high because they cannot meet other sponsors and can only interact with the rotating attendees who visit their table. The algorithm works to ensure they meet as many unique attendees as possible within the given number of rounds.
          </div>
        )}
        <div className="max-h-60 overflow-y-auto pr-2">
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 text-sm">
                {sortedUnmetList.map(({ label, count }) => (
                <li key={label} className="bg-slate-600 p-2 rounded-md flex justify-between items-center">
                    <span className="font-medium text-white truncate pr-2">{label}:</span>
                    <span className="text-slate-200 font-bold">{count}</span>
                </li>
                ))}
            </ul>
        </div>
      </div>

      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-emerald-400 uppercase bg-slate-700">
            <tr>
              <th scope="col" className="py-3 px-6 sticky left-0 bg-slate-700 z-10">Participant</th>
              {roundLabels.map(label => (
                <th scope="col" key={label} className="py-3 px-6 text-center">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participantLabels.map((participantLabel, participantIdx) => (
              <tr key={participantLabel} className={`${participantIdx >= rotatingAttendees ? 'bg-slate-800/50' : 'bg-slate-800'} border-b border-slate-700 hover:bg-slate-700/50 group`}>
                <td className={`py-4 px-6 font-medium whitespace-nowrap sticky left-0 z-10 ${participantIdx >= rotatingAttendees ? 'bg-slate-800/50 group-hover:bg-slate-700/50 text-cyan-300' : 'bg-slate-800 group-hover:bg-slate-700/50 text-gray-100'}`}>
                  {participantLabel}
                </td>
                {assignments[participantIdx]?.map((tableNum, roundIdx) => (
                  <td key={`${participantLabel}-round-${roundIdx}`} className="py-4 px-6 text-center">
                    {tableNum !== null && tableNum !== undefined ? `Table ${tableNum + 1}` : 'N/A'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};