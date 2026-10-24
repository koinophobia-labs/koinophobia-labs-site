/** Shared form constraints; App Store details use the existing lead notes field. */
export const appStoreFields: {
  name: string;
  label: string;
  maxLength: number;
  optional?: boolean;
  options?: string[];
  multiline?: boolean;
}[] = [
  { name: "appName", label: "App name", maxLength: 160 },
  { name: "appStack", label: "How was it built? (tool or stack)", maxLength: 300 },
  { name: "appPlatform", label: "Platform", maxLength: 80, options: ["iPhone", "iPad", "Mac", "Multiple Apple platforms", "Other / not sure"] },
  { name: "appStage", label: "Stage", maxLength: 80, options: ["Not submitted", "Rejected", "In TestFlight"] },
  { name: "appRejection", label: "Rejection text (optional; remove private information)", maxLength: 3000, optional: true, multiline: true },
  { name: "developerAccount", label: "Do you have an Apple Developer account?", maxLength: 3, options: ["Yes", "No"] },
];

export const appStoreBudgets = ["$250", "$400–$600", "$750–$1,500", "$2,500–$5,000", "Not sure yet"];

export function validateAppStoreFields(form: FormData) {
  const errors: Record<string, string> = {};
  for (const field of appStoreFields) {
    const value = String(form.get(field.name) || "").trim();
    if (!value && !field.optional) errors[field.name] = "This field is required.";
    else if (value.length > field.maxLength) errors[field.name] = `Must be ${field.maxLength} characters or fewer.`;
    else if (value && field.options && !field.options.includes(value)) errors[field.name] = "Choose one of the listed options.";
  }
  return errors;
}
