export const SECTORS = ["Knowledge", "Insurance", "Commerce", "Healthcare", "Finance", "Education", "Public sector", "Other"] as const;
export const ENGAGEMENTS = ["Managed project", "Embedded team", "Individual contract", "Internship or placement", "Not sure yet"] as const;
export const COMMUNITY_KINDS = ["University or college", "Hackathon community", "Innovation hub", "Bootcamp", "Other"] as const;
export const ATTEND_AS = ["Builder demonstrating a project", "Employer or founder", "Visitor", "Campus or community partner"] as const;
export const TOPICS = ["I’m a builder", "I need a team", "I connect people", "Partnership", "Press or other"] as const;
export const PARTNER_TYPES = [
  "Hackathon or builder community",
  "University, college or campus zone",
  "Incubator or accelerator",
  "Advisory or consulting firm",
  "Employer or startup",
  "Funder or sponsor",
  "Other",
] as const;
export const PARTNER_WAYS = [
  "Send builders our way",
  "Bring problems for builders to solve",
  "Host or co-run an Open House",
  "Co-run a hackathon challenge track",
  "Sponsor or fund placements",
  "Not sure yet, let’s talk",
] as const;

export const opts = (a: readonly string[], placeholder?: string) => [
  ...(placeholder ? [{ value: "", label: placeholder }] : []),
  ...a.map((v) => ({ value: v, label: v })),
];

/** Illustrative briefs from the landing page, also used to prefill "Shape a project like this". */
export const SHOWCASE = [
  {
    key: "Knowledge", desk: "KNOWLEDGE DESK", head: ["Find the answer.", "Keep the source."],
    steps: ["Ask a policy question", "Retrieve approved references", "Review the source-backed answer"],
    tag: "Brief 01 / Internal knowledge", h: "Make institutional knowledge useful.",
    b: "Help teams find answers across approved documents, with clear source references and a review step when information is uncertain.",
  },
  {
    key: "Insurance", desk: "CLAIMS WORKSPACE", head: ["A clearer path", "for every claim."],
    steps: ["Receive claim documents", "Extract and check key details", "Send exceptions to a reviewer"],
    tag: "Brief 02 / Insurance", h: "Give claims teams time to think.",
    b: "Extract document details, identify missing information and prepare a structured summary, keeping claim decisions with authorised reviewers.",
  },
  {
    key: "Commerce", desk: "CUSTOMER DESK", head: ["Helpful answers.", "Clear handovers."],
    steps: ["Receive a customer question", "Search approved product information", "Escalate complex requests"],
    tag: "Brief 03 / Commerce", h: "Make every interaction more useful.",
    b: "Support routine product questions using approved information, with a clear route to a person for complex or uncertain requests.",
  },
  {
    key: "Healthcare", desk: "REFERRAL DESK", head: ["Less administration.", "More clarity."],
    steps: ["Receive referral information", "Draft an administrative summary", "Review and route to the care team"],
    tag: "Brief 04 / Healthcare", h: "Help care teams coordinate.",
    b: "Organise administrative referral information and highlight missing details for staff review. The illustrative workflow does not make clinical decisions.",
  },
] as const;

export const STATUS_CHIP: Record<string, string> = {
  PENDING: "orange", OPEN: "ok", IN_PROGRESS: "blue", CLOSED: "", REJECTED: "bad",
  SUBMITTED: "", SHORTLISTED: "blue", ACCEPTED: "ok", DECLINED: "bad",
};
export const pretty = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ");
