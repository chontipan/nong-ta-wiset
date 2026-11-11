# ทดสอบข้ามชุดข้อมูล + CLIP แบบไม่ต้องฝึก

วัดว่าโมเดลที่ฝึกจาก AlphaTrash ใช้กับภาพจากที่อื่นได้แค่ไหน และเทียบกับ CLIP (ViT-B/32) ที่ไม่ต้องฝึก
ชุดทดสอบ: [TrashNet](https://github.com/garythung/trashnet) 2,527 ภาพ และ
[RealWaste](https://github.com/sam-single/realwaste) 4,752 ภาพ (CC BY-NC-SA 4.0, ใช้เพื่อวิจัยเท่านั้น ไม่ได้เก็บภาพไว้ใน repo)

ผลหลัก (แยก 5 หมวดแบบ balanced accuracy)

| วิธี | AlphaTrash | TrashNet | RealWaste |
| --- | --- | --- | --- |
| โมเดลในแอป (ฝึกจาก AlphaTrash) | 95.5% | 38.6% | 35.5% |
| CLIP ไม่ต้องฝึก | 64.1% | 72.8% | 60.9% |
| CLIP + ภาพท้องถิ่น 10 ภาพ/หมวด | - | 76.7% | 72.1% |
| CLIP + ภาพท้องถิ่น 50 ภาพ/หมวด | - | 86.5% | 82.4% |

ผลเต็มอยู่ใน `../results/cross_results.json`

## ทำซ้ำ

```bash
node xfeat.js trashnet <trashnet/dataset-resized> ../../../models/alphatrash x_trashnet.jsonl
node xfeat.js realwaste <realwaste/RealWaste> ../../../models/alphatrash x_realwaste.jsonl
node xfeat.js alphatrash <alphatrash/trash_dataset/test> ../../../models/alphatrash x_alphatest.jsonl
# CLIP: npm i @huggingface/transformers@3.5.1 แล้ววางไฟล์ Xenova/clip-vit-base-patch32 ไว้ใน models/
node clip.mjs clip.jsonl clip_text.json       # แก้ path ของชุดข้อมูลในไฟล์ก่อน
python3 cross.py <โฟลเดอร์ที่มีไฟล์ข้างบน + tmcache.json จาก train-tm.js> cross_results.json
```

## Paper numbers (object-disjoint split, CIs, McNemar)

- `groups2.py <dir> <dir>/groups_results.json` (summary kept in `results/object_split.json`): groups AlphaTrash photos into objects (consecutive shots with CLIP similarity ≥ 0.85, "- Copy" files join their original) and compares random vs object-disjoint 5-fold accuracy.
- `stats.py <dir> results/paper_stats.json`: final numbers for the paper — object-disjoint accuracy, cross-dataset tests, few-shot (5 seeds), bootstrap 95% CIs and exact McNemar tests. Needs `groups_results.json` from `groups2.py` in `<dir>`.
