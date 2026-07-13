import type { PlatformSettings } from "@/lib/types";

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  id: 1,
  name: "EduCourse",
  descriptionId: "Platform belajar teknologi gratis untuk semua.",
  descriptionEn: "A free technology learning platform for everyone.",
  supportEmail: "support@educourse.id",
  logoUrl: "",
  defaultLocale: "id",
  certificateIssuer: "EduCourse",
  notifyNewRegistration: true,
  notifyNewSubmission: true,
  notifyGradePublished: true,
  createdAt: "",
  updatedAt: "",
};

type PlatformSettingsPayload = Partial<PlatformSettings> & { description?: string };

/** Keep public pages usable while the bilingual description migration rolls out. */
export function normalizePlatformSettings(
  value?: PlatformSettingsPayload | null,
): PlatformSettings {
  if (!value) return DEFAULT_PLATFORM_SETTINGS;
  return {
    ...DEFAULT_PLATFORM_SETTINGS,
    ...value,
    descriptionId:
      value.descriptionId?.trim() ||
      value.description?.trim() ||
      DEFAULT_PLATFORM_SETTINGS.descriptionId,
    descriptionEn: value.descriptionEn?.trim() || DEFAULT_PLATFORM_SETTINGS.descriptionEn,
  };
}
