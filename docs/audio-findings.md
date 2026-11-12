# Audio Findings & Root Cause Analysis (TASK R13)

## 1. Storage Location Diagnosis

### Where Uploaded Audio Was Saved
Previously, when audio files were uploaded through the admin portal (`/api/v1/mezmurs/upload-audio` or `/api/v1/mezmurs/:id/audio`), `StorageService.saveMezmurMedia` fell back to saving binary files directly onto the container's local disk:
```
path.join(this.baseUploadDir, 'mezmurs', 'audio', safeName) // e.g. /app/uploads/mezmurs/audio/<uuid>.mp3
```
In `main.ts`, the directory was served as static assets:
```typescript
app.useStaticAssets(uploadDir, { prefix: '/uploads/' });
```

### URLs Used by the Player
The database table `mezmurs` stored relative URLs such as:
```
/uploads/mezmurs/audio/sample-orthodox-chime.wav
/uploads/mezmurs/audio/52e00346-af48-4040-a726-9736d1bf81b1.mp3
```
On the web frontend (`web/src/app/[locale]/mezmur/page.tsx`), the player resolved these relative paths using `resolveMediaUrl(activeMezmur.audioUrl)`:
```
https://aemade-selam-api.onrender.com/uploads/mezmurs/audio/52e00346-af48-4040-a726-9736d1bf81b1.mp3
```

---

## 2. Failure Reproduction & HTTP Status Breakdown

When deployed on cloud container platforms (such as Render or standard Kubernetes/Docker containers) without external object storage or persistent network volumes:

| Failure Mode | Trigger / Event | HTTP Status Observed | Root Cause |
|---|---|---|---|
| **File Missing After Redeploy/Restart** | Any git push, deployment, or worker container restart on Render | **`404 Not Found`** | **Ephemeral container filesystem:** The container's root disk is rebuilt from the Docker/Git image on every deploy or restart. Files saved during runtime to `uploads/` are completely wiped. |
| **Expired Media Token** | Members-only audio or temporary storage links accessed after token TTL | **`401 Unauthorized` / `403 Forbidden` / `410 Gone`** | Signed URLs expired after their validity window (e.g., 1 hour), and the frontend player previously lacked an automated token refresh loop. |
| **Seeking Failure** | Seeking forward or backward on mobile browsers (Safari, Chrome Mobile) | **`416 Range Not Satisfiable`** or file restarts from 0:00 | Static file handlers without byte range slicing (`Accept-Ranges: bytes`, `Content-Range: bytes START-END/TOTAL`) fail to answer partial content requests (`206 Partial Content`). |
| **Cold Start / Timeout** | Free-tier container spun down due to inactivity | **`502 Bad Gateway` / Request Timeout** | App container is sleeping; audio request times out before the container warms up. |

---

## 3. Structural Solutions Implemented

1. **Decoupled Object Storage (S3 / Cloudflare R2 / Cloudinary / Persistent Local)**:
   - Implemented `s3Config` in `StorageService` using AWS Signature Version 4 (SigV4) compatible with AWS S3, Cloudflare R2, Supabase Storage, and MinIO.
   - Files are stored with permanent storage keys (e.g. `mezmurs/audio/<uuid>.mp3`), never ephemeral container paths or temporary URLs.
   - For VPS / local environments, full streaming support with HTTP `206 Partial Content` and Range slicing is provided via `/api/v1/mezmurs/stream/:key`.

2. **Public vs. Members-Only Audio Handling**:
   - **Public audio**: Served via public CDN / bucket URL or `/api/v1/mezmurs/stream/:key` with long-lived `Cache-Control: public, max-age=31536000, immutable`.
   - **Members-only audio**: Served via 1-hour signed URLs (`X-Amz-Expires=3600` for S3/R2 or signed stream tokens `?token=...` for local storage).
   - If the player receives HTTP `401` or `403`, it calls `/api/v1/mezmurs/:id/playback-url` to obtain a fresh signed URL seamlessly without disrupting playback.

3. **Direct Browser Uploads (Presigned URLs)**:
   - Added `POST /api/v1/mezmurs/presigned-upload` to generate presigned PUT URLs for direct browser-to-bucket uploads, eliminating server body-size bottlenecks and timeout risks.
   - Validates audio MIME types (MP3, M4A, OGG, WAV up to 50MB) and parses duration directly from audio stream headers (MP3 Xing/CBR, M4A mvhd atom, OGG granule position, WAV byte rate).

4. **Storage Health Checks & Missing File Detection**:
   - Added `GET /api/v1/mezmurs/storage/health` for admin monitoring.
   - Missing files are flagged with `audioStatus: "missing"` in the database, displaying a prominent "File missing" badge with a one-click "Re-upload" dialog in the admin interface.

5. **Existing Audio Backfill**:
   - Migrated existing mezmurs to register permanent storage keys, duration, file sizes, and MIME types via `prisma/migrate-audio.ts`.

