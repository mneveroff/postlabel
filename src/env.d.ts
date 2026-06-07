/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_POSTHOG_KEY?: string;
  readonly PUBLIC_POSTHOG_UI_HOST?: string;
  readonly PUBLIC_APP_ENVIRONMENT?: string;
  readonly PUBLIC_APP_VERSION?: string;
  readonly PUBLIC_DEPLOY_PROVIDER?: string;
  readonly PUBLIC_VERCEL_GIT_COMMIT_SHA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
