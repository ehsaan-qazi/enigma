export const vivaRecordingSchema = {
  maxDurationSeconds: 180, // 3 minutes per answer
  minDurationSeconds: 3,
  supportedMimeTypes: ["audio/webm", "audio/mp4", "audio/wav", "audio/ogg"],
};

export function validateRecordingDuration(seconds: number): string | null {
  if (seconds < vivaRecordingSchema.minDurationSeconds) {
    return `Audio response is too short. Please provide at least ${vivaRecordingSchema.minDurationSeconds} seconds of verbal explanation.`;
  }
  if (seconds > vivaRecordingSchema.maxDurationSeconds) {
    return `Audio response exceeds the maximum limit of ${vivaRecordingSchema.maxDurationSeconds / 60} minutes.`;
  }
  return null;
}
