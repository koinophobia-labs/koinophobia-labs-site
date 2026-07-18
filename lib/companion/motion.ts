export type CompanionMotionState = "resting" | "noticing" | "inviting" | "listening" | "sleeping";

export function resolveCompanionMotionState({
  open,
  invitationVisible,
  reducedMotion,
  ambientState,
}: {
  open: boolean;
  invitationVisible: boolean;
  reducedMotion: boolean;
  ambientState: CompanionMotionState;
}): CompanionMotionState {
  if (open) return "listening";
  if (invitationVisible) return "inviting";
  if (reducedMotion) return "resting";
  return ambientState;
}
