/**
 * Canonical skill catalogue used by onboarding and discovery.
 * The database `skills` table is the source of truth; this drives the
 * category grouping in the UI and seeds any custom skill a student adds.
 */
export const SKILL_CATEGORIES: Record<string, string[]> = {
  Programming: [
    "C++",
    "C",
    "Java",
    "Python",
    "JavaScript",
    "HTML",
    "CSS",
    "React",
    "Data Structures & Algorithms",
    "Machine Learning",
    "Web Development",
  ],
  Design: ["UI/UX", "Figma", "Graphic Design", "Video Editing"],
  Academic: ["Mathematics", "Physics", "Chemistry", "Biology", "Economics"],
  Communication: [
    "Public Speaking",
    "English",
    "Communication Skills",
    "Presentation Skills",
  ],
  Other: [
    "Photography",
    "Music",
    "Marketing",
    "Content Writing",
    "Entrepreneurship",
  ],
};

export const EXPERIENCE_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const TIME_SLOTS = ["Morning", "Afternoon", "Evening", "Night"] as const;

export const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Postgraduate",
] as const;

export const BOOK_CATEGORIES = [
  "Programming",
  "Web Development",
  "Data Science",
  "AI/ML",
  "Design",
  "Business",
  "Mathematics",
  "Science",
  "Communication",
  "Personal Development",
];
