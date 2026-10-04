declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    DATABASE_URL?: string;
    BUCKET?: R2Bucket;
  }
}
