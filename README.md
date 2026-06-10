# InwZa'KaraO'ke (OkeApp) 🎤
แอปพลิเคชันคาราโอเกะออนไลน์แบบเรียลไทม์ พัฒนาด้วย Next.js (App Router), Supabase และ YouTube Player API

---

## 🌟 ฟีเจอร์เด่น (Key Features)

- **🖥️ หน้าจอหลักสำหรับเครื่องโฮสต์ (Host Screen):** แสดงเครื่องเล่นวิดีโอ YouTube และคิวเพลงคาราโอเกะหลักแบบเต็มหน้าจอ (Fullscreen)
- **📱 ระบบรีโมตคอนโทรลบนมือถือ (Mobile Remote Control):** ผู้ร่วมห้อง (Guest) สามารถสแกนหรือใส่รหัสห้องเพื่อเข้าควบคุมการเล่นเพลง เพิ่ม ลบ หรือจัดลำดับคิวเพลงแบบเรียลไทม์ได้จากมือถือของตนเอง
- **🔄 ระบบคิวเพลงและปุ่มควบคุมแบบเรียลไทม์ (Real-time Sync):**
  - คิวเพลงจะซิงก์กันระหว่างมือถือของทุกคนในห้องและหน้าจอหลักทันที
  - ปุ่มควบคุมเพลง: เล่น (PLAY), หยุด (PAUSE), เริ่มเล่นใหม่ (REPLAY) และข้ามเพลง (NEXT) ทำงานร่วมกันอย่างไร้รอยต่อผ่าน Supabase Realtime
- **🔍 ระบบค้นหาเพลงและแคชอัจฉริยะ (Smart Search & Cache):**
  - ค้นหาเพลงผ่าน YouTube Data API v3
  - บันทึกข้อมูลประวัติการค้นหาเพลงลงใน Supabase (`saved_songs`) เพื่อช่วยประหยัด Quota ของ YouTube API
- **🎨 สไตล์ระดับพรีเมียม (Premium UX/UI):** ธีมดีไซน์สไตล์ Dark Mode เรียบหรูพร้อม Glassmorphism, สีสันสดใส และลูกเล่น Micro-animations (เช่น ตัวจำลอง Equalizer ขณะเพลงกำลังเล่น)

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework:** [Next.js 15+ (App Router)](https://nextjs.org/) ด้วย TypeScript
- **Database & Realtime:** [Supabase](https://supabase.com/) (Postgres & Realtime Subscriptions)
- **Styling:** CSS Variables + Vanilla CSS (และ Tailwind CSS สำหรับ Component เสริม)
- **Video Player:** [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)

---

## 🚀 การติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### 1. โคลนโปรเจกต์และติดตั้ง Dependency
```bash
npm install
```

### 2. ตั้งค่าตัวแปรสภาพแวดล้อม (Environment Variables)
สร้างไฟล์ `.env.local` ในโฟลเดอร์หลักของโปรเจกต์ และระบุคีย์ต่อไปนี้:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
YOUTUBE_API_KEY=your_youtube_data_api_v3_key
```

### 3. รันโปรเจกต์ในโหมดพัฒนา (Development Mode)
```bash
npm run dev
```
เปิดบราวเซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

### 4. รันคำสั่งตรวจสอบสไตล์การเขียนโค้ดและประเภทข้อมูล (Type Check & Lint)
```bash
# ตรวจสอบ TypeScript Types
npx tsc --noEmit

# รัน Linter ตรวจสอบโค้ด
npm run lint
```

---

## 📊 โครงสร้างฐานข้อมูล (Database Schema)

ตารางหลักสำหรับการทำงานคือ `rooms` ซึ่งมีคอลัมน์สำคัญดังนี้:
- `id` (UUID): ไอดีหลักของห้อง
- `code` (VARCHAR): รหัสห้องสำหรับเข้าร่วม (6 ตัวอักษรพิมพ์ใหญ่)
- `queue` (JSONB): รายการคิวเพลงปัจจุบัน
- `current_index` (INTEGER): ลำดับเพลงที่กำลังเล่นอยู่
- `is_playing` (BOOLEAN): สถานะว่าเครื่องเล่นกำลังเล่นเพลงอยู่หรือไม่
- `last_command` (JSONB): คำสั่งล่าสุดจากรีโมต เช่น `{ action: "PLAY", timestamp: 1718000000 }` เพื่อสั่งให้โฮสต์รันตามเวลาจริง

ดูโครงสร้างและคำสั่ง SQL ทั้งหมดได้ที่ [supabase/migration.sql](file:///C:/xampp/htdocs/karaoke/supabase/migration.sql)

---

## 📁 โครงสร้างโฟลเดอร์ที่สำคัญ (Project Structure)

```text
├── app/                  # Next.js App Router (Routing และ Layout หลัก)
│   ├── page.tsx          # หน้าจอหลักสำหรับเครื่อง Host
│   └── room/[code]/      # หน้าเว็บสำหรับ Guest บน Mobile Remote
├── components/           # UI Components ที่นำกลับมาใช้ใหม่
│   ├── YouTubePlayer.tsx # คอมโพเนนต์ YouTube Player และ IFrame API Binding
│   ├── QueueList.tsx     # รายการแสดงคิวเพลงฝั่ง Host
│   └── SearchBar.tsx     # ช่องค้นหาเพลงคาราโอเกะ
├── hooks/                # Custom React Hooks
│   ├── useRoom.ts        # จัดการ Realtime Sync กับ Supabase
│   ├── useQueue.ts       # จัดการคำนวณและเก็บคิวเพลงภายในแอป
│   └── useYouTubePlayer.ts # พาร์สสคริปต์ YouTube Player API
└── lib/                  # ตัวช่วยเชื่อมต่อภายนอก (Supabase Client, API)
```

---

## ©️ ผู้พัฒนา (Author)
พัฒนาโดย **S'Pantamit** 🎤

