"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setLocale } from "@/app/actions";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { ThemePreference, User, UserPreference } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Bell, KeyRound, Loader2, UserRound } from "lucide-react";

type AccountResponse = { user: User; preferences: UserPreference };

const fallbackPreference: UserPreference = {
  userId: "",
  locale: "id",
  theme: "system",
  notifyCourseUpdates: true,
  notifyAssignments: true,
  notifyGrades: true,
  createdAt: "",
  updatedAt: "",
};

export default function AccountSettingsPage() {
  const t = useTranslations("accountSettings");
  const { setTheme } = useTheme();
  const router = useRouter();
  const setAppLocale = useAppStore((state) => state.setLocale);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreference>(fallbackPreference);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    api
      .get<AccountResponse>("/users/me")
      .then((account) => {
        setUser(account.user);
        setPreferences(account.preferences);
      })
      .catch((cause: Error) => setError(cause.message))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const updated = await api.patch<User>("/users/me", {
        name: user.name,
        bio: user.bio || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
      });
      setUser(updated);
      toast.success(t("profileSaved"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("profileSaveError"));
    } finally {
      setSaving(false);
    }
  }

  async function savePreferences() {
    setSaving(true);
    try {
      const updated = await api.put<UserPreference>("/users/me/preferences", preferences);
      setPreferences(updated);
      setTheme(updated.theme);
      setAppLocale(updated.locale);
      await setLocale(updated.locale);
      router.refresh();
      toast.success(t("preferencesSaved"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("preferencesSaveError"));
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put<void>("/users/me/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      toast.success(t("passwordUpdated"));
      await signOut({ callbackUrl: "/login" });
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("passwordUpdateError"));
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-80 w-full" />
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {user && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="text-primary" />
              {t("profile")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile}>
              <FieldGroup>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="profile-name">{t("name")}</FieldLabel>
                    <Input
                      id="profile-name"
                      value={user.name}
                      onChange={(event) => setUser({ ...user, name: event.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="profile-email">{t("email")}</FieldLabel>
                    <Input id="profile-email" value={user.email} readOnly disabled />
                    <FieldDescription>{t("emailDescription")}</FieldDescription>
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="profile-bio">{t("bio")}</FieldLabel>
                  <Textarea
                    id="profile-bio"
                    rows={4}
                    value={user.bio || ""}
                    onChange={(event) => setUser({ ...user, bio: event.target.value })}
                    placeholder={t("bioPlaceholder")}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="profile-phone">{t("phone")}</FieldLabel>
                  <Input
                    id="profile-phone"
                    value={user.phone || ""}
                    onChange={(event) => setUser({ ...user, phone: event.target.value })}
                    placeholder={t("optional")}
                  />
                </Field>
                <Button type="submit" className="w-fit" disabled={saving}>
                  {saving && <Loader2 className="animate-spin" />}
                  {t("saveProfile")}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="text-primary" />
            {t("preferences")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="locale">{t("language")}</FieldLabel>
              <Select
                value={preferences.locale}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, locale: (value || "id") as "id" | "en" })
                }
              >
                <SelectTrigger id="locale" aria-label={t("language")}>
                  <SelectValue>{preferences.locale === "en" ? "English" : "Indonesia"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="id">Indonesia</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="theme">{t("theme")}</FieldLabel>
              <Select
                value={preferences.theme}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, theme: (value || "system") as ThemePreference })
                }
              >
                <SelectTrigger id="theme" aria-label={t("theme")}>
                  <SelectValue>
                    {preferences.theme === "light"
                      ? t("themeLight")
                      : preferences.theme === "dark"
                        ? t("themeDark")
                        : t("themeSystem")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="light">{t("themeLight")}</SelectItem>
                    <SelectItem value="dark">{t("themeDark")}</SelectItem>
                    <SelectItem value="system">{t("themeSystem")}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
          {[
            [t("courseUpdates"), "notifyCourseUpdates"],
            [t("assignments"), "notifyAssignments"],
            [t("grades"), "notifyGrades"],
          ].map(([label, key]) => (
            <label key={key} className="flex items-center justify-between gap-4 border-t pt-4">
              <span>
                <span className="block font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {t("notificationDescription")}
                </span>
              </span>
              <Switch
                checked={
                  preferences[
                    key as keyof Pick<
                      UserPreference,
                      "notifyCourseUpdates" | "notifyAssignments" | "notifyGrades"
                    >
                  ] as boolean
                }
                onCheckedChange={(checked) => setPreferences({ ...preferences, [key]: checked })}
              />
            </label>
          ))}
          <Button onClick={savePreferences} disabled={saving}>
            {t("savePreferences")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="text-primary" />
            {t("password")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword}>
            <FieldGroup>
              {user?.hasPassword && (
                <Field>
                  <FieldLabel htmlFor="current-password">{t("currentPassword")}</FieldLabel>
                  <Input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="new-password">{t("newPassword")}</FieldLabel>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
                <FieldDescription>{t("passwordHint")}</FieldDescription>
              </Field>
              <Button type="submit" className="w-fit" disabled={saving}>
                {t("updatePassword")}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
