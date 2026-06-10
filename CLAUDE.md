# CLAUDE.md - คู่มือการพัฒนาและทักษะสำหรับโปรเจกต์ (Developer Guide & Agent Skills)

ไฟล์นี้รวบรวมคำสั่งสไตล์การโค้ด และข้อมูลแนวทางปฏิบัติที่จำเป็นสำหรับการพัฒนาแอปพลิเคชันร้องคาราโอเกะออนไลน์ (OkeApp)

---

## 🛠️ คำสั่งที่ใช้บ่อย (Development Commands)

### การทำงานในระบบ Local
- **รันเซิร์ฟเวอร์พัฒนา:** `npm run dev` (เปิดใช้งานที่ [http://localhost:3000](http://localhost:3000))
- **คอมไพล์โปรเจกต์ (Build):** `npm run build`
- **รันเซิร์ฟเวอร์โปรดักชันในเครื่อง:** `npm run start`
- **ตรวจสอบ Code Quality (Linter):** `npm run lint`
- **ตรวจสอบ Type ของ TypeScript:** `npx tsc --noEmit`

---

## 💻 แนวทางและรูปแบบการเขียนโค้ด (Coding & Styling Guidelines)

### 1. โครงสร้างและการเขียนโค้ด (Architecture & Coding Standards)
- **TypeScript:** ต้องระบุ Type เสมอ หลีกเลี่ยงการใช้ `any`
- **Component Model:** ใช้ Functional Components และ React Hooks (เช่น `useState`, `useEffect`, `useRef`, `useCallback`)
- **โครงสร้างโฟลเดอร์:**
  - `app/` - หน้าเว็บและ API Routes (Next.js App Router)
  - `components/` - คอมโพเนนต์ที่แชร์และนำกลับมาใช้ใหม่ได้
  - `hooks/` - Custom Hooks สำหรับการจัดการสถานะหรือ API
  - `lib/` - ไคลเอนต์และตัวช่วยภายนอก เช่น Supabase client หรือตัวดึงข้อมูล Youtube
  - `supabase/` - ไฟล์ Migrations และ SQL สำหรับ Schema ของฐานข้อมูล
- **การตั้งชื่อ (Naming Conventions):**
  - **โฟลเดอร์/หน้าเว็บ (Routing):** ตัวพิมพ์เล็กทั้งหมด (lowercase) ตามกฎของ Next.js App Router
  - **คอมโพเนนต์:** PascalCase (เช่น `PlayerControl.tsx`, `SongQueue.tsx`)
  - **ฟังก์ชัน/ตัวแปร:** camelCase (เช่น `playVideo()`, `isRepeat`, `currentSongIndex`)
  - **ไฟล์ Utility/Hook:** camelCase (เช่น `useSupabase.ts`, `youtube.ts`)

### 2. รูปแบบการจัดแต่งหน้าตา (Styling CSS)
- **Vanilla CSS:** เน้นการใช้ CSS ดั้งเดิมเพื่อความยืดหยุ่นในการจัดแต่ง (ปรับแต่งได้ใน [globals.css](file:///C:/xampp/htdocs/karaoke/app/globals.css))
- **Tailwind CSS:** หากจำเป็นต้องใช้ Tailwind CSS (เวอร์ชัน 4) ให้ใช้ Utility classes ร่วมกับ CSS เพื่อความสะอาดตาและความเป็นระเบียบของหน้าจอ
- **การออกแบบ UI:** เน้นสีโทนพรีเมียม (Dark Mode, Sleek glassmorphism, Gradients และ Micro-animations) เพื่อความลื่นไหลในการใช้งานของผู้ใช้

---

## ⚡ การรวมระบบหลัก (Core Integration Guidelines)

### 1. Next.js (App Router)
- **Server vs Client Components:**
  - ใช้ **Server Components** เป็นค่าเริ่มต้นสำหรับหน้าแสดงผลที่ต้องการประสิทธิภาพและ SEO
  - ใส่คำสั่ง `"use client"` ด้านบนสุดของไฟล์เสมอสำหรับคอมโพเนนต์ที่มีการใช้ Hooks (เช่น `useState`, `useEffect`), Event Listeners (`onClick`) หรือ IFrame Player API
- **การจัดการ API Route:** สร้าง API ใน `app/api/` เพื่อซ่อนความลับ (เช่น YouTube API Key) และแคชข้อมูลผลลัพธ์

### 2. Supabase (Database & Realtime)
- **การเชื่อมต่อ:** ใช้ตัวดึงข้อมูลผ่าน `@supabase/supabase-js` หรือ `@supabase/ssr`
- **การรักษาความปลอดภัย (RLS):** เปิดใช้งาน Row Level Security ทุกตารางใน Supabase และเขียน Policies ควบคุมการสิทธิ์เข้าถึง
- **ฟังก์ชัน Realtime:** ใช้ Supabase Realtime (ผ่านการ Subscribe ในฝั่ง Client) สำหรับฟังก์ชันระบบคิวเพลงในห้องร้องร่วมกัน (Rooms) เพื่ออัปเดตสถานะการเล่นแบบทันที
- **Schema สำคัญ:**
  - `rooms`: เก็บสถานะห้องร้องเพลง (code, queue, current_index, is_repeat)
  - `playlists`, `playlist_items`: จัดการรายการเพลงส่วนตัว
  - `saved_songs`: สำหรับการแคชข้อมูลเพื่อลดการพึ่งพา API Quota

### 3. YouTube API & Controls
- **YouTube Data API v3:**
  - จำกัด API Quota (100 หน่วยต่อการค้นหา 1 ครั้ง)
  - ต้องแคชผลการค้นหาลงใน Supabase (`saved_songs`) หรือบันทึกผ่านหน่วยความจำฝั่ง Client ก่อนส่งคำขอจริงเสมอ
- **YouTube IFrame Player API:**
  - โหลดและเล่นผ่าน Iframe API โดยแนบพารามิเตอร์ `enablejsapi=1` เสมอ
  - ควบคุมเครื่องเล่นผ่านคำสั่ง `playVideo()`, `pauseVideo()`, `mute()`, `unMute()`, `setVolume()`
  - จัดการระบบคิวออโต้ (Auto-Play Next) โดยตรวจจับสถานะ `onStateChange` เมื่อค่าเป็น `0` (YT.PlayerState.ENDED) เพื่อเล่นเพลงถัดไปทันที

### 4. Vercel (Deployment)
- **การตั้งค่า:** ตรวจสอบให้แน่ใจว่าได้ระบุ Environment Variables ต่อไปนี้ใน Vercel Project:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `YOUTUBE_API_KEY` (ควรเก็บไว้ฝั่ง Server เท่านั้นเพื่อความปลอดภัย)
- **การสร้างและตรวจสอบ:** รัน `npm run build` ในเครื่องโลคอลเพื่อตรวจจับ Error ก่อนการ Push โค้ดไปยังระบบ Deployment

### 5. GitHub (Version Control Workflow)
- **แนวทางการบันทึก (Commit Message Standards):**
  - `feat:` เพิ่มฟีเจอร์ใหม่
  - `fix:` แก้ไขบั๊ก
  - `docs:` ปรับปรุงเอกสาร
  - `style:` ปรับแก้ดีไซน์/ฟอร์แมตโค้ด (ไม่มีผลต่อระบบการทำงาน)
  - `refactor:` ปรับโครงสร้างโค้ดใหม่
  - `perf:` ปรับปรุงประสิทธิภาพของโค้ด
- **กิ่งสาขา (Branch Naming):**
  - `main` หรือ `master` สำหรับ Production
  - `feature/feature-name` สำหรับพัฒนาฟีเจอร์ใหม่
  - `bugfix/issue-name` สำหรับแก้ไขปัญหาเร่งด่วน

---

> [!IMPORTANT]
> หากมีการปรับเปลี่ยน Schema ของฐานข้อมูล ให้จดบันทึกไว้ใน [supabase/migration.sql](file:///C:/xampp/htdocs/karaoke/supabase/migration.sql) เพื่อให้แน่ใจว่าระบบในทุกเครื่องมีความสอดคล้องกัน
