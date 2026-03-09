import type { PlatformBindingRecord, SkillRecord } from "./library";

export interface LibrarySkillSummary {
  skill: SkillRecord;
  deployments: PlatformBindingRecord[];
}

export interface SkillDeletionResult {
  skillId: string;
}
