export const createId = () => Math.random().toString(36).substr(2, 9);

export const getInitialDuration = (editingEvent?: any) => {
  if (!editingEvent) return "30 min";

  const duration = editingEvent.duration;
  if (duration === 15) return "15 min";
  if (duration === 30) return "30 min";
  if (duration === 45) return "45 min";
  if (duration === 60) return "1 hr";
  return "Custom";
};

export const getInitialCustomValue = (editingEvent?: any) => {
  if (!editingEvent) return "";

  const duration = editingEvent.duration;
  if ([15, 30, 45, 60].includes(duration)) return "";
  return duration >= 60 && duration % 60 === 0
    ? (duration / 60).toString()
    : duration.toString();
};

export const getInitialCustomUnit = (editingEvent?: any) => {
  if (!editingEvent) return "min";

  const duration = editingEvent.duration;
  if ([15, 30, 45, 60].includes(duration)) return "min";
  return duration >= 60 && duration % 60 === 0 ? "hr" : "min";
};

export const formatOverrideDateRange = (dates: any[]) => {
  if (dates.length === 0) return "";

  const sorted = [...dates]
    .map((date) => new Date(date))
    .sort((a, b) => a.getTime() - b.getTime());
  const start = sorted[0];
  const end = sorted[sorted.length - 1];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (sorted.length === 1) {
    return `${monthNames[start.getMonth()]} ${start.getDate()}`;
  }

  const isConsecutive = sorted.every((date, index) => {
    if (index === sorted.length - 1) return true;
    return sorted[index + 1].getTime() - date.getTime() <= 86400000;
  });

  if (isConsecutive) {
    return `${monthNames[start.getMonth()]} ${start.getDate()} – ${end.getDate()}`;
  }

  return `${monthNames[start.getMonth()]} ${start.getDate()}, ...`;
};
