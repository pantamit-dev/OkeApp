-- ===================================================
-- Supabase Migration: สร้างตาราง rooms สำหรับห้องร้อง
-- รันใน Supabase SQL Editor (Dashboard > SQL Editor)
-- ===================================================

-- สร้างตาราง rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  host_name TEXT DEFAULT 'Host',
  queue JSONB DEFAULT '[]'::jsonb,
  current_index INTEGER DEFAULT -1,
  is_repeat BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- สร้าง index สำหรับค้นหา code
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms (code);

-- เปิดใช้ RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Policies: อนุญาตทุกคนเข้าถึง (ยังไม่มีระบบ Auth)
CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert rooms" ON rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update rooms" ON rooms
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete rooms" ON rooms
  FOR DELETE USING (true);

-- เปิด Realtime สำหรับตาราง rooms
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;

-- ฟังก์ชันอัปเดต updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ลบห้องเก่าที่ไม่ได้ใช้งานเกิน 24 ชั่วโมง (optional)
-- สามารถตั้ง Cron Job ใน Supabase ทีหลังได้
