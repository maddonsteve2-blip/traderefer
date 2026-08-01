import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// ISR pages (revalidate 3600/86400) need the R2 incremental cache + DO queue.
// No tag cache: the app never calls revalidateTag/revalidatePath.
export default defineCloudflareConfig({
    incrementalCache: r2IncrementalCache,
    queue: doQueue,
});
