"use client";

import { useTranslations } from "next-intl";
import type { LearningProgress } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

type LearnersTabProps = {
  learners: LearningProgress[];
};

export function LearnersTab({ learners }: LearnersTabProps) {
  const t = useTranslations("authoringLearners");
  return (
    <TabsContent value="learners" className="mt-5">
      <Card className="border-2">
        <CardContent>
          {learners.length ? (
            learners.map((learner) => (
              <div key={learner.id} className="grid gap-2 border-b py-3 sm:grid-cols-[1fr_auto]">
                <span>
                  <b>{learner.student?.name}</b>
                  <span className="block text-xs text-muted-foreground">
                    {learner.student?.email}
                  </span>
                </span>
                <Badge>{learner.progress}%</Badge>
              </div>
            ))
          ) : (
            <p className="py-8 text-center text-muted-foreground">{t("empty")}</p>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
