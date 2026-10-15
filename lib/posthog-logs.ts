"use client";

import posthog from "posthog-js";

type LogAttributes = Record<string, string | number | boolean>;

const loggerName = "dev-events-browser";

export const posthogLogs = {
  info(message: string, attributes: LogAttributes = {}) {
    posthog.logger.info(message, { ...attributes, logger: loggerName });
  },
};
