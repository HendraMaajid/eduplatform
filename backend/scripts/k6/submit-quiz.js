import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.BASE_URL || "http://localhost:8080";
const quizId = __ENV.QUIZ_ID;
const token = __ENV.TOKEN;
const scenario = __ENV.SCENARIO || "ramp";
const vus = Number(__ENV.VUS || 20);
const duration = __ENV.DURATION || "30s";
const sleepSeconds = Number(__ENV.SLEEP || 1);
const userCount = Number(__ENV.USER_COUNT || 0);
const emailPrefix = __ENV.EMAIL_PREFIX || "loadtest_student_";
const emailDomain = __ENV.EMAIL_DOMAIN || "example.com";
const password = __ENV.PASSWORD || "password123";
const loginPath = __ENV.LOGIN_PATH || "/api/auth/login";

if (!quizId) {
  throw new Error("QUIZ_ID is required");
}

const thresholds = {
  http_req_failed: ["rate<0.01"],
  http_req_duration: ["p(95)<500"],
};

function parseStages(raw) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const parts = item.split(":");
      if (parts.length !== 2) {
        throw new Error(`Invalid stage: ${item}`);
      }
      return { duration: parts[0].trim(), target: Number(parts[1].trim()) };
    });
}

const defaultStages = [
  { duration: "20s", target: 100 },
  { duration: "20s", target: 300 },
  { duration: "20s", target: 600 },
  { duration: "20s", target: 1000 },
  { duration: "20s", target: 0 },
];

const stages = __ENV.STAGES ? parseStages(__ENV.STAGES) : defaultStages;
const isConstant = scenario === "constant" || scenario === "steady";

export const options = isConstant
  ? { vus, duration, thresholds }
  : {
      thresholds,
      scenarios: {
        ramping: {
          executor: "ramping-vus",
          stages,
          gracefulStop: "30s",
        },
      },
    };

export function setup() {
  let tokens = [];
  if (__ENV.TOKENS) {
    tokens = __ENV.TOKENS.split(",").map((value) => value.trim()).filter(Boolean);
  } else if (userCount > 0) {
    for (let i = 1; i <= userCount; i += 1) {
      const email = `${emailPrefix}${String(i).padStart(4, "0")}@${emailDomain}`;
      const payload = JSON.stringify({ email, password });
      const res = http.post(`${baseUrl}${loginPath}`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.status !== 200) {
        throw new Error(`Login failed for ${email}: status ${res.status}`);
      }
      const body = res.json();
      if (!body || !body.token) {
        throw new Error(`Missing token for ${email}`);
      }
      tokens.push(body.token);
    }
  }

  if (!token && tokens.length === 0) {
    throw new Error("TOKEN, TOKENS, or USER_COUNT is required for authenticated requests");
  }

  const questionsUrl = `${baseUrl}/api/quizzes/${quizId}/questions`;
  const res = http.get(questionsUrl);
  if (res.status === 200) {
    const data = res.json();
    const questionIds = Array.isArray(data) ? data.map((q) => q.id) : [];
    return { questionIds, tokens };
  }

  if (__ENV.QUESTION_IDS) {
    const questionIds = __ENV.QUESTION_IDS.split(",").map((id) => id.trim()).filter(Boolean);
    return { questionIds, tokens };
  }

  return { questionIds: [], tokens };
}

export default function (data) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (data.tokens && data.tokens.length > 0) {
    const index = (__VU - 1) % data.tokens.length;
    headers.Authorization = `Bearer ${data.tokens[index]}`;
  } else if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const answers = (data.questionIds || []).map((id) => ({
    questionId: id,
    answer: "A",
  }));

  const payload = JSON.stringify({ answers });
  const res = http.post(`${baseUrl}/api/quizzes/${quizId}/submit`, payload, { headers });

  check(res, {
    "submit status 201/200": (r) => r.status === 201 || r.status === 200,
  });

  sleep(sleepSeconds);
}
