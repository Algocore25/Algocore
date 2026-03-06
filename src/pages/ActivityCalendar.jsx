import React, { useMemo } from "react";

const ActivityCalendar = ({ submissions }) => {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-8 text-[#656d76] dark:text-[#7d8590] bg-white dark:bg-[#0d1117] rounded-lg border border-[#d0d7de] dark:border-[#30363d]">
        No submission activity in the last 6 months.
      </div>
    );
  }

  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(today.getMonth() - 6);

  // Align grid start to Sunday before startDate
  const gridStart = new Date(startDate);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  // Align grid end to Saturday after today
  const gridEnd = new Date(today);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  // Helper to get local date string YYYY-MM-DD
  const getLocalDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Map submission counts per date
  const countsMap = useMemo(() => {
    const map = new Map();
    submissions.forEach((s) => {
      const d = new Date(s.timestamp);
      const dateStr = getLocalDateStr(d);
      map.set(dateStr, (map.get(dateStr) || 0) + 1);
    });
    return map;
  }, [submissions]);

  // Build all days from start to end
  const allDays = useMemo(() => {
    const days = [];
    const cur = new Date(gridStart);
    while (cur <= gridEnd) {
      const dateStr = getLocalDateStr(cur);
      days.push({
        date: new Date(cur),
        dateStr,
        count: countsMap.get(dateStr) || 0,
        dayOfMonth: cur.getDate(),
      });
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [gridStart, gridEnd, countsMap]);

  // Group into weeks
  const weeks = useMemo(() => {
    const arr = [];
    for (let i = 0; i < allDays.length; i += 7) {
      arr.push(allDays.slice(i, i + 7));
    }
    return arr;
  }, [allDays]);

  // Month labels - show label on the first week of each month
  const monthLabels = useMemo(() => {
    const labels = [];
    const seenMonths = new Set();

    weeks.forEach((week, weekIndex) => {
      for (const day of week) {
        const monthYear = `${day.date.getFullYear()}-${day.date.getMonth()}`;
        if (!seenMonths.has(monthYear)) {
          seenMonths.add(monthYear);
          labels.push({
            weekIndex: weekIndex,
            label: day.date.toLocaleString("default", { month: "short" }),
          });
          break;
        }
      }
    });

    return labels;
  }, [weeks]);

  // Color scale matching GitHub's exact colors
  const getColor = (count) => {
    if (count === 0) return "bg-[#ebedf0] dark:bg-[#161b22]";
    if (count <= 2) return "bg-[#9be9a8] dark:bg-[#0e4429]";
    if (count <= 4) return "bg-[#40c463] dark:bg-[#006d32]";
    if (count <= 6) return "bg-[#30a14e] dark:bg-[#26a641]";
    return "bg-[#216e39] dark:bg-[#39d353]";
  };

  const cellSize = 12;
  const cellGap = 3;
  const weekWidth = cellSize + cellGap;

  return (
    <div className="w-full bg-white dark:bg-[#0d1117] rounded-lg border border-[#d0d7de] dark:border-[#30363d] p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h3 className="text-sm font-semibold text-[#1f2328] dark:text-[#e6edf3]">
          {submissions.length} submissions in the last 6 months
        </h3>
      </div>

      <div className="flex gap-2">
        {/* Day labels */}
        <div
          className="hidden sm:flex flex-col text-[10px] text-[#656d76] dark:text-[#7d8590] mt-[20px]"
          style={{
            gap: `${cellGap}px`
          }}
        >
          <div style={{ height: `${cellSize}px` }} className="flex items-center leading-none">Sun</div>
          <div style={{ height: `${cellSize}px` }} className="flex items-center leading-none">Mon</div>
          <div style={{ height: `${cellSize}px` }} className="flex items-center leading-none">Tue</div>
          <div style={{ height: `${cellSize}px` }} className="flex items-center leading-none">Wed</div>
          <div style={{ height: `${cellSize}px` }} className="flex items-center leading-none">Thu</div>
          <div style={{ height: `${cellSize}px` }} className="flex items-center leading-none">Fri</div>
          <div style={{ height: `${cellSize}px` }} className="flex items-center leading-none">Sat</div>
        </div>

        {/* Grid section */}
        <div className="flex-1 min-w-0">
          {/* Month labels */}
          <div
            className="relative text-xs font-medium text-[#656d76] dark:text-[#7d8590] mb-2"
            style={{ height: '20px' }}
          >
            {monthLabels.map(({ weekIndex, label }) => (
              <span
                key={`${weekIndex}-${label}`}
                className="absolute whitespace-nowrap"
                style={{
                  left: `${weekIndex * weekWidth}px`,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Weekly columns */}
          <div
            className="flex overflow-x-auto pb-2"
            style={{ gap: `${cellGap}px` }}
          >
            {weeks.map((week, i) => (
              <div
                key={i}
                className="flex flex-col flex-shrink-0"
                style={{ gap: `${cellGap}px` }}
              >
                {week.map((day, j) => {
                  const isToday = day.dateStr === getLocalDateStr(today);
                  const hasSubmissions = day.count > 0;

                  return (
                    <div
                      key={j}
                      title={`${day.date.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}: ${day.count} submission${day.count === 1 ? "" : "s"}`}
                      className={`rounded-sm ${getColor(
                        day.count
                      )} ${isToday ? "ring-1 ring-[#0969da] dark:ring-[#58a6ff]" : ""} cursor-pointer transition-colors border border-[rgba(27,31,36,0.06)] dark:border-transparent relative`}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-between items-center text-xs text-[#656d76] dark:text-[#7d8590]">
        <a href="#" className="hover:text-[#0969da] dark:hover:text-[#58a6ff]">Learn how we count contributions</a>
        <div className="flex items-center gap-1">
          <span className="mr-1">Less</span>
          {[0, 2, 4, 6, 8].map((v, i) => (
            <div key={i} className={`w-[11px] h-[11px] rounded-sm ${getColor(v)} border border-[rgba(27,31,36,0.06)] dark:border-transparent`} />
          ))}
          <span className="ml-1">More</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityCalendar;