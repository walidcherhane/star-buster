import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { AdvancedPatterns, BasicPatterns } from "@/types/supabase-schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const validateGitHubUrl = (url: string): boolean => {
  const githubUrlPattern =
    /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/;
  return githubUrlPattern.test(url);
};

export const formatNumber = (num: number): string => {
  if (isNaN(num)) {
    return "0";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

export const calculateDaysOld = (createdAt: string): number => {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  );
};

export const calculateStarsPerDay = (
  stars: number,
  daysOld: number
): number => {
  return daysOld > 0 ? stars / daysOld : 0;
};

export const getSuspicionLevel = (
  score: number
): {
  level: string;
  color: string;
  bgColor: string;
  icon: typeof CheckCircle | typeof AlertTriangle | typeof AlertCircle;
  emoji: string;
} => {
  if (score < 30) {
    return {
      level: "LOW",
      color: "text-green-700",
      bgColor: "bg-green-50",
      icon: CheckCircle,
      emoji: "✅",
    };
  } else if (score < 60) {
    return {
      level: "MEDIUM",
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      icon: AlertTriangle,
      emoji: "⚠️",
    };
  } else {
    return {
      level: "HIGH",
      color: "text-red-700",
      bgColor: "bg-red-50",
      icon: AlertCircle,
      emoji: "🚨",
    };
  }
};

// export const getSuspiciousCreationsCount = (
//   suspiciousCreationDates: Record<string, number>
// ): number => {
//   return Object.values(suspiciousCreationDates).reduce(
//     (sum, count) => sum + count,
//     0
//   );
// };

// Utility function to analyze suspicious creation dates
export function getSuspiciousCreationsCount(
  suspiciousCreationDates: Record<string, number>
) {
  // Sort dates by number of accounts created
  const sortedDates = Object.entries(suspiciousCreationDates)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.count - a.count);

  // Get statistics
  const maxInOneDay = Math.max(...Object.values(suspiciousCreationDates), 0);
  const daysWithMoreThan5 = sortedDates.filter(
    (entry) => entry.count > 5
  ).length;
  const daysWithMoreThan10 = sortedDates.filter(
    (entry) => entry.count > 10
  ).length;

  // Get top suspicious days (days with more than 3 accounts)
  const suspiciousDays = sortedDates
    .filter((entry) => entry.count > 3)
    .map((entry) => ({
      date: entry.date,
      count: entry.count,
      severity: entry.count > 10 ? "High" : entry.count > 5 ? "Medium" : "Low",
    }));

  return {
    statistics: {
      maxAccountsInOneDay: maxInOneDay,
      daysWithMoreThan5Accounts: daysWithMoreThan5,
      daysWithMoreThan10Accounts: daysWithMoreThan10,
      totalSuspiciousDays: suspiciousDays.length,
    },
    suspiciousDays,
    hasSuspiciousPattern: maxInOneDay > 5,
    summary: generateSummary(maxInOneDay, daysWithMoreThan5, suspiciousDays),
  };
}

// Helper function to generate a human-readable summary
function generateSummary(
  maxInOneDay: number,
  daysWithMoreThan5: number,
  suspiciousDays: {
    date: string;
    count: number;
    severity: string;
  }[]
) {
  const summaryParts = [];

  if (maxInOneDay > 10) {
    summaryParts.push(
      `Critical: ${maxInOneDay} accounts created in a single day`
    );
  } else if (maxInOneDay > 5) {
    summaryParts.push(
      `Warning: ${maxInOneDay} accounts created in a single day`
    );
  }

  if (daysWithMoreThan5 > 1) {
    summaryParts.push(
      `${daysWithMoreThan5} days had more than 5 accounts created`
    );
  }

  if (suspiciousDays.length > 0) {
    const topDay = suspiciousDays[0];
    summaryParts.push(
      `Most active day: ${topDay.date} with ${topDay.count} accounts`
    );
  }

  return summaryParts.join(". ");
}

export const isAdvancedPatterns = (
  patterns: BasicPatterns | AdvancedPatterns
): patterns is AdvancedPatterns => {
  return (
    patterns &&
    typeof (patterns as AdvancedPatterns).newAccounts !== "undefined"
  );
};

export const formatProcessingTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};
