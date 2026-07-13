"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import { Search, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PaginationControl } from "@/components/ui/pagination-control";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { api } from "@/lib/api";
import type { PaginatedResponse, User, UserRole } from "@/lib/types";

type ManagedRole = "student" | "teacher" | "admin" | "super_admin";
type UserListRole = "all" | ManagedRole;
type JoinedPeriod = "all" | "7d" | "30d";

const PAGE_SIZE = 10;

export function UserManagement({ role }: { role: "all" | "student" | "teacher" }) {
  const t = useTranslations("userManagement");
  const roleT = useTranslations("roles");
  const format = useFormatter();
  const { data: session } = useSession();
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserListRole>(role);
  const [joined, setJoined] = useState<JoinedPeriod>("all");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<ManagedRole>(role === "all" ? "student" : role);
  const debouncedSearch = useDebounce(search, 250);
  const isTeacherView = role === "teacher";

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({
      role: role === "all" ? roleFilter : role,
      page: String(page),
      limit: String(PAGE_SIZE),
      search: debouncedSearch,
      joined,
    });
    api
      .get<PaginatedResponse<User>>(`/users?${query.toString()}`)
      .then((response) => {
        if (!active) return;
        if (response.meta.totalPages > 0 && page > response.meta.totalPages) {
          setPage(response.meta.totalPages);
          return;
        }
        setData(response);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        toast.error(cause instanceof Error ? cause.message : t("loadError"));
        setData({
          data: [],
          meta: { total: 0, page, limit: PAGE_SIZE, totalPages: 0 },
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedSearch, joined, page, role, roleFilter, t]);

  async function reload(targetPage: number) {
    setLoading(true);
    const query = new URLSearchParams({
      role: role === "all" ? roleFilter : role,
      page: String(targetPage),
      limit: String(PAGE_SIZE),
      search: debouncedSearch,
      joined,
    });
    try {
      const response = await api.get<PaginatedResponse<User>>(`/users?${query.toString()}`);
      setData(response);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.post<User>("/users", {
        name,
        email,
        password,
        role: selectedRole as UserRole,
      });
      setName("");
      setEmail("");
      setPassword("");
      if (page === 1) await reload(1);
      else setPage(1);
      toast.success(t(isTeacherView ? "teacherCreated" : "userCreated"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("createError"));
    }
  }

  async function remove(user: User) {
    if (!window.confirm(t("deleteConfirm", { name: user.name }))) return;
    try {
      await api.delete(`/users/${user.id}`);
      const targetPage = data?.data.length === 1 && page > 1 ? page - 1 : page;
      if (targetPage !== page) setPage(targetPage);
      else await reload(targetPage);
      toast.success(t("deleted"));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t("deleteError"));
    }
  }

  const title = t(isTeacherView ? "teachersTitle" : "usersTitle");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-[.16em] text-primary">{t("eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-muted-foreground">
          {t(isTeacherView ? "teachersDescription" : "usersDescription")}
        </p>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            {t(isTeacherView ? "addTeacher" : "addUser")}
          </CardTitle>
          <CardDescription>{t("createDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={create}>
            <FieldGroup>
              <div
                className={`grid gap-4 md:grid-cols-2 ${
                  role === "all" ? "xl:grid-cols-5" : "xl:grid-cols-4"
                }`}
              >
                <Field>
                  <FieldLabel htmlFor={`${role}-name`}>{t("name")}</FieldLabel>
                  <Input
                    id={`${role}-name`}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${role}-email`}>{t("email")}</FieldLabel>
                  <Input
                    id={`${role}-email`}
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`${role}-password`}>{t("initialPassword")}</FieldLabel>
                  <Input
                    id={`${role}-password`}
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </Field>
                {role === "all" ? (
                  <Field>
                    <FieldLabel htmlFor="new-user-role">{t("role")}</FieldLabel>
                    <Select
                      value={selectedRole}
                      onValueChange={(value) =>
                        setSelectedRole((value || "student") as ManagedRole)
                      }
                    >
                      <SelectTrigger id="new-user-role">
                        <SelectValue>{roleT(selectedRole)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="student">{roleT("student")}</SelectItem>
                          <SelectItem value="teacher">{roleT("teacher")}</SelectItem>
                          {session?.user.role === "super_admin" ? (
                            <>
                              <SelectItem value="admin">{roleT("admin")}</SelectItem>
                              <SelectItem value="super_admin">{roleT("super_admin")}</SelectItem>
                            </>
                          ) : null}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                ) : null}
                <Button className="self-end" type="submit">
                  <UserPlus data-icon="inline-start" />
                  {t("addAccount")}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <div
        className={`grid gap-3 ${
          role === "all"
            ? "md:grid-cols-[minmax(0,1fr)_200px_200px]"
            : "sm:grid-cols-[minmax(0,1fr)_220px]"
        }`}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t(isTeacherView ? "searchTeachers" : "searchUsers")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        {role === "all" ? (
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter((value || "all") as UserListRole);
              setPage(1);
            }}
          >
            <SelectTrigger aria-label={t("filterRole")}>
              <SelectValue>{roleFilter === "all" ? t("allRoles") : roleT(roleFilter)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{t("allRoles")}</SelectItem>
                <SelectItem value="student">{roleT("student")}</SelectItem>
                <SelectItem value="teacher">{roleT("teacher")}</SelectItem>
                <SelectItem value="admin">{roleT("admin")}</SelectItem>
                <SelectItem value="super_admin">{roleT("super_admin")}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : null}
        <Select
          value={joined}
          onValueChange={(value) => {
            setJoined((value || "all") as JoinedPeriod);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label={t("filterJoined")}>
            <SelectValue>{t(`joined.${joined}`)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">{t("joined.all")}</SelectItem>
              <SelectItem value="7d">{t("joined.7d")}</SelectItem>
              <SelectItem value="30d">{t("joined.30d")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {loading && data === null ? (
        <Skeleton className="h-80" />
      ) : (
        <Card className="overflow-hidden border-2">
          <CardContent className="p-0">
            <Table className="min-w-[820px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-5">{t("account")}</TableHead>
                  <TableHead>{t("role")}</TableHead>
                  <TableHead>{t("joinedAt")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="pr-5 text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={loading ? "opacity-55" : undefined}>
                {data?.data.length ? (
                  data.data.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarImage src={user.avatar || ""} alt="" />
                            <AvatarFallback className="bg-secondary text-xs font-bold">
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="max-w-64 truncate font-semibold">{user.name}</p>
                            <p className="max-w-64 truncate text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleT(user.role)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format.dateTime(new Date(user.createdAt), { dateStyle: "medium" })}
                      </TableCell>
                      <TableCell>
                        {user.id === session?.user.id ? (
                          <Badge>{t("currentAccount")}</Badge>
                        ) : (
                          <Badge variant="secondary">{t("activeAccount")}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        {user.id !== session?.user.id ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => void remove(user)}
                            aria-label={t("deleteAria", { name: user.name })}
                          >
                            <Trash2 />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-44 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
                        <Users className="size-8" />
                        <p className="font-semibold text-foreground">{t("emptyTitle")}</p>
                        <p className="text-xs">{t("emptyDescription")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t("resultCount", { count: data.meta.total })}
          </p>
          {data.meta.totalPages > 1 ? (
            <PaginationControl
              currentPage={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
