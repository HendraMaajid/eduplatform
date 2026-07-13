"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertCircle,
  Bell,
  BookOpen,
  Check,
  CheckCircle2,
  ImageUp,
  Infinity as InfinityIcon,
  Info,
  LayoutGrid,
  Loader2,
  Menu,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  UsersRound,
} from "lucide-react";
import { setLocale } from "@/app/actions";
import { api } from "@/lib/api";
import type { PlatformSettings } from "@/lib/types";
import { EduPlatformLogo } from "@/components/brand/edu-platform-logo";
import { usePlatformBrand } from "@/components/brand/platform-brand-provider";
import { normalizePlatformSettings } from "@/lib/platform-brand";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export default function AdminSettingsPage() {
  const t = useTranslations("platformSettings");
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { updateSettings: updatePlatformBrand } = usePlatformBrand();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    api
      .get<PlatformSettings>("/admin/settings")
      .then((value) => {
        setSettings(normalizePlatformSettings(value));
        setSaved(true);
      })
      .catch((cause: Error) => setError(cause.message));
  }, []);

  function update(patch: Partial<PlatformSettings>) {
    setSettings((current) => (current ? { ...current, ...patch } : current));
    setSaved(false);
  }

  async function uploadLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      toast.error(t("logoTypeError"));
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      toast.error(t("logoSizeError"));
      return;
    }

    setUploadingLogo(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await api.upload<{ url: string }>("/manage/upload", body);
      update({ logoUrl: result.url });
      toast.success(t("logoUploaded"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("logoUploadError"));
    } finally {
      setUploadingLogo(false);
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = normalizePlatformSettings(
        await api.put<PlatformSettings>("/admin/settings", settings),
      );
      setSettings(updated);
      updatePlatformBrand(updated);
      setSaved(true);
      await setLocale(updated.defaultLocale);
      router.refresh();
      toast.success(t("saved"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  if (!settings && !error) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-[680px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-5">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </header>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t("loadErrorTitle")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {settings ? (
        <form onSubmit={save}>
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <Tabs
              defaultValue="identity"
              orientation="vertical"
              className="grid gap-0 lg:grid-cols-[168px_minmax(350px,.92fr)_minmax(390px,1.08fr)]"
            >
              <TabsList
                variant="line"
                aria-label={t("sectionsAria")}
                className="grid h-auto w-full grid-cols-2 content-start gap-1 rounded-none border-b bg-muted/30 p-3 lg:flex lg:min-h-[640px] lg:flex-col lg:justify-start lg:border-r lg:border-b-0 lg:bg-transparent lg:p-3"
              >
                <TabsTrigger
                  value="identity"
                  className="h-9 flex-none justify-start px-2.5 data-active:bg-primary/10 data-active:text-primary after:right-auto after:left-0"
                >
                  <LayoutGrid data-icon="inline-start" /> {t("identity")}
                </TabsTrigger>
                <TabsTrigger
                  value="learning"
                  className="h-9 flex-none justify-start px-2.5 data-active:bg-primary/10 data-active:text-primary after:right-auto after:left-0"
                >
                  <BookOpen data-icon="inline-start" /> {t("learning")}
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="h-9 flex-none justify-start px-2.5 data-active:bg-primary/10 data-active:text-primary after:right-auto after:left-0"
                >
                  <Bell data-icon="inline-start" /> {t("notifications")}
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="h-9 flex-none justify-start px-2.5 data-active:bg-primary/10 data-active:text-primary after:right-auto after:left-0"
                >
                  <ShieldCheck data-icon="inline-start" /> {t("security")}
                </TabsTrigger>
              </TabsList>

              <div className="flex min-w-0 flex-col border-b p-5 sm:p-6 lg:min-h-[640px] lg:border-r lg:border-b-0">
                <TabsContent value="identity">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="platform-name">{t("name")}</FieldLabel>
                      <FieldDescription>{t("nameDescription")}</FieldDescription>
                      <div className="relative">
                        <Input
                          id="platform-name"
                          value={settings.name}
                          onChange={(event) => update({ name: event.target.value })}
                          maxLength={80}
                          className="pr-16"
                          required
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs tabular-nums text-muted-foreground">
                          {settings.name.length}/80
                        </span>
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="description-id">{t("platformDescriptionId")}</FieldLabel>
                      <FieldDescription>{t("platformDescriptionIdHelp")}</FieldDescription>
                      <div className="relative">
                        <Textarea
                          id="description-id"
                          rows={4}
                          value={settings.descriptionId}
                          onChange={(event) => update({ descriptionId: event.target.value })}
                          maxLength={2000}
                          className="resize-none pb-7"
                          required
                        />
                        <span className="pointer-events-none absolute right-3 bottom-2 text-xs tabular-nums text-muted-foreground">
                          {settings.descriptionId.length}/2000
                        </span>
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="description-en">{t("platformDescriptionEn")}</FieldLabel>
                      <FieldDescription>{t("platformDescriptionEnHelp")}</FieldDescription>
                      <div className="relative">
                        <Textarea
                          id="description-en"
                          rows={4}
                          value={settings.descriptionEn}
                          onChange={(event) => update({ descriptionEn: event.target.value })}
                          maxLength={2000}
                          className="resize-none pb-7"
                          required
                        />
                        <span className="pointer-events-none absolute right-3 bottom-2 text-xs tabular-nums text-muted-foreground">
                          {settings.descriptionEn.length}/2000
                        </span>
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="support-email">{t("supportEmail")}</FieldLabel>
                      <FieldDescription>{t("supportEmailDescription")}</FieldDescription>
                      <Input
                        id="support-email"
                        type="email"
                        value={settings.supportEmail}
                        onChange={(event) => update({ supportEmail: event.target.value })}
                        maxLength={255}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel>{t("platformLogo")}</FieldLabel>
                      <FieldDescription>{t("logoDescription")}</FieldDescription>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="sr-only"
                        aria-label={t("chooseLogo")}
                        onChange={(event) => void uploadLogo(event)}
                      />
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
                        <div className="flex min-h-20 items-center rounded-lg border bg-muted/20 px-4">
                          <EduPlatformLogo
                            platformName={settings.name || t("platformNameFallback")}
                            logoUrl={settings.logoUrl}
                            markClassName="size-11"
                            wordmarkClassName="text-lg"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={uploadingLogo}
                            onClick={() => logoInputRef.current?.click()}
                          >
                            {uploadingLogo ? (
                              <Loader2 data-icon="inline-start" className="animate-spin" />
                            ) : (
                              <Upload data-icon="inline-start" />
                            )}
                            {settings.logoUrl ? t("changeLogo") : t("chooseLogo")}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            className="w-full"
                            disabled={!settings.logoUrl || uploadingLogo}
                            onClick={() => update({ logoUrl: "" })}
                          >
                            <Trash2 data-icon="inline-start" /> {t("removeLogo")}
                          </Button>
                        </div>
                      </div>
                    </Field>
                  </FieldGroup>
                </TabsContent>

                <TabsContent value="learning">
                  <FieldSet>
                    <FieldLegend>{t("learningPreferences")}</FieldLegend>
                    <FieldDescription>{t("learningPreferencesDescription")}</FieldDescription>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="issuer">{t("certificateIssuer")}</FieldLabel>
                        <FieldDescription>{t("certificateIssuerDescription")}</FieldDescription>
                        <Input
                          id="issuer"
                          value={settings.certificateIssuer}
                          onChange={(event) => update({ certificateIssuer: event.target.value })}
                          maxLength={120}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="default-locale">{t("defaultLanguage")}</FieldLabel>
                        <FieldDescription>{t("defaultLanguageDescription")}</FieldDescription>
                        <Select
                          value={settings.defaultLocale}
                          onValueChange={(value) =>
                            update({ defaultLocale: (value || "id") as "id" | "en" })
                          }
                        >
                          <SelectTrigger id="default-locale" aria-label={t("defaultLanguage")}>
                            <SelectValue>
                              {settings.defaultLocale === "en" ? "English" : "Indonesia"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="id">Indonesia</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>
                    </FieldGroup>
                  </FieldSet>
                </TabsContent>

                <TabsContent value="notifications">
                  <FieldSet>
                    <FieldLegend>{t("adminNotifications")}</FieldLegend>
                    <FieldDescription>{t("adminNotificationsDescription")}</FieldDescription>
                    <FieldGroup>
                      {[
                        [t("newRegistration"), "notifyNewRegistration"],
                        [t("newSubmission"), "notifyNewSubmission"],
                        [t("gradePublished"), "notifyGradePublished"],
                      ].map(([label, key]) => (
                        <Field key={key} orientation="horizontal" className="rounded-lg border p-4">
                          <FieldContent>
                            <FieldLabel htmlFor={key}>{label}</FieldLabel>
                            <FieldDescription>{t("notificationDescription")}</FieldDescription>
                          </FieldContent>
                          <Switch
                            id={key}
                            checked={
                              settings[
                                key as keyof Pick<
                                  PlatformSettings,
                                  | "notifyNewRegistration"
                                  | "notifyNewSubmission"
                                  | "notifyGradePublished"
                                >
                              ] as boolean
                            }
                            onCheckedChange={(checked) => update({ [key]: checked })}
                          />
                        </Field>
                      ))}
                    </FieldGroup>
                  </FieldSet>
                </TabsContent>

                <TabsContent value="security">
                  <Alert>
                    <ShieldCheck />
                    <AlertTitle>{t("securityTitle")}</AlertTitle>
                    <AlertDescription>{t("securityDescription")}</AlertDescription>
                  </Alert>
                  <div className="mt-5 grid gap-3">
                    {[t("securityUpload"), t("securityAccess"), t("securityFallback")].map(
                      (item) => (
                        <div key={item} className="flex items-start gap-3 rounded-lg border p-4">
                          <CheckCircle2 className="mt-0.5 shrink-0 text-primary" />
                          <p className="leading-6 text-muted-foreground">{item}</p>
                        </div>
                      ),
                    )}
                  </div>
                </TabsContent>

                <div className="mt-auto flex flex-col gap-3 pt-7 sm:flex-row sm:items-center">
                  <Button
                    type="submit"
                    size="lg"
                    className="h-10 px-5 playful-shadow"
                    disabled={saving || uploadingLogo}
                  >
                    {saving ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <Save data-icon="inline-start" />
                    )}
                    {t("save")}
                  </Button>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {saved ? <Check className="text-primary" /> : <Info />}
                    {saved ? t("allChangesSaved") : t("unsavedChanges")}
                  </span>
                </div>
              </div>

              <section className="min-w-0 bg-muted/10 p-5 sm:p-6" aria-labelledby="public-preview">
                <h2 id="public-preview" className="font-bold">
                  {t("publicPreview")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("publicPreviewDescription")}
                </p>

                <Card className="mt-5 min-h-[520px] [--card-spacing:--spacing(5)]">
                  <CardHeader className="border-b">
                    <CardTitle>
                      <EduPlatformLogo
                        platformName={settings.name || t("platformNameFallback")}
                        logoUrl={settings.logoUrl}
                        markClassName="size-8"
                        wordmarkClassName="text-base"
                      />
                    </CardTitle>
                    <CardAction>
                      <Menu className="text-muted-foreground" aria-hidden="true" />
                    </CardAction>
                  </CardHeader>
                  <CardContent className="grid flex-1 items-center gap-5 py-4 md:grid-cols-[1fr_.9fr] lg:grid-cols-1 xl:grid-cols-[1fr_.9fr]">
                    <div>
                      <CardTitle className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                        {t("previewHeroTitle")}
                      </CardTitle>
                      <CardDescription className="mt-3 line-clamp-4 leading-6">
                        {(settings.defaultLocale === "en"
                          ? settings.descriptionEn
                          : settings.descriptionId) || t("previewHeroDescription")}
                      </CardDescription>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Button type="button">{t("browseCourses")}</Button>
                        <Button type="button" variant="outline">
                          {t("aboutUs")}
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-xl bg-primary/5">
                      <Image
                        src="/illustrations/hero-learners.png"
                        alt={t("previewImageAlt")}
                        width={1448}
                        height={1086}
                        className="h-auto w-full object-contain"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="grid gap-2 bg-muted/30 sm:grid-cols-3">
                    {[
                      [ImageUp, t("freeBenefit"), t("freeBenefitDescription")],
                      [UsersRound, t("studentBenefit"), t("studentBenefitDescription")],
                      [InfinityIcon, t("accessBenefit"), t("accessBenefitDescription")],
                    ].map(([Icon, title, description]) => {
                      const BenefitIcon = Icon as typeof ImageUp;
                      return (
                        <div
                          key={title as string}
                          className="flex items-start gap-2 rounded-lg p-2"
                        >
                          <BenefitIcon className="mt-0.5 shrink-0 text-primary" />
                          <span className="min-w-0">
                            <span className="block text-xs font-bold">{title as string}</span>
                            <span className="mt-0.5 block text-[10px] leading-4 text-muted-foreground">
                              {description as string}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </CardFooter>
                </Card>
              </section>
            </Tabs>
          </div>
        </form>
      ) : null}

      <Alert className="border-primary/20 bg-primary/5 px-4 py-4">
        <Info className="text-primary" />
        <AlertTitle className="text-primary">{t("publicRegistrationTitle")}</AlertTitle>
        <AlertDescription>{t("publicRegistrationDescription")}</AlertDescription>
      </Alert>
    </div>
  );
}
