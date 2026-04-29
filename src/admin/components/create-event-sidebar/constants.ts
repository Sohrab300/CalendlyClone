import type { DayAvailability, TimeSlot } from "../../../services/availabilityService";

export const DAYS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const INITIAL_AVAILABILITY: DayAvailability[] = [
  { day_index: 0, enabled: false, slots: [] },
  {
    day_index: 1,
    enabled: true,
    slots: [{ id: "1", start: "9:00am", end: "5:00pm" }],
  },
  {
    day_index: 2,
    enabled: true,
    slots: [{ id: "2", start: "9:00am", end: "5:00pm" }],
  },
  {
    day_index: 3,
    enabled: true,
    slots: [{ id: "3", start: "9:00am", end: "5:00pm" }],
  },
  {
    day_index: 4,
    enabled: true,
    slots: [{ id: "4", start: "9:00am", end: "5:00pm" }],
  },
  {
    day_index: 5,
    enabled: true,
    slots: [{ id: "5", start: "9:00am", end: "5:00pm" }],
  },
  { day_index: 6, enabled: false, slots: [] },
];

export const DEFAULT_MODAL_SLOT: TimeSlot = {
  id: "1",
  start: "9:00am",
  end: "5:00pm",
};

export const EVENT_COLORS = [
  { name: "Red", value: "#FF471A" },
  { name: "Light pink", value: "#FF6680" },
  { name: "Magenta", value: "#E600E6" },
  { name: "Violet", value: "#8247E5" },
  { name: "Blue", value: "#0066FF" },
  { name: "Cyan", value: "#00E6E6" },
  { name: "Lime green", value: "#1AE61A" },
  { name: "Electric lime", value: "#BFFF00" },
  { name: "Bright yellow", value: "#FFD700" },
  { name: "Orange", value: "#FF9900" },
];

export const DURATION_OPTIONS = ["15 min", "30 min", "45 min", "1 hr", "Custom"];

export const BUFFER_OPTIONS = [
  { label: "0 min", value: 0 },
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hr", value: 60 },
  { label: "1 hr 30 min", value: 90 },
  { label: "2 hr", value: 120 },
  { label: "2 hr 30 min", value: 150 },
  { label: "3 hr", value: 180 },
];

export const INCREMENT_OPTIONS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "20 min", value: 20 },
  { label: "30 min", value: 30 },
  { label: "60 min", value: 60 },
];

export const QUILL_MODULES = {
  toolbar: [
    ["bold", "italic", "underline"],
    [{ list: "bullet" }, { list: "ordered" }],
    ["link"],
    ["clean"],
  ],
};
