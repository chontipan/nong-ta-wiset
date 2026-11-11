# วัดความแม่นยำ AI ด้วยชุดข้อมูล AlphaTrash

สคริปต์ชุดนี้วัดว่า AI ของน้องตาวิเศษเลือกถังถูกแค่ไหน บนภาพขยะไทย 5,691 ภาพจาก
[AlphaTrash dataset](https://github.com/Patipol-BKK/alphatrash-dataset) (MIT) ตัวเลขทั้งหมดวัดบนชุด `test` (849 ภาพ)

ทดลอง 3 แบบ ใช้กติกาเดียวกับ `app.js` / `ai-vision.js`

- **A** แอปตามที่ใช้อยู่: COCO-SSD mobilenet_v2 + `WASTE_MAPPING` เกณฑ์ 58%
- **B** ภาพจำ: สอนภาพจาก train k ภาพต่อหมวด แล้วใช้ 1-NN และเกณฑ์ `VISUAL_MATCH_SIM` / `VISUAL_ONLY_SIM` / `VISUAL_MARGIN`
- **C** โมเดลแบบ Teachable Machine: ฟีเจอร์ MobileNetV2 ชุดเดียวกับ TM + ชั้น softmax 5 หมวด (logistic regression)

## ผลหลัก (10 พ.ย. 2569)

| วิธี | ทิ้งถูกถัง |
| --- | --- |
| A. แอปตอนนี้ | 7.1% (ตอบแค่ 13.5% ของภาพ) |
| B. ภาพจำ 10 ภาพ/หมวด เกณฑ์ปัจจุบัน | 21.3% |
| B. ภาพจำ 10 ภาพ/หมวด ไม่ใช้เกณฑ์ | 83.0% |
| C. โมเดลแบบ TM (ทั้งชุด train) | 96.3% (5 หมวด 95.4%) |

ผลเต็มอยู่ใน `results/results.json` และ `results/threshold_sweep.json`

## ทำซ้ำ

```bash
git clone https://github.com/Patipol-BKK/alphatrash-dataset.git /data/alphatrash-dataset
cd tools/eval-alphatrash
npm install                      # tfjs-node + coco-ssd (เวอร์ชันเดียวกับแอป)
pip install numpy scikit-learn
python3 make_mapping.py ../../app.js mapping.json
node extract.js /data/alphatrash-dataset/trash_dataset feats.jsonl   # ~30 นาทีบน CPU 4 คอร์
python3 analyze.py feats.jsonl mapping.json results
python3 sweep.py feats.jsonl mapping.json results
```

`extract.js` ต้องต่อเน็ตเพื่อโหลดโมเดลจาก storage.googleapis.com

## การจับคู่หมวดกับถัง

| AlphaTrash | ถังที่นับว่าถูก |
| --- | --- |
| plastic | ถังขวดพลาสติก หรือ รีไซเคิล |
| metal, paper | รีไซเคิล |
| organic, general | ทั่วไป |

ชุดข้อมูลไม่มีขยะอันตราย จึงวัดถังอันตรายไม่ได้ ภาพทุกภาพถ่ายในกล่องพื้นขาวกล้องตัวเดียว
ผล C จึงน่าจะสูงกว่าที่ตู้จริงทำได้ ถ้ากล้องหรือฉากหลังต่างกัน

## ฝึกโมเดลสำเร็จรูป (models/alphatrash)

```bash
python3 mkneg.py          # สร้างภาพพื้นหลัง (ต้องมี flower_photos ของ TensorFlow + scikit-image) แก้ path ในไฟล์ก่อน
node train-tm.js /data/alphatrash-dataset/trash_dataset <bg dir> ../../models/alphatrash cache.json
```

ผลของโมเดลอยู่ใน `results/alphatrash_model_eval.json` ส่วนการเลือกเกณฑ์ภาพจำใหม่ (0.68 / 0.62)
มาจากการเทียบภาพขยะ 849 ภาพกับภาพที่ไม่ใช่ขยะ 430 ภาพ
