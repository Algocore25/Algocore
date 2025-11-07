import React, { useMemo } from 'react';

const ActivityCalendar = ({ submissions }) => {
  // If no submissions, return a message or empty
  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        No submission activity in the last 6 months.
      </div>
    );
  }

  // Calculate the start date (6 months ago from today)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 6);

  // Set grid start to Sunday before startDate
  const gridStartDate = new Date(startDate);
  gridStartDate.setDate(gridStartDate.getDate() - gridStartDate.getDay());

  // Set grid end to Saturday after endDate
  const gridEndDate = new Date(endDate);
  gridEndDate.setDate(gridEndDate.getDate() + (6 - gridEndDate.getDay()));

  // Create map for submission counts
  const countsMap = useMemo(() => {
    const map = new Map();
    submissions.forEach(sub => {
      const date = new Date(sub.timestamp);
      const dateStr = date.toISOString().split('T')[0];
      map.set(dateStr, (map.get(dateStr) || 0) + 1);
    });
    return map;
  }, [submissions]);

  // Generate all days in grid
  const days = useMemo(() => {
    const daysArray = [];
    const currentDay = new Date(gridStartDate);
    
    while (currentDay <= gridEndDate) {
      const dateStr = currentDay.toISOString().split('T')[0];
      daysArray.push({
        date: new Date(currentDay),
        dateStr,
        count: countsMap.get(dateStr) || 0,
        dayOfMonth: currentDay.getDate(),
        month: currentDay.getMonth(),
        year: currentDay.getFullYear()
      });
      currentDay.setDate(currentDay.getDate() + 1);
    }
    return daysArray;
  }, [gridStartDate, gridEndDate, countsMap]);

  // Group days by weeks
  const weeks = useMemo(() => {
    const weeksArray = [];
    for (let i = 0; i < days.length; i += 7) {
      weeksArray.push(days.slice(i, i + 7));
    }
    return weeksArray;
  }, [days]);

  // Get month labels
  const monthLabels = useMemo(() => {
    const labels = [];
    let currentMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0];
      if (firstDay && firstDay.month !== currentMonth) {
        currentMonth = firstDay.month;
        labels.push({
          weekIndex,
          label: firstDay.date.toLocaleString('default', { month: 'short' })
        });
      }
    });
    return labels;
  }, [weeks]);

  // Function to get the color for a count
  const getColor = (count) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-700';
    if (count <= 2) return 'bg-green-100 dark:bg-green-900';
    if (count <= 4) return 'bg-green-200 dark:bg-green-800';
    if (count <= 6) return 'bg-green-300 dark:bg-green-700';
    if (count <= 8) return 'bg-green-400 dark:bg-green-600';
    return 'bg-green-500 dark:bg-green-500';
  };

  return (
    <div className="activity-calendar max-w-full overflow-hidden">
      {/* Enhanced Legend */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Submission Activity
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded-sm bg-green-100 dark:bg-green-900" />
            <div className="w-4 h-4 rounded-sm bg-green-300 dark:bg-green-700" />
            <div className="w-4 h-4 rounded-sm bg-green-500 dark:bg-green-500" />
          </div>
          <span className="text-gray-600 dark:text-gray-400">More</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 pt-6 text-xs text-gray-500 dark:text-gray-400">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
            <div key={day} className="h-6 md:h-8 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>
        
        <div className="flex-1 overflow-x-auto pb-2">
          {/* Month labels */}
          <div className="flex gap-1 mb-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
            {monthLabels.map(({ weekIndex, label }) => (
              <div 
                key={`${weekIndex}-${label}`} 
                className="w-6 md:w-8 text-center"
                style={{ marginLeft: weekIndex === 0 ? '0' : '0.25rem' }}
              >
                {label}
              </div>
            ))}
          </div>
          
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`relative w-6 h-6 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-all duration-200 transform hover:scale-110 cursor-pointer ${getColor(day.count)}`}
                    title={`${day.date.toLocaleDateString()}: ${day.count} submission${day.count === 1 ? '' : 's'}`}
                  >
                    <span className="text-[10px] md:text-xs font-medium text-gray-700 dark:text-gray-300">
                      {day.dayOfMonth}
                    </span>
                    {day.count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] md:text-xs rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                        {day.count}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Hover over a day to see details
      </div>
    </div>
  );
};

export default ActivityCalendar;
