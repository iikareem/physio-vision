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

export type DiagnosisGroup = {
  region: string;
  options: readonly string[];
};

/** Working impressions grouped by body area — not medical diagnoses. */
export const DIAGNOSIS_GROUPS: readonly DiagnosisGroup[] = [
  {
    region: "Spine",
    options: [
      "Lumbar strain / sprain",
      "Disc-related low back pain",
      "Sciatica / radicular symptoms",
      "Cervical strain",
      "Thoracic / mid-back pain",
      "Postural neck–shoulder syndrome",
    ],
  },
  {
    region: "Shoulder & arm",
    options: [
      "Rotator cuff related pain",
      "Adhesive capsulitis (frozen shoulder)",
      "Shoulder impingement pattern",
      "AC joint irritation",
      "Tennis / golfer’s elbow",
      "Wrist / hand tendinopathy",
    ],
  },
  {
    region: "Hip & knee",
    options: [
      "Hip osteoarthritis pattern",
      "Gluteal / lateral hip pain",
      "Patellofemoral pain",
      "ACL / ligament rehab",
      "Meniscus-related knee pain",
      "Knee osteoarthritis pattern",
      "IT band / lateral knee pain",
    ],
  },
  {
    region: "Foot & ankle",
    options: [
      "Ankle sprain",
      "Plantar fasciitis",
      "Achilles tendinopathy",
      "Post-fracture foot / ankle rehab",
    ],
  },
  {
    region: "Other",
    options: [
      "General deconditioning",
      "Balance / vestibular related",
      "Post-op protocol (specify)",
      "Sports overload / overuse",
      "To be confirmed after eval",
    ],
  },
] as const;

export const DIAGNOSIS_OPTIONS = DIAGNOSIS_GROUPS.flatMap((g) => [
  ...g.options,
]) as readonly string[];

export const CHIEF_COMPLAINT_OPTIONS = [
  "Pain with movement",
  "Stiffness / limited ROM",
  "Weakness",
  "Swelling",
  "Numbness / tingling",
  "Difficulty walking",
  "Difficulty with daily activities",
  "Return to sport / work",
  "Post-surgery recovery",
  "Prevent re-injury",
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
