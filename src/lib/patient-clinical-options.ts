/** Quick picks for physio practice — always overridable with free text. */

export const CONDITION_OPTIONS = [
  "Lower back pain",
  "Neck / cervical pain",
  "Shoulder pain",
  "Frozen shoulder",
  "Elbow / wrist pain",
  "Hip pain",
  "Knee pain",
  "Ankle / foot pain",
  "Post-op rehab",
  "Sports injury",
  "Postural / desk strain",
  "Prenatal / postnatal",
  "Balance / falls risk",
  "General mobility",
] as const;

export const PRECAUTION_OPTIONS = [
  "Avoid heavy lifting",
  "Pain-limited range only",
  "No high-impact loading",
  "Protect surgical site",
  "Monitor dizziness / vitals",
  "Hypertension / cardiac caution",
  "Pregnancy-related limits",
  "Osteoporosis — careful loading",
  "Recent injection / procedure",
  "None noted",
] as const;

export const TREATMENT_GOAL_OPTIONS = [
  "Reduce pain",
  "Restore range of motion",
  "Rebuild strength",
  "Improve function / ADLs",
  "Return to work",
  "Return to sport",
  "Improve balance / reduce falls",
  "Patient education / self-management",
  "Post-op protocol progression",
] as const;
