<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# OkeApp Developer & AI Agent Guidelines

If you are an AI assistant working on this repository, you must adhere to the following architectural rules and integration patterns.

---

## ⚡ 1. Real-time Remote Playback Controls

We synchronize playback commands between Mobile Remotes and the Host screen via the `rooms` table in Supabase.

### Command Format
- **Table:** `rooms`
- **Columns:**
  - `last_command` (JSONB): `{ action: "PLAY" | "PAUSE" | "REPLAY" | "NEXT", timestamp: number }`
  - `is_playing` (boolean): `true` for `"PLAY"`, `false` for `"PAUSE"`. Keep this updated so remote controls reflect the current state.

### Preventing Double-Execution on Host
The Host checks `timestamp` against a mutable ref `lastCommandTimestampRef.current` to ignore outdated or cached notifications:
```typescript
if (!lastCommandTimestampRef.current || timestamp > lastCommandTimestampRef.current) {
  lastCommandTimestampRef.current = timestamp;
  // Execute action...
}
```

---

## 🔄 2. Sync Loop Prevention

We synchronize the song queue between Host local state and Supabase:
- **Host to Supabase:** Host syncs additions/removals/reordering.
- **Supabase to Host:** Host receives guest additions.

To avoid infinite loop updates (Host updating Supabase, triggering a subscriber notify, which updates Host local state, triggering another write):
- We use `isSyncingRef.current: boolean` to lock changes during sync.
- We serialize and store queue state in `lastSyncRef.current` to only write when a state diff occurs.
- Maintain this lock pattern when refactoring the queue hooks.

---

## 🎥 3. YouTube Player Ref Binding

- The Host component [app/page.tsx](file:///C:/xampp/htdocs/karaoke/app/page.tsx) controls the YouTube Player via `playerRef` pointing to `<YouTubePlayer />`.
- `<YouTubePlayer />` exposes methods through `useImperativeHandle` with the interface `YouTubePlayerHandle`.
- If you need to add new playback capabilities, define the methods on `YouTubePlayerHandle` first, bind them inside `useImperativeHandle`, and then invoke them from the Host ref pointer.

```typescript
export interface YouTubePlayerHandle {
  togglePlay: () => void;
  toggleMute: () => void;
  seekTo: (seconds: number) => void;
  play: () => void;
  pause: () => void;
  playVideo: () => void; // Map to play
  pauseVideo: () => void; // Map to pause
}
```

