/* ==========================================================================
   EcoScan AI - Application Engine
   ONNX Runtime Web Waste Sorting (4 Bins: Plastic Bottle, Recyclable, Hazardous, General)
   Web Audio & Speech Synthesis
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Dictionary & Waste Classification Rules (4 Bins) ---
    const WASTE_MAPPING = {
        // Plastic bottle examples (PET / HDPE) go in recycling
        'bottle': { type: 'recyclable', thName: '🍾 ขวดน้ำพลาสติก (PET)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 6 บาท (ขวดน้ำ PET)', estValue: 0.12, desc: 'พลาสติก PET ใส (เบอร์ 1) ล้างทำความสะอาด ดึงฉลากออก บีบให้แบนก่อนทิ้งลงถังรีไซเคิล' },
        'singha_bottle': { type: 'recyclable', thName: '🍾 น้ำดื่มสิงห์ / คริสตัล (PET)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 6 บาท (ขวดน้ำ PET)', estValue: 0.12, desc: 'ขวดน้ำดื่ม PET ใส (เบอร์ 1) ล้างทำความสะอาด ดึงฉลากพลาสติกออก และบีบให้แบนก่อนทิ้งลงถังรีไซเคิล' },
        'oishi_bottle': { type: 'recyclable', thName: '🧃 ชาเขียวโออิชิ / อิชิตัน (PET)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 6 บาท (ขวดน้ำ PET)', estValue: 0.15, desc: 'ขวดชาเขียว PET ใส เทน้ำออกให้หมด ล้างน้ำเปล่า บีบให้แบนก่อนทิ้งลงถังรีไซเคิล' },
        'coke_pepsi_bottle': { type: 'recyclable', thName: '🥤 โค้ก / เป๊ปซี่ / เอส (PET)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 6 บาท (ขวดน้ำ PET)', estValue: 0.20, desc: 'ขวดน้ำอัดลมพลาสติก PET ใส ล้างคราบหวานออก บีบให้แบนทิ้งลงถังรีไซเคิล' },
        'cvitt_yanhee_bottle': { type: 'recyclable', thName: '🍋 ซี-วิตต์ / น้ำยันฮี (PET)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 6 บาท (ขวดน้ำ PET)', estValue: 0.09, desc: 'ขวดวิตามินพลาสติก PET ล้างสะอาด ดึงฉลากออก บีบแบนส่งรีไซเคิล' },
        'hdpe_bottle': { type: 'recyclable', thName: '🥛 ขวดน้ำพลาสติกขุ่น (HDPE)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 7 บาท (ขวดพลาสติกขุ่น)', estValue: 0.21, desc: 'พลาสติก HDPE ขุ่น (เบอร์ 2) เช่น ขวดนม/ขวดน้ำยาล้างจาน ล้างทำความสะอาดทิ้งลงถังรีไซเคิล' },
        'meiji_milk_bottle': { type: 'recyclable', thName: '🥛 นมพาสเจอร์ไรส์เมจิ / โฟร์โมสต์ (HDPE)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 7 บาท (ขวดพลาสติกขุ่น)', estValue: 0.21, desc: 'ขวดนมพลาสติก HDPE สีขาวขุ่น ล้างคราบนมให้สะอาดหมดจดเพื่อป้องกันกลิ่นบูด แล้วทิ้งลงถังรีไซเคิล' },
        'sunlight_bottle': { type: 'recyclable', thName: '🧴 ซันไลต์ / บรีสเอกเซล (HDPE)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 7 บาท (ขวดพลาสติกขุ่น)', estValue: 0.35, desc: 'ขวดน้ำยาล้างจาน/น้ำยาซักผ้า HDPE ล้างคราบฟองน้ำยาออกให้หมดก่อนทิ้งถังรีไซเคิล' },
        'betagen_bottle': { type: 'recyclable', thName: '🍼 นมเปรี้ยวบีทาเก้น (HDPE)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 7 บาท (ขวดพลาสติกขุ่น)', estValue: 0.07, desc: 'ขวดนมเปรี้ยวพลาสติก HDPE ล้างคราบนมเปรี้ยวออกให้เกลี้ยงก่อนทิ้งลงถังรีไซเคิล' },

        // Recyclable Items & Thai Products (ขยะรีไซเคิล - แก้ว, โลหะ, UHT, กระดาษ, พลาสติกสะอาด)
        'pp_pe_ps': { type: 'recyclable', thName: '🥣 พลาสติก PP, PE, PS', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3 บาท (พลาสติกรวม)', estValue: 0.06, desc: 'พลาสติก PP/PE/PS (เบอร์ 5 และ 6) กล่องอาหารพลาสติก ล้างคราบอาหารก่อนส่งรีไซเคิล' },
        'ldpe_bag': { type: 'recyclable', thName: '🛍️ ถุงพลาสติก 7-11 สะอาด (LDPE)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3 บาท (พลาสติกรวม)', estValue: 0.02, desc: 'พลาสติก LDPE นิ่มยืดได้ (เบอร์ 4) เช่น ถุงหิ้วร้านสะดวกซื้อที่สะอาด รวบรวมส่งรีไซเคิล' },
        'clean_7eleven_bag': { type: 'recyclable', thName: '🛍️ ถุงพลาสติก 7-Eleven สะอาด (LDPE)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3 บาท (พลาสติกรวม)', estValue: 0.02, desc: 'ถุงพลาสติกหูหิ้วสะอาด ปราศจากคราบอาหาร รวบรวมมัดส่งโรงงานรีไซเคิลเม็ดพลาสติก' },
        'seven_eleven_bento': { type: 'recyclable', thName: '🍱 กล่องข้าว 7-11 / Ezygo (PP)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3 บาท (พลาสติกรวม)', estValue: 0.05, desc: 'กล่องอาหารพลาสติก PP ขาวใส ล้างคราบมันและเศษข้าวออกให้สะอาด สามารถรีไซเคิลได้' },
        'm150_bottle': { type: 'recyclable', thName: '⚡ เอ็ม-150 / คาราบาวแดง (ขวดแก้ว)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 0.8 บาท (ขวดแก้วรวม)', estValue: 0.12, desc: 'ขวดแก้วเครื่องดื่มชูกำลังสีชา ล้างน้ำเปล่า คัดแยกส่งโรงงานหลอมแก้วรีไซเคิล' },
        'chang_singha_beer_bottle': { type: 'recyclable', thName: '🍺 เบียร์ช้าง / สิงห์ / ลีโอ (ขวดแก้ว)', bin: 'ขยะรีไซเคิล', price: 'ลังละ 5–13 บาท (ช้าง 13 / ลีโอ 7 / สิงห์ 5)', estValue: 0.50, desc: 'ขวดแก้วเบียร์ เทน้ำออกให้หมด ล้างน้ำ คัดแยกส่งโรงงานหลอมแก้วใหม่' },
        'wine glass': { type: 'recyclable', thName: '🍷 ขวดแก้ว / แก้วน้ำ', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 0.8 บาท (ขวดแก้วรวม)', estValue: 0.24, desc: 'ขวดแก้วเครื่องดื่ม คัดแยกออกจากขยะอื่นๆ เพื่อนำไปหลอมใหม่' },
        'lactasoy_carton': { type: 'recyclable', thName: '🥛 นมแลคตาซอย / ไวตามิลค์ (UHT)', bin: 'ขยะรีไซเคิล', price: 'ไม่อยู่ในรายการรับซื้อ', estValue: 0.00, desc: 'กล่องเครื่องดื่ม UHT พับให้แบน แกะหลอดออก ตัด-ล้าง-ตากแห้ง ส่งโครงการรีไซเคิลกล่องเครื่องดื่ม' },
        'thai_denmark_milk': { type: 'recyclable', thName: '🐄 นมวัวแดง ไทย-เดนมาร์ค (UHT)', bin: 'ขยะรีไซเคิล', price: 'ไม่อยู่ในรายการรับซื้อ', estValue: 0.00, desc: 'กล่องนม UHT ไทย-เดนมาร์ค แกะหลอด พับแบน ล้างสะอาดส่งรีไซเคิลทำแผ่นบอร์ดรักษ์โลก' },
        'birdy_can': { type: 'recyclable', thName: '☕ กาแฟเบอร์ดี้ / เนสกาแฟ (กระป๋อง)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 60 บาท (กระป๋องอลูมิเนียม)', estValue: 0.90, desc: 'กระป๋องกาแฟอลูมิเนียม/เหล็ก เทน้ำออกให้หมด เหยียบแบนส่งรีไซเคิลหลอมได้ 100%' },
        'sammaekrua_canned_fish': { type: 'recyclable', thName: '🐟 ปลากระป๋องสามแม่ครัว / โรซ่า (กระป๋องเหล็ก)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3 บาท (กระป๋องสังกะสี)', estValue: 0.15, desc: 'กระป๋องเหล็ก/ดีบุก ล้างคราบซอสมะเขือเทศและน้ำมันออกให้สะอาด ป้องกันกลิ่นบูด' },
        'thai_post_box': { type: 'recyclable', thName: '📦 กล่องพัสดุไปรษณีย์ไทย / Flash', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3 บาท (กระดาษลัง)', estValue: 0.60, desc: 'กล่องกระดาษลูกฟูก แกะเทปกาวและสติกเกอร์ใบปะหน้าออก พับให้แบนเพื่อรีไซเคิล' },
        'box': { type: 'recyclable', thName: '📦 กล่องพัสดุกระดาษ / กล่องลังลูกฟูก', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3 บาท (กระดาษลัง)', estValue: 0.60, desc: 'กระดาษกล่องลังสีน้ำตาล พับกล่องให้แบนเพื่อประหยัดพื้นที่' },
        'cup': { type: 'recyclable', thName: '🥤 แก้วพลาสติก (PET/PP)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3 บาท (พลาสติกรวม)', estValue: 0.03, desc: 'แก้วพลาสติก PET หรือ PP เทน้ำออกให้หมด ล้างคราบเครื่องดื่มก่อนทิ้ง' },
        'bowl': { type: 'recyclable', thName: '🥣 ชามพลาสติก (PP/PS)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3 บาท (พลาสติกรวม)', estValue: 0.06, desc: 'ชามพลาสติก PP/PS ล้างคราบอาหารให้สะอาดก่อนนำไปส่งรีไซเคิล' },
        'book': { type: 'recyclable', thName: '📚 หนังสือ / กระดาษขาวดำ A4', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 2–5 บาท (กระดาษรวม / A4)', estValue: 0.60, desc: 'กระดาษขาวดำ/สมุด/หนังสือ มัดรวมกันให้เรียบร้อยส่งรีไซเคิล' },
        'fork': { type: 'recyclable', thName: '🍴 ช้อนส้อมพลาสติก (PP/PS)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3 บาท (พลาสติกรวม)', estValue: 0.01, desc: 'พลาสติก PP/PS ล้างคราบอาหารออกก่อนทิ้งถังรีไซเคิล' },
        'spoon': { type: 'recyclable', thName: '🥄 ช้อนพลาสติก (PP/PS)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3 บาท (พลาสติกรวม)', estValue: 0.01, desc: 'พลาสติก PP/PS ล้างคราบอาหารก่อนนำไปคัดแยก' },
        'backpack': { type: 'recyclable', thName: '🎒 กระเป๋า / ผ้า', bin: 'ขยะรีไซเคิล', price: 'ไม่อยู่ในรายการรับซื้อ', estValue: 0.00, desc: 'ส่งต่อบริจาคหรือนำเข้ากระบวนการรีไซเคิลสิ่งทอ' },
        'umbrella': { type: 'recyclable', thName: '☂️ ร่ม (โลหะ/พลาสติก)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 7 บาท (เหล็ก)', estValue: 2.00, desc: 'แยกชิ้นส่วนโลหะและพลาสติกก่อนส่งรีไซเคิล' },

        // Hazardous Waste Items (ขยะอันตราย - สีแดง)
        'panasonic_battery': { type: 'hazardous', thName: '🔋 ถ่านไฟฉาย Panasonic / อัลคาไลน์', bin: 'ขยะอันตราย', price: 'ไม่อยู่ในรายการรับซื้อ (ส่งจุดรับขยะอันตราย)', estValue: 0.00, desc: 'มีสารแคดเมียม ปรอท และสารเคมีพิษ ห้ามทิ้งปนกับขยะทั่วไป ต้องทิ้งลงถังขยะอันตรายสีแดงเท่านั้น' },
        'baygon_spray_can': { type: 'hazardous', thName: '💨 สเปรย์ไบกอน / ยาฆ่าแมลง', bin: 'ขยะอันตราย', price: 'ไม่อยู่ในรายการรับซื้อ (ส่งจุดรับขยะอันตราย)', estValue: 0.00, desc: 'กระป๋องสเปรย์แรงดันสูงและมีสารเคมีอันตราย ห้ามเจาะรูหรือเผาไฟ ทิ้งลงถังขยะอันตราย' },
        'cell phone': { type: 'hazardous', thName: '📱 มือถือเก่า / พาวเวอร์แบงก์ E-Waste', bin: 'ขยะอันตราย', price: 'ไม่อยู่ในรายการรับซื้อ (ส่งจุดรับ E-Waste)', estValue: 0.00, desc: 'ขยะอิเล็กทรอนิกส์ มีแบตเตอรี่ลิเธียมไอออนและโลหะหนัก ต้องทิ้งในถังขยะอันตรายหรือจุดรับ E-Waste' },
        'razor_sharp_blade': { type: 'hazardous', thName: '🪒 ใบมีดโกน / คัตเตอร์ / ของมีคม', bin: 'ขยะอันตราย', price: 'กก.ละ 7 บาท (เหล็ก)', estValue: 0.00, desc: 'ของมีคมเสี่ยงอันตรายต่อเจ้าหน้าที่เก็บขยะ ควรห่อกระดาษหนาหรือใส่ขวดพลาสติกก่อนทิ้งถังขยะอันตราย' },
        'laptop': { type: 'hazardous', thName: '💻 คอมพิวเตอร์ / จอภาพ E-Waste', bin: 'ขยะอันตราย', price: 'เครื่องละ 20 บาท (จอคอม / ทีวี)', estValue: 20.00, desc: 'ขยะอิเล็กทรอนิกส์มีส่วนประกอบสารเคมีอันตราย ควรทิ้งถังขยะอันตราย' },
        'remote': { type: 'hazardous', thName: '🔋 รีโมท / อุปกรณ์มีถ่าน', bin: 'ขยะอันตราย', price: 'กก.ละ 1 บาท (ไฟเบอร์ เครื่องใช้ไฟฟ้า)', estValue: 0.15, desc: 'ถอดถ่านออก และแยกทิ้งตัวอุปกรณ์ในถังขยะอันตราย' },
        'scissors': { type: 'hazardous', thName: '✂️ กรรไกร / ของมีคม', bin: 'ขยะอันตราย', price: 'กก.ละ 7 บาท (เหล็ก)', estValue: 0.70, desc: 'ของมีคมอันตราย ควรห่อหุ้มปลายแหลมให้ปลอดภัยก่อนทิ้งถังขยะอันตราย' },
        'knife': { type: 'hazardous', thName: '🔪 มีด / ของมีคม', bin: 'ขยะอันตราย', price: 'กก.ละ 7 บาท (เหล็ก)', estValue: 0.70, desc: 'ห่อกระดาษหนาและแยกทิ้งในถังขยะอันตรายเพื่อป้องกันอันตราย' },
        'keyboard': { type: 'hazardous', thName: '⌨️ คีย์บอร์ด / E-Waste', bin: 'ขยะอันตราย', price: 'กก.ละ 1 บาท (ไฟเบอร์ เครื่องใช้ไฟฟ้า)', estValue: 0.50, desc: 'อุปกรณ์วงจรอิเล็กทรอนิกส์ชำรุด ทิ้งถังขยะอันตราย' },
        'mouse': { type: 'hazardous', thName: '🖱️ เมาส์ / E-Waste', bin: 'ขยะอันตราย', price: 'กก.ละ 1 บาท (ไฟเบอร์ เครื่องใช้ไฟฟ้า)', estValue: 0.10, desc: 'ขยะอิเล็กทรอนิกส์ คัดแยกทิ้งถังขยะอันตราย' },
        'hair drier': { type: 'hazardous', thName: '🔌 ไดร์เป่าผม / เครื่องใช้ไฟฟ้า', bin: 'ขยะอันตราย', price: 'กก.ละ 1 บาท (ไฟเบอร์ เครื่องใช้ไฟฟ้า)', estValue: 0.50, desc: 'เครื่องใช้ไฟฟ้าชำรุดจัดเป็นขยะอันตราย' },

        // Money & Banknotes (เงิน / ธนบัตร - เตือนพิเศษไม่ควรทิ้ง)
        'banknote': { type: 'money', thName: '💵 ธนบัตร (เงินบาทไทย)', bin: '⚠️ ไม่ควรทิ้ง!', price: '⚠️ เงินสด ไม่ควรทิ้ง!', desc: 'นี่คือ เงิน ไม่ควรทิ้ง! กรุณาเก็บไว้ในกระเป๋าสตางค์ หรือนำมาร่วมบุญ' },
        'money': { type: 'money', thName: '💵 ธนบัตร / เงิน', bin: '⚠️ ไม่ควรทิ้ง!', price: '⚠️ เงินสด ไม่ควรทิ้ง!', desc: 'นี่คือ เงิน ไม่ควรทิ้ง! กรุณาเก็บไว้ในกระเป๋าสตางค์' },
        'cash': { type: 'money', thName: '💵 ธนบัตร / เงินสด', bin: '⚠️ ไม่ควรทิ้ง!', price: '⚠️ เงินสด ไม่ควรทิ้ง!', desc: 'นี่คือ เงิน ไม่ควรทิ้ง! กรุณาเก็บไว้ในกระเป๋าสตางค์' },

        // Thai General Waste Items (ขยะทั่วไป - ซองฟอยล์, ปนเปื้อนคราบมัน, เปลือกผลไม้)
        'mama_noodle': { type: 'recyclable', thName: '🍜 ซองมาม่าต้มยำกุ้ง / ไวไว', bin: 'ขยะรีไซเคิล', price: 'ไม่อยู่ในรายการรับซื้อ', estValue: 0.00, desc: 'เทเครื่องปรุงที่เหลือออก เช็ดคราบน้ำมันให้สะอาด เทศบาลตำบลแม่จันรับซองบะหมี่และซองขนมเป็นขยะรีไซเคิล ถ้ายังเปื้อนมากให้ทิ้งขยะทั่วไป' },
        'mama_cup': { type: 'general', thName: '🥣 ถ้วยมาม่าคัพ (ปนเปื้อนซุป)', bin: 'ขยะทั่วไป', price: 'ไม่สามารถรับซื้อรีไซเคิลได้', desc: 'ถ้วยบะหมี่กึ่งสำเร็จรูปปนเปื้อนน้ำมันและคราบเครื่องปรุง ไม่สามารถนำไปรีไซเคิลได้ ทิ้งถังขยะทั่วไป' },
        'lays_bag': { type: 'recyclable', thName: '🥔 ซองมันฝรั่งเลย์ / ตะวัน', bin: 'ขยะรีไซเคิล', price: 'ไม่อยู่ในรายการรับซื้อ', estValue: 0.00, desc: 'เทเศษขนมออกให้หมด เทศบาลตำบลแม่จันรับซองขนมและซองกาแฟเป็นขยะรีไซเคิล ถ้ายังเปื้อนมากให้ทิ้งขยะทั่วไป' },
        'amazon_cup': { type: 'general', thName: '🥤 แก้ว Cafe Amazon / All Café (เปื้อน)', bin: 'ขยะทั่วไป', price: 'ไม่สามารถรับซื้อรีไซเคิลได้', desc: 'แก้วพลาสติกที่ปนเปื้อนคราบกาแฟ/น้ำตาล หากไม่ได้ล้างทำความสะอาด ให้ทิ้งถังขยะทั่วไป' },
        'oily_curry_bag': { type: 'general', thName: '🍛 ถุงแกงเปื้อนคราบน้ำมัน', bin: 'ขยะทั่วไป', price: 'ไม่สามารถรับซื้อรีไซเคิลได้', desc: 'ถุงแกงและถุงน้ำจิ้มที่ยังเปื้อนคราบมัน ทิ้งในถังขยะทั่วไป ถ้าเทเศษอาหารออกและล้างสะอาดแล้ว เทศบาลตำบลแม่จันรับเป็นขยะรีไซเคิล' },
        'banana': { type: 'general', thName: '🍌 เปลือกกล้วย / เปลือกผลไม้ไทย', bin: 'ขยะอินทรีย์ (เศษอาหาร)', desc: 'เทศบาลตำบลแม่จันให้แยกเศษอาหารเป็นขยะอินทรีย์ ไม่ทิ้งปนกับขยะทั่วไป (เก็บวันอังคารและวันศุกร์) ถ้าจุดนี้ไม่มีถังเศษอาหาร ให้เก็บกลับไปรวมกับเศษอาหารที่บ้าน หรือหมักทำปุ๋ย' },
        'orange': { type: 'general', thName: '🍊 เปลือกส้ม / เศษอาหาร', bin: 'ขยะอินทรีย์ (เศษอาหาร)', desc: 'เทศบาลตำบลแม่จันให้แยกเศษอาหารเป็นขยะอินทรีย์ ไม่ทิ้งปนกับขยะทั่วไป (เก็บวันอังคารและวันศุกร์) ถ้าจุดนี้ไม่มีถังเศษอาหาร ให้เก็บกลับไปรวมกับเศษอาหารที่บ้าน หรือหมักทำปุ๋ย' },
        'broccoli': { type: 'general', thName: '🥦 เศษผัก / บรอกโคลี', bin: 'ขยะอินทรีย์ (เศษอาหาร)', desc: 'เทศบาลตำบลแม่จันให้แยกเศษอาหารเป็นขยะอินทรีย์ ไม่ทิ้งปนกับขยะทั่วไป (เก็บวันอังคารและวันศุกร์) ถ้าจุดนี้ไม่มีถังเศษอาหาร ให้เก็บกลับไปรวมกับเศษอาหารที่บ้าน หรือหมักทำปุ๋ย' },
        'carrot': { type: 'general', thName: '🥕 เศษผัก / แครอท', bin: 'ขยะอินทรีย์ (เศษอาหาร)', desc: 'เทศบาลตำบลแม่จันให้แยกเศษอาหารเป็นขยะอินทรีย์ ไม่ทิ้งปนกับขยะทั่วไป (เก็บวันอังคารและวันศุกร์) ถ้าจุดนี้ไม่มีถังเศษอาหาร ให้เก็บกลับไปรวมกับเศษอาหารที่บ้าน หรือหมักทำปุ๋ย' },
        'hot dog': { type: 'general', thName: '🌭 เศษอาหาร', bin: 'ขยะอินทรีย์ (เศษอาหาร)', desc: 'เทศบาลตำบลแม่จันให้แยกเศษอาหารเป็นขยะอินทรีย์ ไม่ทิ้งปนกับขยะทั่วไป (เก็บวันอังคารและวันศุกร์) ถ้าจุดนี้ไม่มีถังเศษอาหาร ให้เก็บกลับไปรวมกับเศษอาหารที่บ้าน หรือหมักทำปุ๋ย' },
        'pizza': { type: 'general', thName: '🍕 เศษอาหาร / เศษพิซซ่า', bin: 'ขยะอินทรีย์ (เศษอาหาร)', desc: 'เทศบาลตำบลแม่จันให้แยกเศษอาหารเป็นขยะอินทรีย์ ไม่ทิ้งปนกับขยะทั่วไป (เก็บวันอังคารและวันศุกร์) ถ้าจุดนี้ไม่มีถังเศษอาหาร ให้เก็บกลับไปรวมกับเศษอาหารที่บ้าน หรือหมักทำปุ๋ย' },
        'donut': { type: 'general', thName: '🍩 เศษขนม / ขนมปัง', bin: 'ขยะอินทรีย์ (เศษอาหาร)', desc: 'เทศบาลตำบลแม่จันให้แยกเศษอาหารเป็นขยะอินทรีย์ ไม่ทิ้งปนกับขยะทั่วไป (เก็บวันอังคารและวันศุกร์) ถ้าจุดนี้ไม่มีถังเศษอาหาร ให้เก็บกลับไปรวมกับเศษอาหารที่บ้าน หรือหมักทำปุ๋ย' },
        'cake': { type: 'general', thName: '🍰 เศษเค้ก / อาหาร', bin: 'ขยะอินทรีย์ (เศษอาหาร)', desc: 'เทศบาลตำบลแม่จันให้แยกเศษอาหารเป็นขยะอินทรีย์ ไม่ทิ้งปนกับขยะทั่วไป (เก็บวันอังคารและวันศุกร์) ถ้าจุดนี้ไม่มีถังเศษอาหาร ให้เก็บกลับไปรวมกับเศษอาหารที่บ้าน หรือหมักทำปุ๋ย' },
        'potted plant': { type: 'general', thName: '🪴 ต้นไม้ / ดิน', bin: 'ขยะอินทรีย์ (ใบไม้ / กิ่งไม้)', desc: 'ใบไม้ กิ่งไม้ และดิน เป็นขยะอินทรีย์ เทศบาลตำบลแม่จันให้แยกจากขยะทั่วไป ทิ้งในสวนหรือรวมกับขยะอินทรีย์ที่บ้าน' },

        'teddy bear': { type: 'general', thName: 'ตุ๊กตา / ของเล่นเก่า', bin: 'ขยะทั่วไป', desc: 'ส่งต่อบริจาค หรือทิ้งถังขยะทั่วไปหากชำรุด' },
        'toothbrush': { type: 'general', thName: 'แปรงฟันปนเปื้อน', bin: 'ขยะทั่วไป', desc: 'แปรงฟันปนเปื้อนเชื้อโรค ทิ้งในถังขยะทั่วไป' }
    };



    // Default Fallback mapping for unlisted objects
    const DEFAULT_GENERAL_WASTE = {
        type: 'general',
        thName: 'ขยะปนเปื้อน / สิ่งของทั่วไป',
        bin: 'ขยะทั่วไป',
        desc: 'ไม่สามารถนำกลับมารีไซเคิลได้ง่าย ควรทิ้งในถังขยะทั่วไป'
    };

    const BIN_NAMES = {
        'plastic_bottle': 'ถังขวดพลาสติก',
        'recyclable': 'ขยะรีไซเคิล',
        'hazardous': 'ขยะอันตราย',
        'general': 'ขยะทั่วไป',
        'money': '⚠️ ไม่ควรทิ้ง!'
    };

    // --- State Variables ---
    let model = null;
    let webcamStream = null;
    let isDetecting = false;
    let isSoundMuted = false;
    let isCameraActive = false;
    let isKioskMode = false;
    let selectedDeviceId = null;
    let currentConfidenceThreshold = 0.65; // 65% optimal confidence threshold to reduce background false positives
    // Escape text before putting it into innerHTML (names and history can come from the shared cloud database)
    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[ch]);
    }

    // --- Firebase Integration (Project ID: waste-5b576) ---
    const firebaseConfig = {
        projectId: "waste-5b576",
        authDomain: "waste-5b576.firebaseapp.com",
        storageBucket: "waste-5b576.appspot.com"
    };

    let db = null;
    const firebaseStatusEl = document.getElementById('firebaseStatus');
    const firebaseStatusTextEl = document.getElementById('firebaseStatusText');

    function initFirebase() {
        if (typeof firebase !== 'undefined') {
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                db = firebase.firestore();
                // Keep scans saved on the device while offline; Firestore sends them when the internet is back
                db.enablePersistence({ synchronizeTabs: true })
                    .catch(err => console.warn('Offline storage for Firestore not available:', err.code || err));

                if (firebaseStatusTextEl) firebaseStatusTextEl.innerText = `เชื่อมต่อแล้ว · ตู้ ${KIOSK_ID}`;
                if (firebaseStatusEl) firebaseStatusEl.classList.add('online');

                listenToCloudHistory();
            } catch (err) {
                console.warn('Firebase init warning:', err);
                if (firebaseStatusTextEl) firebaseStatusTextEl.innerText = 'ออฟไลน์';
            }
        } else {
            if (firebaseStatusTextEl) firebaseStatusTextEl.innerText = 'โหมดในเครื่อง';
        }
    }

    // Which kiosk this screen is: set once with ?kiosk=ชื่อจุด in the link, remembered on the device
    const KIOSK_ID = (() => {
        const clean = v => String(v || '').trim().replace(/[^\p{L}\p{N}-]+/gu, '-').slice(0, 40);
        let id = '';
        try {
            const fromLink = clean(new URLSearchParams(location.search).get('kiosk'));
            if (fromLink) localStorage.setItem('ecoscan_kiosk_id', fromLink);
            id = fromLink || clean(localStorage.getItem('ecoscan_kiosk_id'));
        } catch (e) { /* storage blocked: use the default */ }
        return id || 'main';
    })();

    // Local calendar day as YYYY-MM-DD, so daily totals line up with the kiosk's clock
    function dayId(d = new Date()) {
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    function saveScanToCloud(historyItem, info) {
        if (!db) return;
        try {
            const day = dayId();
            db.collection('scans').add({
                item: historyItem.item,
                bin: historyItem.bin,
                type: historyItem.type,
                confidence: historyItem.confidence,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                timeString: historyItem.time,
                day,
                kiosk: KIOSK_ID
            });

            // Daily totals: one doc for all kiosks (stats/2026-10-30) and one per kiosk (stats/2026-10-30__main)
            const inc = firebase.firestore.FieldValue.increment;
            const counts = {
                total: inc(1),
                recyclable: inc(info.type === 'recyclable' ? 1 : 0),
                general: inc(info.type === 'general' ? 1 : 0),
                hazardous: inc(info.type === 'hazardous' ? 1 : 0),
                co2: inc(info.type === 'recyclable' ? 0.15 : 0),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                day
            };
            db.collection('stats').doc(day).set(counts, { merge: true })
                .catch(err => console.warn('Daily stats save failed:', err.code || err));
            db.collection('stats').doc(`${day}__${KIOSK_ID}`).set({ ...counts, kiosk: KIOSK_ID }, { merge: true })
                .catch(err => console.warn('Kiosk stats save failed:', err.code || err));
        } catch (e) {
            console.error('Cloud save error:', e);
        }
    }

    function listenToCloudHistory() {
        if (!db) return;
        try {
            db.collection('scans').orderBy('timestamp', 'desc').limit(50)
                .onSnapshot(snapshot => {
                    const cloudScans = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        cloudScans.push({
                            id: doc.id,
                            time: data.timeString || '--:--',
                            item: data.item,
                            bin: data.bin,
                            type: data.type,
                            confidence: data.confidence
                        });
                    });
                    if (cloudScans.length > 0) {
                        scanHistory = cloudScans;
                        renderHistoryTable();
                    }
                }, err => console.warn('Firestore snapshot warning:', err));
        } catch (e) {
            console.warn('Listen to cloud history error:', e);
        }
    }

    // Stability Auto Scan & Countdown State
    let isCountdownActive = false;
    let countdownInterval = null;

    const DETECT_INTERVAL_MS = 250; // Limit CPU use during live preview
    let lastDetectTime = 0;
    let lastPredictionUIKey = '';

    let feedbackStats = { correct: 0, incorrect: 0 };
    // Vote over the last moment of frames so one odd frame doesn't flip the answer
    const VOTE_WINDOW_MS = 900;
    let voteBuffer = [];
    let lastCommit = null;             // what was just scanned, for the ถูก/ผิด buttons

    // Statistics & History State
    let stats = {
        total: 0,
        plastic_bottle: 0,
        recyclable: 0,
        general: 0,
        hazardous: 0,
        co2: 0.0,
        estimatedValue: 0.0
    };
    let scanHistory = [];
    let currentDialect = 'central'; // 'central' (ภาษากลาง) or 'khammuang' (คำเมืองล้านนา)

    // --- DOM Element References ---
    const webcamEl = document.getElementById('webcam');
    const cameraLoaderEl = document.getElementById('cameraLoader');
    const loaderMessageEl = document.getElementById('loaderMessage');
    const aiStatusTextEl = document.getElementById('aiStatusText');
    const aiStatusEl = document.getElementById('aiStatus');
    const cameraSelectEl = document.getElementById('cameraSelect');
    const confidenceSlider = document.getElementById('confidenceSlider');
    const confidenceVal = document.getElementById('confidenceVal');
    const kioskConfidenceSelect = document.getElementById('kioskConfidenceSelect');
    const confBtns = document.querySelectorAll('.conf-btn');


    const toggleDialectBtn = document.getElementById('toggleDialectBtn');
    const dialectLabel = document.getElementById('dialectLabel');
    const toggleSoundBtn = document.getElementById('toggleSoundBtn');
    const soundIcon = document.getElementById('soundIcon');
    const toggleCameraBtn = document.getElementById('toggleCameraBtn');

    const snapshotBtn = document.getElementById('snapshotBtn');
    const resetStatsBtn = document.getElementById('resetStatsBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const mascotHelperCard = document.getElementById('mascotHelperCard');
    const mascotGreetingText = document.getElementById('mascotGreetingText');
    const mascotSortingImg = document.getElementById('mascotSortingImg');
    const modalMascotImg = document.getElementById('modalMascotImg');
    const kioskBannerMascot = document.getElementById('kioskBannerMascot');

    const cameraFlashOverlay = document.getElementById('cameraFlashOverlay');
    const scanModeToggleBtn = document.getElementById('scanModeToggleBtn');
    const scanModeToggleText = document.getElementById('scanModeToggleText');
    const shutterScanBtn = document.getElementById('shutterScanBtn');
    const modalCapturedWrap = document.getElementById('modalCapturedWrap');
    const modalCapturedImg = document.getElementById('modalCapturedImg');
    const viewfinderContainerEl = document.querySelector('.viewfinder-container');
    const kioskViewfinderEl = document.querySelector('.kiosk-viewfinder');

    // Default to 'snap' (press shutter) on mobile phones for 60fps smooth camera & crisp still shots; 'auto' on desktop/kiosk
    const isPhoneScreen = /Mobi|Android|iPhone|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768;
    let scanMode = isPhoneScreen ? 'snap' : 'auto';

    function playShutterSound() {
        if (isSoundMuted) return;
        try {
            const ctxAudio = getAudioContext();
            const now = ctxAudio.currentTime;
            // Crisp mechanical shutter click (high-pass noise burst + quick resonant snap)
            const bufLen = Math.floor(ctxAudio.sampleRate * 0.045);
            const buf = ctxAudio.createBuffer(1, bufLen, ctxAudio.sampleRate);
            const ch = buf.getChannelData(0);
            for (let i = 0; i < bufLen; i++) {
                ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.22));
            }
            const noise = ctxAudio.createBufferSource();
            noise.buffer = buf;
            const filter = ctxAudio.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(2200, now);
            const gain = ctxAudio.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.045);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctxAudio.destination);
            noise.start(now);
        } catch (e) { /* ignore */ }
    }

    function setViewfinderGlow(type = null) {
        const classes = ['glow-plastic_bottle', 'glow-recyclable', 'glow-general', 'glow-hazardous', 'glow-money'];
        [viewfinderContainerEl, kioskViewfinderEl].forEach(el => {
            if (!el) return;
            el.classList.remove(...classes);
            if (type) el.classList.add(`glow-${type}`);
        });
    }



    function triggerCameraFlash() {
        playShutterSound();
        if (!cameraFlashOverlay) return;
        cameraFlashOverlay.classList.remove('flash');
        void cameraFlashOverlay.offsetWidth;
        cameraFlashOverlay.classList.add('flash');
    }

    function captureThumbnailDataUrl(source, region = null) {
        try {
            const sw = source.videoWidth || source.naturalWidth || source.width;
            const sh = source.videoHeight || source.naturalHeight || source.height;
            if (!sw || !sh) return null;
            const c = document.createElement('canvas');
            c.width = 240;
            c.height = 240;
            const g = c.getContext('2d');
            let sx = 0, sy = 0, cw = sw, ch = sh;
            if (region && region[2] > 10 && region[3] > 10) {
                const pad = Math.max(region[2], region[3]) * 0.18;
                const side = Math.min(Math.max(sw, sh), Math.max(region[2], region[3]) + pad * 2);
                const cx = region[0] + region[2] / 2;
                const cy = region[1] + region[3] / 2;
                sx = Math.max(0, Math.min(sw - side, cx - side / 2));
                sy = Math.max(0, Math.min(sh - side, cy - side / 2));
                cw = Math.min(sw - sx, side);
                ch = Math.min(sh - sy, side);
            } else {
                const side = Math.min(sw, sh);
                sx = (sw - side) / 2;
                sy = (sh - side) / 2;
                cw = side;
                ch = side;
            }
            g.drawImage(source, sx, sy, cw, ch, 0, 0, 240, 240);
            return c.toDataURL('image/jpeg', 0.82);
        } catch (e) {
            return null;
        }
    }

    function updateScanModeUI() {
        const isSnap = scanMode === 'snap' && !isKioskMode;
        if (scanModeToggleText) {
            scanModeToggleText.innerText = isSnap ? 'โหมดถ่ายรูป' : 'ดูผลสด';
        }
        if (scanModeToggleBtn) {
            const icon = scanModeToggleBtn.querySelector('i');
            if (icon) icon.className = isSnap ? 'fa-solid fa-camera' : 'fa-solid fa-bolt';
            scanModeToggleBtn.classList.toggle('snap-active', isSnap);
        }
        if (shutterScanBtn) {
            shutterScanBtn.classList.toggle('prominent', isSnap);
        }
        if (liveResultText && liveChipKey === 'idle') {
            liveResultText.innerText = isSnap
                ? 'เล็งขยะให้อยู่กลางกรอบ แล้วกดปุ่ม 📸 ถ่ายรูป'
                : LIVE_CHIP_IDLE;
        }
        if (isSnap) {
            voteBuffer = [];
        }
    }

    if (scanModeToggleBtn) {
        scanModeToggleBtn.addEventListener('click', () => {
            scanMode = scanMode === 'snap' ? 'auto' : 'snap';
            updateScanModeUI();
        });
    }
    if (shutterScanBtn) {
        shutterScanBtn.addEventListener('click', () => triggerManualSnapshot());
    }

    const MASCOT_POSES = {
        plastic_bottle: 'logos/mascot-sorting.jpg',
        recyclable: 'logos/mascot-recyclable.jpg',
        general: 'logos/mascot-general.jpg',
        hazardous: 'logos/mascot-hazardous.jpg',
        money: 'logos/mascot-money.jpg'
    };

    function setMascotPose(type) {
        const src = MASCOT_POSES[type] || MASCOT_POSES.plastic_bottle;
        if (mascotSortingImg && !mascotSortingImg.src.endsWith(src)) mascotSortingImg.src = src;
        if (modalMascotImg && !modalMascotImg.src.endsWith(src)) modalMascotImg.src = src;
        if (kioskBannerMascot && !kioskBannerMascot.src.endsWith(src)) kioskBannerMascot.src = src;
    }

    // --- Admin PIN Lock (protects trainer & stats reset on public kiosks) ---
    const DEFAULT_ADMIN_PIN = '2569';
    function requireAdminPin(actionName = 'จัดการระบบ') {
        try {
            if (sessionStorage.getItem('ecoscan_admin_unlocked') === '1') return true;
        } catch (e) { /* ignore */ }
        const expected = (localStorage.getItem('ecoscan_admin_pin') || DEFAULT_ADMIN_PIN).trim();
        const entered = prompt(`🔒 กรุณาใส่รหัส PIN เจ้าหน้าที่ 4 หลัก เพื่อ${actionName}:`);
        if (entered === null) return false;
        if (entered.trim() === expected) {
            try { sessionStorage.setItem('ecoscan_admin_unlocked', '1'); } catch (e) { /* ignore */ }
            return true;
        }
        alert('รหัส PIN ไม่ถูกต้อง');
        return false;
    }

    // --- Dynamic Mascot Speech Bubble Reactions ---
    function updateMascotReaction(info) {
        setMascotPose(info.type);
        if (!mascotGreetingText) return;
        const isKhammuang = currentDialect === 'khammuang';
        let msg = '';
        if (info.type === 'money') {
            msg = isKhammuang
                ? '“อุ๊ย! อันนี้แม่นเงินเน้อ อย่าเอาทิ้ง เก็บใส่เป๋าไว้ดี ๆ เน้อ 💵”'
                : '“อุ๊ย! นี่คือเงินนะ อย่าทิ้ง เก็บไว้ให้ดีนะ 💵”';
        } else if (info.type === 'plastic_bottle') {
            msg = isKhammuang
                ? `“เก่งขนาด! ${info.thName} เทน้ำ บีบขวด ทิ้งลงถังรีไซเคิลเน้อ 🍾”`
                : `“เยี่ยมเลย! ${info.thName} เทน้ำ บีบขวด ทิ้งลงถังรีไซเคิลนะ 🍾”`;
        } else if (info.type === 'recyclable') {
            msg = isKhammuang
                ? `“ฮอมบุญตวยกัน! ${info.thName} ทิ้งลงถังรีไซเคิล ขายได้เงินเข้ากองทุนเน้อ ♻️”`
                : `“ร่วมทำบุญด้วยกัน! ${info.thName} ทิ้งลงถังรีไซเคิลนะ ♻️”`;
        } else if (info.type === 'hazardous') {
            msg = isKhammuang
                ? `“ระวังเน้อ! ${info.thName} เป๋นขยะอันตราย ทิ้งลงถังสีแดงอย่างระมัดระวังเน้อ ☣️”`
                : `“ระวังนะ! ${info.thName} เป็นขยะอันตราย แยกทิ้งลงถังสีแดงนะ ☣️”`;
        } else {
            msg = isKhammuang
                ? `“ขอบคุณเน้อ! ${info.thName} เอาทิ้งลง${info.bin}หื้อเรียบร้อยเน้อ 🗑️”`
                : `“ขอบคุณนะ! ${info.thName} ทิ้งลง${info.bin}ให้เรียบร้อยนะ 🗑️”`;
        }
        mascotGreetingText.innerText = msg;
        if (mascotHelperCard) {
            mascotHelperCard.classList.remove('mascot-pop');
            void mascotHelperCard.offsetWidth;
            mascotHelperCard.classList.add('mascot-pop');
        }
    }

    // UI Prediction Card Elements
    const confidencePill = document.getElementById('confidencePill');
    const binResultBadge = document.getElementById('binResultBadge');
    const binIcon = document.getElementById('binIcon');
    const detectedObjectText = document.getElementById('detectedObjectText');
    const binTitleText = document.getElementById('binTitleText');
    const binDescriptionText = document.getElementById('binDescriptionText');
    const itemPricePill = document.getElementById('itemPricePill');
    const itemPriceText = document.getElementById('itemPriceText');
    const nextScanCountdownEl = document.getElementById('nextScanCountdown');
    const countdownNumberEl = document.getElementById('countdownNumber');

    // Kiosk Mode DOM Elements
    const toggleKioskBtn = document.getElementById('toggleKioskBtn');
    const exitKioskBtn = document.getElementById('exitKioskBtn');
    const kioskOverlay = document.getElementById('kioskOverlay');
    const kioskWebcam = document.getElementById('kioskWebcam');
    const kioskTotalCountEl = document.getElementById('kioskTotalCount');
    const kioskCountdownOverlay = document.getElementById('kioskCountdownOverlay');
    const kioskCountdownNumEl = document.getElementById('kioskCountdownNum');
    const kioskBanner = document.getElementById('kioskBanner');
    const kioskBinIcon = document.getElementById('kioskBinIcon');
    const kioskObjectName = document.getElementById('kioskObjectName');
    const kioskBinTitle = document.getElementById('kioskBinTitle');
    const kioskBinDesc = document.getElementById('kioskBinDesc');
    const kioskCameraSelectEl = document.getElementById('kioskCameraSelect');


    // Stats Elements
    const totalCountEl = document.getElementById('totalCount');
    const recyclableCountEl = document.getElementById('recyclableCount');
    const generalCountEl = document.getElementById('generalCount');
    const hazardousCountEl = document.getElementById('hazardousCount');
    const totalValueCountEl = document.getElementById('totalValueCount');


    // Eco Impact & Tree Meter Elements
    const co2SavedValEl = document.getElementById('co2SavedVal');
    const treeValEl = document.getElementById('treeVal');
    const energyValEl = document.getElementById('energyVal');

    // AI Verification Stats Elements
    const accuracyPillEl = document.getElementById('accuracyPill');
    const correctCountValEl = document.getElementById('correctCountVal');
    const incorrectCountValEl = document.getElementById('incorrectCountVal');
    const correctItemsListEl = document.getElementById('correctItemsList');
    const incorrectItemsListEl = document.getElementById('incorrectItemsList');

    // Merit Points & Eco Rank Elements
    const currentMeritPointsEl = document.getElementById('currentMeritPoints');
    const rankIconBoxEl = document.getElementById('rankIconBox');
    const rankTitleEl = document.getElementById('rankTitle');
    const rankDescEl = document.getElementById('rankDesc');
    const rankProgressBarEl = document.getElementById('rankProgressBar');
    const rankProgressTextEl = document.getElementById('rankProgressText');

    let lastScanInfo = null;

    const historyTableBody = document.getElementById('historyTableBody');





    // Result Verification Modal DOM Elements
    const resultModalBackdrop = document.getElementById('resultModalBackdrop');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalObjectIcon = document.getElementById('modalObjectIcon');
    const modalObjectName = document.getElementById('modalObjectName');
    const modalCategoryPill = document.getElementById('modalCategoryPill');
    const modalDesc = document.getElementById('modalDesc');
    const modalTimerNum = document.getElementById('modalTimerNum');


    // Sample buttons
    const sampleBtns = document.querySelectorAll('.sample-btn');


    // --- Audio Synthesizer (Web Audio API & Speech Synthesis) ---
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playChime(wasteType) {
        if (isSoundMuted) return;
        try {
            const ctxAudio = getAudioContext();
            const osc = ctxAudio.createOscillator();
            const gain = ctxAudio.createGain();
            osc.connect(gain);
            gain.connect(ctxAudio.destination);

            const now = ctxAudio.currentTime;

            if (wasteType === 'plastic_bottle' || wasteType === 'recyclable') {
                // High pleasant double chime for Plastic Bottle & Recyclable

                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (wasteType === 'hazardous') {
                // Sharp dual warning tone for Hazardous
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(880, now); // A5
                osc.frequency.setValueAtTime(440, now + 0.1); // A4
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (wasteType === 'money') {
                // Joyful double chime (G5 -> C6) for Money
                osc.type = 'sine';
                osc.frequency.setValueAtTime(783.99, now); // G5
                osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.12); // C6
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            } else {
                // Soft dual tone for General Waste
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(349.23, now); // F4
                osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.15); // C4
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            }

        } catch (e) {
            console.error('Audio play error:', e);
        }
    }

    const audioUnlockBanner = document.getElementById('audioUnlockBanner');
    let cachedThaiVoice = null;
    let speechUnlocked = false;
    let pendingSpeechText = '';

    function refreshThaiVoice() {
        if (!('speechSynthesis' in window)) return;
        const voices = window.speechSynthesis.getVoices() || [];
        cachedThaiVoice = voices.find(v => /^th(-|_|$)/i.test(v.lang)) || null;
    }
    if ('speechSynthesis' in window) {
        refreshThaiVoice();
        window.speechSynthesis.onvoiceschanged = refreshThaiVoice;
    }

    function showAudioUnlockBanner() {
        if (audioUnlockBanner && !isSoundMuted && !speechUnlocked) {
            audioUnlockBanner.classList.remove('hidden');
        }
    }

    function hideAudioUnlockBanner() {
        if (audioUnlockBanner) audioUnlockBanner.classList.add('hidden');
    }

    function speakThaiText(text, { isAuto = false } = {}) {
        if (isSoundMuted || !('speechSynthesis' in window) || !text) return;
        try {
            if (!cachedThaiVoice) refreshThaiVoice();
            // On iOS Safari, calling cancel() when idle can drop the next speak() call
            if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                window.speechSynthesis.cancel();
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'th-TH';
            if (cachedThaiVoice) utterance.voice = cachedThaiVoice;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            utterance.onstart = () => {
                speechUnlocked = true;
                pendingSpeechText = '';
                hideAudioUnlockBanner();
            };
            utterance.onerror = (ev) => {
                if (ev && ev.error === 'not-allowed') {
                    pendingSpeechText = text;
                    showAudioUnlockBanner();
                }
            };
            window.speechSynthesis.speak(utterance);

            // Safari/iOS silently drops autoplay speech without firing onerror
            if (isAuto && !speechUnlocked) {
                setTimeout(() => {
                    if (!speechUnlocked && !window.speechSynthesis.speaking) {
                        pendingSpeechText = text;
                        showAudioUnlockBanner();
                    }
                }, 600);
            }
        } catch (e) {
            console.error('Speech synthesis error:', e);
        }
    }

    function tryAutoWelcomeSpeech() {
        if (isSoundMuted) return;
        const greeting = currentDialect === 'khammuang'
            ? 'สวัสดี น้องตาวิเศษพร้อมฮอมบุญแยกขยะแล้ว ยื่นขยะมาหน้ากล้องได้เลยเน้อ'
            : 'สวัสดี น้องตาวิเศษพร้อมแยกขยะแล้ว ยื่นขยะมาหน้ากล้องได้เลยนะ';
        speakThaiText(greeting, { isAuto: true });
    }



    // --- Initialization & Model Loading ---
    async function initApp() {
        loadSavedStats();
        loadFeedback();
        initFirebase();

        // 1. Try starting webcam
        try {
            loaderMessageEl.innerText = 'กำลังขออนุญาตเปิดกล้องและเชื่อมต่อ...';
            await startWebcam();
            isCameraActive = true;
        } catch (camErr) {
            console.warn('Webcam warning:', camErr);
            showCameraFallbackMessage('ไม่พบกล้องหรือยังไม่อนุญาตการใช้กล้อง — ใช้ปุ่มตัวอย่างสิ่งของทดลองได้');
        }

        // Came back from the nightly refresh: go straight back to the kiosk screen
        try {
            if (sessionStorage.getItem('ecoscan_resume_kiosk') === '1') {
                sessionStorage.removeItem('ecoscan_resume_kiosk');
                enterKioskMode();
            }
        } catch (e) { /* storage blocked: stay on the normal screen */ }

        try {
            loaderMessageEl.innerText = 'กำลังโหลด RecycleNet Small...';
            const engine = new RecycleNet();
            await engine.load();
            model = engine;
            aiStatusTextEl.innerText = 'AI พร้อม · RecycleNet Small';
            aiStatusEl.classList.add('ready');

            cameraLoaderEl.classList.add('hidden');
            isDetecting = true;
            requestAnimationFrame(detectLoop);

            // Greet user immediately (falls back to tap-to-enable pill if browser blocks autoplay)
            tryAutoWelcomeSpeech();


        } catch (modelErr) {
            console.error('Model load error:', modelErr);
            loaderMessageEl.innerHTML = `<span style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> ไม่สามารถโหลดโมเดล AI ได้</span><br><small>กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต ระบบจะลองใหม่เองใน 15 วินาที</small>`;
            aiStatusTextEl.innerText = 'ข้อผิดพลาด AI';
            // An unattended kiosk shouldn't stay broken: try again once the internet is likely back
            setTimeout(() => {
                if (isKioskMode) {
                    try { sessionStorage.setItem('ecoscan_resume_kiosk', '1'); } catch (e) { /* storage blocked */ }
                }
                location.reload();
            }, 15000);
        }
    }

    function showCameraFallbackMessage(msg) {
        loaderMessageEl.innerHTML = `<span style="color: #f59e0b;"><i class="fa-solid fa-camera"></i> ${msg}</span>`;
        setTimeout(() => {
            if (model) {
                cameraLoaderEl.classList.add('hidden');
            }
        }, 3000);
    }

    // --- Device Enumeration for Camera Selector ---
    async function populateCameraDevices() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');

            if (videoDevices.length === 0) {
                if (cameraSelectEl) cameraSelectEl.innerHTML = `<option value="">ไม่พบกล้องในระบบ</option>`;
                if (kioskCameraSelectEl) kioskCameraSelectEl.innerHTML = `<option value="">ไม่พบกล้อง</option>`;
                return;
            }

            const optionsHtml = videoDevices.map((device, index) => {
                const label = device.label || `กล้องที่ ${index + 1}`;
                const isSelected = selectedDeviceId ? selectedDeviceId === device.deviceId : index === 0;
                return `<option value="${device.deviceId}" ${isSelected ? 'selected' : ''}>${label}</option>`;
            }).join('');

            if (cameraSelectEl) cameraSelectEl.innerHTML = optionsHtml;
            if (kioskCameraSelectEl) kioskCameraSelectEl.innerHTML = optionsHtml;
        } catch (e) {
            console.warn('Enumerate devices warning:', e);
        }
    }


    // --- Webcam Handler with Device ID & Safe Race-Condition Check ---
    let currentFacingMode = 'environment';

    async function startWebcam(deviceId = null, facingOverride = null) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('เบราว์เซอร์ไม่รองรับกล้อง Webcam หรือไม่ได้รันบนเซิร์ฟเวอร์ย่อย');
        }

        // Stop previous camera tracks if active
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
        }

        const targetId = facingOverride ? null : (deviceId || selectedDeviceId);
        if (facingOverride) {
            selectedDeviceId = null;
            currentFacingMode = facingOverride;
        }

        const videoConstraints = targetId
            ? { deviceId: { exact: targetId }, width: { ideal: 640 }, height: { ideal: 480 } }
            : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: { ideal: currentFacingMode } };

        webcamStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: false
        });

        webcamEl.srcObject = webcamStream;
        if (kioskWebcam) kioskWebcam.srcObject = webcamStream;

        // Remember active deviceId
        const activeTrack = webcamStream.getVideoTracks()[0];
        if (activeTrack && activeTrack.getSettings) {
            const settings = activeTrack.getSettings();
            if (settings.deviceId) selectedDeviceId = settings.deviceId;
        }

        await populateCameraDevices();

        return new Promise((resolve) => {
            let metaDone = false;
            const onMeta = () => {
                if (metaDone) return;
                metaDone = true;
                webcamEl.onloadedmetadata = null;
                webcamEl.play().catch(e => console.log('Autoplay handled:', e));
                if (kioskWebcam) kioskWebcam.play().catch(e => console.log('Kiosk autoplay handled:', e));
                resolve();
            };

            if (webcamEl.readyState >= 1) {
                onMeta();
            } else {
                webcamEl.onloadedmetadata = onMeta;
                setTimeout(onMeta, 1500);
            }
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && isKioskMode) keepScreenOn(true);
    });

    // --- Self-healing for unattended kiosks ---
    // 1) Camera watchdog: if the picture stops (cable pulled, USB reset, driver hiccup),
    //    reopen the camera by itself instead of leaving a frozen screen.
    const CAMERA_STALL_MS = 10000;
    const WATCHDOG_EVERY_MS = 3000;
    let lastVideoTime = -1;
    let lastVideoAdvance = Date.now();
    let cameraRecovering = false;
    let cameraRetryDelay = 2000;

    function cameraLooksDead() {
        if (!isCameraActive || !webcamStream) return false;
        const track = webcamStream.getVideoTracks()[0];
        if (!track || track.readyState === 'ended') return true;
        if (webcamEl.currentTime !== lastVideoTime) {
            lastVideoTime = webcamEl.currentTime;
            lastVideoAdvance = Date.now();
            return false;
        }
        return Date.now() - lastVideoAdvance > CAMERA_STALL_MS;
    }

    async function recoverCamera() {
        if (cameraRecovering) return;
        cameraRecovering = true;
        console.warn('Camera stopped sending pictures, reconnecting...');
        cameraLoaderEl.classList.remove('hidden');
        loaderMessageEl.innerText = 'กล้องหลุด กำลังเชื่อมต่อใหม่...';
        try {
            try {
                await startWebcam(selectedDeviceId);
            } catch (e) {
                // A re-plugged camera can come back with a new id: take any camera
                selectedDeviceId = null;
                await startWebcam(null);
            }
            cameraLoaderEl.classList.add('hidden');
            lastVideoAdvance = Date.now();
            cameraRetryDelay = 2000;
        } catch (err) {
            console.warn('Camera reconnect failed, will retry:', err);
            loaderMessageEl.innerText = 'ยังเชื่อมต่อกล้องไม่ได้ กำลังลองใหม่...';
            cameraRetryDelay = Math.min(cameraRetryDelay * 2, 60000);
            lastVideoAdvance = Date.now() + cameraRetryDelay - CAMERA_STALL_MS;
        } finally {
            cameraRecovering = false;
        }
    }

    setInterval(() => {
        if (document.hidden || cameraRecovering) return;
        if (cameraLooksDead()) recoverCamera();
    }, WATCHDOG_EVERY_MS);

    // 2) Nightly refresh: a page that runs for days slowly piles up memory. Reload once a night
    //    (around 03:00) when nobody is using the screen, and come back in kiosk mode if it was on.
    const NIGHTLY_RELOAD_HOUR = 3;
    const IDLE_BEFORE_RELOAD_MS = 5 * 60 * 1000;
    const pageStartedAt = Date.now();
    let lastUserActivity = Date.now();
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
        window.addEventListener(ev, () => { lastUserActivity = Date.now(); }, { passive: true }));

    setInterval(() => {
        const now = new Date();
        if (now.getHours() !== NIGHTLY_RELOAD_HOUR) return;
        if (Date.now() - pageStartedAt < 60 * 60 * 1000) return; // just (re)loaded
        const busySince = lastUserActivity;
        if (Date.now() - busySince < IDLE_BEFORE_RELOAD_MS) return;
        try {
            if (localStorage.getItem('ecoscan_last_nightly_reload') === dayId(now)) return;
            localStorage.setItem('ecoscan_last_nightly_reload', dayId(now));
            sessionStorage.setItem('ecoscan_resume_kiosk', isKioskMode ? '1' : '');
        } catch (e) { return; } // can't remember the reload: skip it rather than risk a loop
        location.reload();
    }, 60 * 1000);

    // --- Real-time Detection Loop ---
    async function detectLoop() {
        if (!isDetecting || !model || document.getElementById('scanConfirm').open || isSnapping || isCountdownActive || document.hidden || (scanMode === 'snap' && !isKioskMode)) {
            requestAnimationFrame(detectLoop);
            return;
        }

        const now = performance.now();
        if (isCameraActive && webcamEl.readyState === 4 && now - lastDetectTime >= DETECT_INTERVAL_MS) {
            lastDetectTime = now;
            try {
                const candidate = await analyzeFrame(webcamEl, true);
                if (!isSnapping && !isCountdownActive) processCandidate(candidate);
            } catch (e) {
                console.error('Detection loop error:', e);
            }
        }

        requestAnimationFrame(detectLoop);
    }

    const CORRECTION_INFO = {
        recyclable: { type: 'recyclable', thName: 'ขยะรีไซเคิล', bin: 'ขยะรีไซเคิล', desc: 'แยกตามวัสดุและทำความสะอาดก่อนทิ้ง' },
        general: DEFAULT_GENERAL_WASTE,
        hazardous: { type: 'hazardous', thName: 'ขยะอันตราย', bin: 'ขยะอันตราย', desc: 'แยกทิ้งที่จุดรับขยะอันตราย' },
    };
    const MATERIAL_INFO = {
        cardboard: { ...CORRECTION_INFO.recyclable, thName: '📦 กระดาษลัง' },
        glass: { ...CORRECTION_INFO.recyclable, thName: '🍾 แก้ว' },
        metal: { ...CORRECTION_INFO.recyclable, thName: '🥫 โลหะ' },
        paper: { ...CORRECTION_INFO.recyclable, thName: '📄 กระดาษ' },
        plastic: { ...CORRECTION_INFO.recyclable, thName: '♻️ พลาสติก', desc: 'ตรวจว่าเป็นขวด PET/HDPE หรือไม่ และคัดเฉพาะพลาสติกที่จุดรับรับซื้อ' },
        trash: DEFAULT_GENERAL_WASTE
    };

    async function analyzeFrame(source, cropCenter = false, checkBattery = false) {
        const minimumMargin = 0.15;
        const result = await model.predict(source, cropCenter, currentConfidenceThreshold, minimumMargin);
        if (checkBattery && result.batteryWarning) return { batteryWarning: true };
        const info = MATERIAL_INFO[result.label];
        let { score, margin } = result;
        if (info.type === 'recyclable' && result.recyclablePairScore !== undefined) {
            score = result.recyclablePairScore;
            margin = score - result.outsidePairScore;
        }
        if (score < currentConfidenceThreshold || margin < minimumMargin) return null;
        if (checkBattery && info.type === 'recyclable' && result.foamScore >= 0.90) {
            return { key: 'general', score: result.foamScore, info: CORRECTION_INFO.general };
        }
        return { key: info.type, score, info };
    }

    // --- Vote over recent frames & Hold-Steady trigger ---
    function resetHold() {
        setLiveChip(null);
    }

    let isLowLight = false;
    let lastLightCheckTime = 0;
    const lightSampleCanvas = document.createElement('canvas');
    lightSampleCanvas.width = 32;
    lightSampleCanvas.height = 24;
    const lightSampleCtx = lightSampleCanvas.getContext('2d', { willReadFrequently: true });

    function checkLowLight(source) {
        const now = performance.now();
        if (now - lastLightCheckTime < 1500 || !lightSampleCtx) return;
        lastLightCheckTime = now;
        try {
            lightSampleCtx.drawImage(source, 0, 0, 32, 24);
            const data = lightSampleCtx.getImageData(0, 0, 32, 24).data;
            let sum = 0;
            for (let i = 0; i < data.length; i += 4) {
                sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            }
            const avgLuma = sum / (32 * 24);
            const dark = avgLuma < 48;
            if (dark !== isLowLight) {
                isLowLight = dark;
                if (liveChipKey === 'idle' && liveResultText) {
                    liveResultText.innerText = isLowLight
                        ? '💡 แสงน้อย ลองขยับเข้าหาแสงเพื่อให้ AI แม่นขึ้น'
                        : LIVE_CHIP_IDLE;
                }
            }
        } catch (e) { /* ignore cross-origin or video-not-ready */ }
    }

    function processCandidate(candidate) {
        if (isCountdownActive) {
            voteBuffer = [];
            return;
        }

        if (isCameraActive && webcamEl.readyState === 4) {
            checkLowLight(webcamEl);
        }

        const VOTE_MAX_FRAMES = 6;
        const nowP = performance.now();
        voteBuffer = voteBuffer.filter(v => nowP - v.t <= VOTE_WINDOW_MS);
        if (!candidate) {
            voteBuffer = [];
            resetHold();
            return;
        }
        voteBuffer.push({ key: candidate.key, score: candidate.score, t: nowP, candidate });
        if (voteBuffer.length > VOTE_MAX_FRAMES) voteBuffer.shift();

        // Multi-Frame Majority Voting: pick label with the most frames, tie-break by highest average confidence
        const totals = new Map();
        const counts = new Map();
        voteBuffer.forEach(v => {
            totals.set(v.key, (totals.get(v.key) || 0) + v.score);
            counts.set(v.key, (counts.get(v.key) || 0) + 1);
        });
        let winKey = null;
        let bestCount = -1;
        let bestAvg = -1;
        counts.forEach((cnt, key) => {
            const avg = totals.get(key) / cnt;
            if (cnt > bestCount || (cnt === bestCount && avg > bestAvg)) {
                bestCount = cnt;
                bestAvg = avg;
                winKey = key;
            }
        });

        const winner = [...voteBuffer].reverse().find(v => v.key === winKey).candidate;
        const avgScore = bestAvg;

        // Only update live UI once we have at least 2 agreeing frames (filters out single-frame motion blur)
        if (bestCount >= 2 || voteBuffer.length === 1) {
            updatePredictionUI(winner.info, avgScore);
        }

    }

    // --- Live answer shown right on the camera, so people don't have to look away ---
    const liveResultChip = document.getElementById('liveResultChip');
    const liveResultText = document.getElementById('liveResultText');
    const LIVE_CHIP_IDLE = 'ยื่นขยะชิ้นเดียวเข้ากลางกรอบ แล้วกดสแกนเพื่อยืนยัน';
    let liveChipKey = '';

    function setLiveChip(info) {
        if (!liveResultChip) return;
        const key = info ? `${info.type}|${info.thName}` : 'idle';
        if (key === liveChipKey) return;
        liveChipKey = key;
        if (!info) {
            liveResultChip.className = 'live-result-chip idle';
            liveResultText.innerText = LIVE_CHIP_IDLE;
            setViewfinderGlow(null);
            return;
        }
        liveResultChip.className = `live-result-chip ${info.type}`;
        setViewfinderGlow(info.type);
        liveResultText.innerText = info.type === 'money'
            ? `${info.thName} · ไม่ควรทิ้ง!`
            : `${info.thName} → ${info.bin}`;
    }

    // Buy-back price from the เทศบาลตำบลแม่จัน price board, plus the rough value of this one item
    function setPricePill(pill, textEl, info) {
        if (!pill || !textEl) return;
        if (!info.price || info.type === 'money') {
            pill.classList.add('hidden');
            return;
        }
        const est = Number(info.estValue) || 0;
        textEl.innerText = est > 0
            ? `ราคารับซื้อ ${info.price} · ชิ้นนี้ประมาณ ${est.toFixed(2)} บาท`
            : `ราคารับซื้อ: ${info.price}`;
        pill.classList.remove('hidden');
    }

    // --- Update UI Badge & Cards ---
    function updatePredictionUI(info, score) {
        confidencePill.innerText = score === null ? 'ผู้ใช้เลือกถัง' : `คะแนน AI ${Math.round(score * 100)}%`;
        setLiveChip(info);

        // Only rebuild the result card when the detected item changes (rebuilding every frame makes it flash)
        const uiKey = `${info.type}|${info.thName}|${info.bin}|${info.desc}`;
        if (uiKey === lastPredictionUIKey) return;
        lastPredictionUIKey = uiKey;
        setMascotPose(info.type);

        binResultBadge.className = `bin-result-badge ${info.type}`;
        detectedObjectText.innerText = info.thName;
        binDescriptionText.innerText = info.desc;
        setPricePill(itemPricePill, itemPriceText, info);

        if (info.type === 'plastic_bottle') {
            binIcon.innerHTML = `<i class="fa-solid fa-bottle-water"></i>`;
            binTitleText.innerText = `ทิ้งลง: ${info.bin}`;
        } else if (info.type === 'recyclable') {
            binIcon.innerHTML = `<i class="fa-solid fa-recycle"></i>`;
            binTitleText.innerText = `ทิ้งลง: ${info.bin}`;
        } else if (info.type === 'hazardous') {
            binIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
            binTitleText.innerText = `ทิ้งลง: ${info.bin}`;
        } else if (info.type === 'money') {
            binIcon.innerHTML = `<i class="fa-solid fa-money-bill-wave"></i>`;
            binTitleText.innerText = `นี่คือ เงิน ไม่ควรทิ้ง!`;
        } else {
            binIcon.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
            binTitleText.innerText = `ทิ้งลง: ${info.bin}`;
        }

        // Update Kiosk Mode Banner if active
        if (kioskBanner) {
            kioskBanner.className = `kiosk-banner ${info.type}`;
            kioskObjectName.innerText = info.thName;
            kioskBinDesc.innerText = info.desc;

            if (info.type === 'plastic_bottle') {
                kioskBinIcon.innerHTML = `<i class="fa-solid fa-bottle-water"></i>`;
                kioskBinTitle.innerText = `ทิ้งลง: ${info.bin}`;
            } else if (info.type === 'recyclable') {
                kioskBinIcon.innerHTML = `<i class="fa-solid fa-recycle"></i>`;
                kioskBinTitle.innerText = `ทิ้งลง: ${info.bin}`;
            } else if (info.type === 'hazardous') {
                kioskBinIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
                kioskBinTitle.innerText = `ทิ้งลง: ${info.bin}`;
            } else if (info.type === 'money') {
                kioskBinIcon.innerHTML = `<i class="fa-solid fa-money-bill-wave"></i>`;
                kioskBinTitle.innerText = `นี่คือ เงิน ไม่ควรทิ้ง!`;
            } else {
                kioskBinIcon.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
                kioskBinTitle.innerText = `ทิ้งลง: ${info.bin}`;
            }
        }


    }

    // --- Commit Scan to History & Stats ---
    // Add (sign = 1) or take back (sign = -1) one scanned item from the stats
    function applyStats(info, sign) {
        const pos = v => Math.max(0, v);
        stats.total = pos(stats.total + sign);
        if (info.type === 'plastic_bottle') {
            stats.plastic_bottle = pos((stats.plastic_bottle || 0) + sign);
            stats.co2 = pos(stats.co2 + 0.18 * sign);
            stats.estimatedValue = pos(stats.estimatedValue + (info.estValue ?? 0.15) * sign);
            stats.meritPoints = pos((stats.meritPoints || 0) + 10 * sign);
        } else if (info.type === 'recyclable') {
            stats.recyclable = pos((stats.recyclable || 0) + sign);
            stats.co2 = pos(stats.co2 + 0.15 * sign);
            stats.estimatedValue = pos(stats.estimatedValue + (info.estValue ?? 0.30) * sign);
            stats.meritPoints = pos((stats.meritPoints || 0) + 10 * sign);
        } else if (info.type === 'hazardous') {
            stats.hazardous = pos((stats.hazardous || 0) + sign);
            stats.estimatedValue = pos(stats.estimatedValue + (info.estValue || 0.00) * sign);
            stats.meritPoints = pos((stats.meritPoints || 0) + 15 * sign);
        } else if (info.type === 'money') {
            // Money is not waste
            stats.meritPoints = pos((stats.meritPoints || 0) + 20 * sign);
        } else {
            stats.general = pos((stats.general || 0) + sign);
            stats.meritPoints = pos((stats.meritPoints || 0) + 5 * sign);
        }
    }

    // "สถิติวันนี้" really means today: start fresh counts each new day (merit points carry over)
    function todayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    function ensureStatsAreToday() {
        if (stats.day === todayKey()) return;
        const merit = stats.meritPoints || 0;
        stats = { total: 0, plastic_bottle: 0, recyclable: 0, general: 0, hazardous: 0, co2: 0.0, estimatedValue: 0.0, meritPoints: merit, day: todayKey() };
    }

    function commitWasteScan(info, score, capture = null) {
        ensureStatsAreToday();
        applyStats(info, 1);

        updateStatsUI();
        updateMascotReaction(info);

        // Cute confetti on eco/money scans + celebration every 5 items!
        if (info.type === 'money') {
            spawnCuteConfetti('money');
        } else if (info.type === 'plastic_bottle' || info.type === 'recyclable') {
            spawnCuteConfetti('eco');
        }
        if (stats.total > 0 && stats.total % 5 === 0) {
            showMilestoneCelebration(stats.total);
        }

        // Show captured snapshot thumbnail in Result Modal when available (with auto-snap flash)
        if (modalCapturedWrap && modalCapturedImg) {
            const thumb = capture && capture.source ? captureThumbnailDataUrl(capture.source, capture.region) : null;
            if (thumb) {
                if (!isSnapping && capture.source === webcamEl) triggerCameraFlash();
                modalCapturedImg.src = thumb;
                modalCapturedWrap.classList.remove('hidden');
            } else {
                modalCapturedWrap.classList.add('hidden');
            }
        }

        // Add history log entry
        const timeString = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        lastScanInfo = { info, score, time: timeString };
        const historyItem = {
            id: Date.now(),
            time: timeString,
            item: info.thName,
            bin: info.bin,
            type: info.type,
            confidence: score === null ? '–' : `${Math.round(score * 100)}%`
        };


        lastCommit = { info, historyId: historyItem.id };
        resetFeedbackUI();

        scanHistory.unshift(historyItem);
        if (scanHistory.length > 50) scanHistory.pop();
        renderHistoryTable();
        saveStats(); // Save after the new entry is added so it survives a page reload

        // Save to Firebase Cloud Firestore (waste-5b576)
        saveScanToCloud(historyItem, info);

        // Populate Modal Content
        if (resultModalBackdrop) {
            modalObjectName.innerText = info.thName;
            modalCategoryPill.className = `modal-category-pill ${info.type}`;
            modalCategoryPill.innerText = score === null ? info.bin : `${info.bin} · คะแนน AI ${Math.round(score * 100)}%`;
            modalDesc.innerText = info.desc;
            setPricePill(document.getElementById('modalPricePill'), document.getElementById('modalPriceText'), info);
            modalObjectIcon.className = `modal-object-icon ${info.type}`;
            
            if (info.type === 'plastic_bottle') {
                modalObjectIcon.innerHTML = `<i class="fa-solid fa-bottle-water"></i>`;
            } else if (info.type === 'recyclable') {
                modalObjectIcon.innerHTML = `<i class="fa-solid fa-recycle"></i>`;
            } else if (info.type === 'hazardous') {
                modalObjectIcon.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
            } else if (info.type === 'money') {
                modalObjectIcon.innerHTML = `<i class="fa-solid fa-money-bill-wave"></i>`;
            } else {
                modalObjectIcon.innerHTML = `<i class="fa-solid fa-trash-can"></i>`;
            }
        }


        // Audio & Speech Feedback (Supports Lanna Khammuang & Central Thai Dialects)
        playChime(info.type);
        if (info.type === 'money') {
            if (currentDialect === 'khammuang') {
                speakThaiText('อันนี้แม่นเงินเน้อ! อย่าเอาทิ้งเน้อ เก็บไว้ในเป๋าเป๋นบุญเป๋นกุศล');
            } else {
                speakThaiText('นี่คือ เงิน ไม่ควรทิ้ง');
            }
        } else if (info.type === 'plastic_bottle') {
            if (currentDialect === 'khammuang') {
                speakThaiText(`${info.thName} เอาทิ้งลงถังรีไซเคิลเน้อ ฮอมบุญตวยกัน`);
            } else {
                speakThaiText(`${info.thName} ทิ้งลง${info.bin}`);
            }
        } else if (info.type === 'recyclable') {
            if (currentDialect === 'khammuang') {
                speakThaiText(`${info.thName} เอาทิ้งลงถังรีไซเคิลเน้อ ฮอมบุญตวยกัน`);
            } else {
                speakThaiText(`${info.thName} ทิ้งลง${info.bin}`);
            }
        } else if (info.type === 'hazardous') {
            if (currentDialect === 'khammuang') {
                speakThaiText(`อันตรายเน้อ! ${info.thName} เอาทิ้งลงถังขยะอันตรายสีแดงเน้อ`);
            } else {
                speakThaiText(`${info.thName} ทิ้งลง${info.bin}`);
            }
        } else {
            if (currentDialect === 'khammuang') {
                speakThaiText(`${info.thName} เอาทิ้งลง${info.bin}เน้อ`);
            } else {
                speakThaiText(`${info.thName} ทิ้งลง${info.bin}`);
            }
        }





        // Start 5-4-3-2-1 countdown for next scan
        startScanCountdown();
    }


    // --- Countdown before the next scan (result card stays up meanwhile) ---
    const NEXT_SCAN_SECONDS = 5;

    function setCountdownNumber(count) {
        countdownNumberEl.innerText = count;
        if (kioskCountdownNumEl) kioskCountdownNumEl.innerText = count;
        if (modalTimerNum) modalTimerNum.innerText = count;
    }

    function startScanCountdown() {
        if (countdownInterval) clearInterval(countdownInterval);

        isCountdownActive = true;

        let count = NEXT_SCAN_SECONDS;
        setCountdownNumber(count);

        nextScanCountdownEl.classList.remove('hidden');
        if (kioskCountdownOverlay) kioskCountdownOverlay.classList.remove('hidden');
        if (resultModalBackdrop) resultModalBackdrop.classList.remove('hidden');

        countdownInterval = setInterval(() => {
            count -= 1;
            if (count > 0) {
                setCountdownNumber(count);
                countdownNumberEl.style.animation = 'none';
                countdownNumberEl.offsetHeight;
                countdownNumberEl.style.animation = 'popScale 0.3s ease-out';
            } else {
                finishCountdown();
            }
        }, 1000);
    }

    // Pause while the person is answering "which bin was it?"
    function pauseCountdown() {
        if (countdownInterval) clearInterval(countdownInterval);
        countdownInterval = null;
        if (modalTimerNum) modalTimerNum.innerText = '⏸';
    }

    function finishCountdown() {
        if (countdownInterval) clearInterval(countdownInterval);
        countdownInterval = null;
        nextScanCountdownEl.classList.add('hidden');
        if (kioskCountdownOverlay) kioskCountdownOverlay.classList.add('hidden');
        if (resultModalBackdrop) resultModalBackdrop.classList.add('hidden');
        isCountdownActive = false;
        voteBuffer = [];
        setLiveChip(null);
    }


    // --- Update Statistics UI ---
    function updateStatsUI() {
        totalCountEl.innerText = stats.total;
        recyclableCountEl.innerText = (stats.recyclable || 0) + (stats.plastic_bottle || 0);
        generalCountEl.innerText = stats.general;
        hazardousCountEl.innerText = stats.hazardous || 0;
        if (totalValueCountEl) totalValueCountEl.innerText = (stats.estimatedValue || 0).toFixed(2);
        if (kioskTotalCountEl) kioskTotalCountEl.innerText = stats.total;

        // Eco Impact & Tree Meter Metrics
        const totalEcoRecycled = (stats.plastic_bottle || 0) + (stats.recyclable || 0);
        const co2Saved = stats.co2 || (totalEcoRecycled * 0.16);
        const treesEquivalent = co2Saved / 9.0;
        const energySaved = totalEcoRecycled * 0.45;

        if (co2SavedValEl) co2SavedValEl.innerText = co2Saved.toFixed(2);
        if (treeValEl) treeValEl.innerText = (treesEquivalent > 0 && treesEquivalent < 1)
            ? treesEquivalent.toFixed(2)
            : treesEquivalent.toFixed(1);
        if (energyValEl) energyValEl.innerText = energySaved.toFixed(2);
    }







    // --- Render Scan History Table ---
    function renderHistoryTable() {
        if (scanHistory.length === 0) {
            historyTableBody.innerHTML = `<tr class="empty-row"><td colspan="4">ยังไม่มีประวัติการสแกน</td></tr>`;
            return;
        }

        historyTableBody.innerHTML = scanHistory.map(row => `
            <tr>
                <td>${escapeHtml(row.time)}</td>
                <td><strong>${escapeHtml(row.item)}</strong></td>
                <td><span class="table-badge ${escapeHtml(row.type)}">${escapeHtml(row.bin)}</span></td>
                <td>${escapeHtml(row.confidence)}</td>
            </tr>
        `).join('');
    }

    // --- LocalStorage Logic ---
    function saveStats() {
        try {
            localStorage.setItem('ecoscan_stats', JSON.stringify(stats));
            localStorage.setItem('ecoscan_history', JSON.stringify(scanHistory));
        } catch (e) {
            console.warn('Could not save stats to localStorage:', e);
        }
    }

    function loadSavedStats() {
        try {
            const savedStats = localStorage.getItem('ecoscan_stats');
            const savedHistory = localStorage.getItem('ecoscan_history');
            if (savedStats) stats = JSON.parse(savedStats);
            if (stats.day === undefined) stats.day = todayKey(); // older saves: keep their numbers today
            ensureStatsAreToday();
            if (!stats.plastic_bottle) stats.plastic_bottle = 0;
            if (!stats.hazardous) stats.hazardous = 0;
            if (savedHistory) scanHistory = JSON.parse(savedHistory);

            const savedConf = localStorage.getItem('ecoscan_confidence_v2');
            if (savedConf) {
                const parsedConf = parseFloat(savedConf);
                if (!isNaN(parsedConf)) setConfidenceThreshold(parsedConf);
            } else {
                setConfidenceThreshold(0.65);
            }



            updateStatsUI();
            renderHistoryTable();
        } catch (e) {
            console.error('LocalStorage load error:', e);
        }
    }

    // --- Manual Snapshot Scan Handler (Snap a crisp still frame and analyze) ---
    let isSnapping = false;
    async function triggerManualSnapshot() {
        if (!model || isCountdownActive || isSnapping || document.getElementById('scanConfirm').open) return;

        if (isCameraActive && webcamEl.readyState === 4) {
            isSnapping = true;
            if (shutterScanBtn) shutterScanBtn.classList.add('capturing');
            triggerCameraFlash();
            try {
                // Freeze a sharp still frame onto an offscreen canvas before running AI
                const vw = webcamEl.videoWidth || 640;
                const vh = webcamEl.videoHeight || 480;
                const snapCanvas = document.createElement('canvas');
                snapCanvas.width = vw;
                snapCanvas.height = vh;
                snapCanvas.getContext('2d').drawImage(webcamEl, 0, 0, vw, vh);

                if (liveResultText) liveResultText.innerText = 'กำลังวิเคราะห์ภาพ...';
                const candidate = await analyzeFrame(snapCanvas, true, true);
                submitPrediction(candidate, snapCanvas);
            } catch (e) {
                console.error('Snapshot error:', e);
            } finally {
                isSnapping = false;
                if (shutterScanBtn) shutterScanBtn.classList.remove('capturing');
            }
        } else {
            showCameraFallbackMessage('กรุณาเปิดกล้องก่อนสแกน');
        }
    }

    function submitPrediction(candidate, source) {
        let info = candidate?.info;
        let score = candidate?.score ?? null;
        if (info) updatePredictionUI(info, score);
        const dialog = document.getElementById('scanConfirm');
        const select = document.getElementById('scanConfirmBin');
        const save = dialog.querySelector('button[value="save"]');
        const prediction = document.getElementById('scanConfirmPrediction');
        const ocr = new AbortController();
        let userSelected = false;
        const rememberSelection = () => { userSelected = true; };

        function showBatteryWarning(code) {
            prediction.textContent = code
                ? `พบรหัสถ่าน ${code} กรุณาตรวจชิ้นงานและเลือกถังก่อนบันทึก`
                : 'อาจเป็นถ่านหรือแบตเตอรี่ กรุณาตรวจชิ้นงานและเลือกถังก่อนบันทึก';
            info = null;
            score = null;
            if (!userSelected) select.value = '';
            save.disabled = !select.value;
        }

        prediction.textContent = info
            ? `AI แนะนำ ${info.bin} (${Math.round(score * 100)}%)`
            : 'AI ยังไม่แน่ใจ เลือกถังเองได้ หรือยกเลิกเพื่อสแกนใหม่';
        select.value = info?.type ?? '';
        save.disabled = !select.value;
        if (candidate?.batteryWarning) showBatteryWarning();
        dialog.returnValue = '';
        select.addEventListener('change', rememberSelection);
        dialog.addEventListener('close', () => {
            ocr.abort();
            select.removeEventListener('change', rememberSelection);
            if (dialog.returnValue !== 'save' || !select.value) return;
            const chosen = select.value === info?.type ? info : CORRECTION_INFO[select.value];
            const chosenScore = chosen === info ? score : null;
            updatePredictionUI(chosen, chosenScore);
            commitWasteScan(chosen, chosenScore, { source });
        }, { once: true });
        dialog.showModal();
        if (!window.readBatteryCode) return;
        const timeout = setTimeout(() => ocr.abort(), 8000);
        window.readBatteryCode(source, ocr.signal).then(code => {
            if (code && dialog.open && !ocr.signal.aborted) showBatteryWarning(code);
        }).finally(() => clearTimeout(timeout));
    }

    const scanConfirmBin = document.getElementById('scanConfirmBin');
    scanConfirmBin.addEventListener('change', () => {
        document.querySelector('#scanConfirm button[value="save"]').disabled = !scanConfirmBin.value;
    });

    // --- Sample Test Buttons Click Handler (Event Delegation for Static & Dynamic Custom Buttons) ---
    const sampleObjectsContainer = document.querySelector('.sample-objects-container');
    if (sampleObjectsContainer) {
        sampleObjectsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.sample-btn');
            if (!btn) return;
            const itemKey = btn.getAttribute('data-item');
            if (!itemKey) return;

            const mappedInfo = WASTE_MAPPING[itemKey] || DEFAULT_GENERAL_WASTE;
            updatePredictionUI(mappedInfo, 0.95);
            commitWasteScan(mappedInfo, 0.95);
        });
    }

    // --- CSV Exporter ---

    function exportHistoryCSV() {
        if (scanHistory.length === 0) {
            alert('ยังไม่มีข้อมูลประวัติให้ Export');
            return;
        }

        // Quote every cell and double any quotes inside it so commas/quotes in names don't break columns
        const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const headers = ['Time,Item,Target Bin,Type,Confidence'];
        const csvRows = scanHistory.map(h => [h.time, h.item, h.bin, h.type, h.confidence].map(cell).join(','));
        const blob = new Blob(['\uFEFF' + [headers, ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `nong_ta_wiset_waste_history_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // --- Event Listeners ---
    snapshotBtn.addEventListener('click', triggerManualSnapshot);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            // Let people type spaces in form fields (e.g. product names in the trainer)
            const t = e.target;
            if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(t.tagName))) return;
            e.preventDefault();
            triggerManualSnapshot();
        }
    });

    document.getElementById('kioskScanBtn').addEventListener('click', triggerManualSnapshot);

    toggleCameraBtn.addEventListener('click', async () => {
        try {
            await startWebcam();
            isCameraActive = true;
            cameraLoaderEl.classList.add('hidden');
        } catch (e) {
            alert('ไม่สามารถเปิดกล้องได้: ' + e.message);
        }
    });

    if (toggleDialectBtn) {
        toggleDialectBtn.addEventListener('click', () => {
            if (currentDialect === 'khammuang') {
                currentDialect = 'central';
                dialectLabel.innerText = '🇹🇭 เสียงภาษากลาง';
                toggleDialectBtn.className = 'btn btn-sm btn-outline dialect-btn central';
                if (mascotGreetingText) {
                    mascotGreetingText.innerText = '“สวัสดี! ยื่นขยะมาหน้ากล้อง ให้น้องช่วยบอกถังนะ ♻️”';
                }
                speakThaiText('สลับเป็นเสียงภาษากลาง');
            } else {
                currentDialect = 'khammuang';
                dialectLabel.innerText = '🌺 เสียงคำเมือง';
                toggleDialectBtn.className = 'btn btn-sm btn-outline dialect-btn';
                if (mascotGreetingText) {
                    mascotGreetingText.innerText = '“สวัสดี! ยื่นขยะมาหน้ากล้อง หื้อน้องช่วยบอกถังเน้อ ฮอมบุญตวยกัน ♻️”';
                }
                speakThaiText('สลับเป๋นเสียงคำเมืองล้านนา');
            }
        });
    }

    toggleSoundBtn.addEventListener('click', () => {
        isSoundMuted = !isSoundMuted;
        soundIcon.className = isSoundMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
        toggleSoundBtn.style.opacity = isSoundMuted ? '0.5' : '1';
    });


    resetStatsBtn.addEventListener('click', () => {
        if (!requireAdminPin('รีเซ็ตสถิติและประวัติการสแกน')) return;
        if (confirm('คุณต้องการรีเซ็ตสถิติและประวัติการสแกนทั้งหมดใช่หรือไม่?')) {
            stats = { total: 0, plastic_bottle: 0, recyclable: 0, general: 0, hazardous: 0, co2: 0.0, estimatedValue: 0.0, day: todayKey() };
            scanHistory = [];

            saveStats();
            updateStatsUI();
            renderHistoryTable();
        }
    });

    // --- Kiosk Mode Handlers ---
    // Keep a kiosk screen from sleeping while it's in use
    let wakeLock = null;
    async function keepScreenOn(on) {
        try {
            if (on && 'wakeLock' in navigator && !wakeLock) {
                wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => { wakeLock = null; });
            } else if (!on && wakeLock) {
                await wakeLock.release();
                wakeLock = null;
            }
        } catch (e) { /* not supported or not allowed: fine */ }
    }

    function enterKioskMode() {
        isKioskMode = true;
        kioskOverlay.classList.remove('hidden');
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        }
        keepScreenOn(true);
        if (webcamStream) {
            kioskWebcam.srcObject = webcamStream;
        }
        updateStatsUI();
    }

    function exitKioskMode() {
        isKioskMode = false;
        keepScreenOn(false);
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
        kioskOverlay.classList.add('hidden');
    }

    async function handleCameraSwitch(deviceId) {
        selectedDeviceId = deviceId;
        if (cameraSelectEl) cameraSelectEl.value = deviceId;
        if (kioskCameraSelectEl) kioskCameraSelectEl.value = deviceId;
        try {
            cameraLoaderEl.classList.remove('hidden');
            loaderMessageEl.innerText = 'กำลังสลับไปใช้กล้องที่เลือก...';
            await startWebcam(selectedDeviceId);
            cameraLoaderEl.classList.add('hidden');
        } catch (err) {
            console.error('Camera switch error:', err);
            alert('ไม่สามารถสลับไปยังกล้องที่เลือกได้: ' + err.message);
            cameraLoaderEl.classList.add('hidden');
        }
    }

    if (cameraSelectEl) {
        cameraSelectEl.addEventListener('change', (e) => handleCameraSwitch(e.target.value));
    }

    if (kioskCameraSelectEl) {
        kioskCameraSelectEl.addEventListener('change', (e) => handleCameraSwitch(e.target.value));
    }


    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
        navigator.mediaDevices.addEventListener('devicechange', populateCameraDevices);
    }

    if (toggleKioskBtn) toggleKioskBtn.addEventListener('click', enterKioskMode);
    if (exitKioskBtn) exitKioskBtn.addEventListener('click', exitKioskMode);

    exportCsvBtn.addEventListener('click', exportHistoryCSV);





    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', finishCountdown);
    }

    // --- Confidence Threshold Adjuster & Synchronizer ---
    function setConfidenceThreshold(val) {
        currentConfidenceThreshold = Math.min(Math.max(val, 0.40), 0.85);
        const pct = Math.round(currentConfidenceThreshold * 100);
        if (confidenceVal) confidenceVal.innerText = `${pct}%`;
        if (confidenceSlider) confidenceSlider.value = pct;

        if (kioskConfidenceSelect) {
            const opts = Array.from(kioskConfidenceSelect.options);
            let closest = opts[0];
            let minDiff = 999;
            opts.forEach(opt => {
                const diff = Math.abs(parseFloat(opt.value) - currentConfidenceThreshold);
                if (diff < minDiff) { minDiff = diff; closest = opt; }
            });
            if (minDiff < 0.05) kioskConfidenceSelect.value = closest.value;
        }

        if (confBtns) {
            confBtns.forEach(btn => {
                const bVal = parseFloat(btn.getAttribute('data-conf'));
                btn.classList.toggle('active', Math.abs(bVal - currentConfidenceThreshold) < 0.03);
            });
        }
        localStorage.setItem('ecoscan_confidence_v2', currentConfidenceThreshold.toString());
    }

    if (confidenceSlider) {
        confidenceSlider.addEventListener('input', (e) => {
            setConfidenceThreshold(parseInt(e.target.value, 10) / 100);
        });
    }

    if (kioskConfidenceSelect) {
        kioskConfidenceSelect.addEventListener('change', (e) => {
            setConfidenceThreshold(parseFloat(e.target.value));
        });
    }

    if (confBtns) {
        confBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const val = parseFloat(btn.getAttribute('data-conf'));
                setConfidenceThreshold(val);
            });
        });
    }

    // ==========================================================================
    // Scan feedback
    function loadFeedback() {
        try {
            feedbackStats = JSON.parse(localStorage.getItem('ecoscan_onnx_feedback_stats') || '{"correct":0,"incorrect":0}');
        } catch (e) {
            feedbackStats = { correct: 0, incorrect: 0 };
        }
        updateAccuracyUI();
    }

    function persistFeedback() {
        try {
            localStorage.setItem('ecoscan_onnx_feedback_stats', JSON.stringify(feedbackStats));
        } catch (e) { /* storage unavailable */ }
    }

    function updateAccuracyUI() {
        if (!accuracyPillEl) return;
        const total = feedbackStats.correct + feedbackStats.incorrect;
        if (total === 0) {
            accuracyPillEl.innerText = 'ยังไม่มีผู้ใช้ยืนยันผล';
            return;
        }
        const pct = Math.round((feedbackStats.correct / total) * 100);
        accuracyPillEl.innerText = `ผู้ใช้ยืนยันว่าถูก ${pct}% (${feedbackStats.correct}/${total} ครั้ง)`;
    }

    const feedbackBox = document.getElementById('feedbackBox');
    const feedbackAsk = document.getElementById('feedbackAsk');
    const feedbackBins = document.getElementById('feedbackBins');
    const feedbackThanks = document.getElementById('feedbackThanks');
    const feedbackYesBtn = document.getElementById('feedbackYesBtn');
    const feedbackNoBtn = document.getElementById('feedbackNoBtn');
    const skipCountdownBtn = document.getElementById('skipCountdownBtn');

    function resetFeedbackUI() {
        if (!feedbackBox) return;
        feedbackBox.classList.remove('hidden');
        feedbackAsk.classList.remove('hidden');
        feedbackBins.classList.add('hidden');
        feedbackThanks.classList.add('hidden');
        // Hide the bin the AI already picked, so the choices are only the other bins
        feedbackBins.querySelectorAll('[data-bin]').forEach(b => {
            b.classList.toggle('hidden', !!lastCommit && b.getAttribute('data-bin') === lastCommit.info.type);
        });
    }

    function showFeedbackThanks(text) {
        feedbackAsk.classList.add('hidden');
        feedbackBins.classList.add('hidden');
        feedbackThanks.innerText = text;
        feedbackThanks.classList.remove('hidden');
    }

    if (feedbackYesBtn) {
        feedbackYesBtn.addEventListener('click', () => {
            if (!lastCommit) return;
            feedbackStats.correct += 1;
            persistFeedback();
            updateAccuracyUI();
            showFeedbackThanks('ขอบคุณที่ช่วยยืนยัน 👍');
            lastCommit = null;
            setTimeout(finishCountdown, 700);
        });
    }

    if (feedbackNoBtn) {
        feedbackNoBtn.addEventListener('click', () => {
            if (!lastCommit) return;
            pauseCountdown();
            feedbackAsk.classList.add('hidden');
            feedbackBins.classList.remove('hidden');
        });
    }

    if (feedbackBins) {
        feedbackBins.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-bin]');
            if (!btn || !lastCommit) return;
            const type = btn.getAttribute('data-bin');
            const newInfo = CORRECTION_INFO[type];
            const commit = lastCommit;
            lastCommit = null;

            // Fix today's stats and the history row
            applyStats(commit.info, -1);
            applyStats(newInfo, 1);
            const row = scanHistory.find(h => h.id === commit.historyId);
            if (row) {
                row.item = `✏️ ${row.item}`;
                row.bin = newInfo.bin;
                row.type = type;
            }
            feedbackStats.incorrect += 1;

            persistFeedback();
            saveStats();
            updateStatsUI();
            renderHistoryTable();
            updateAccuracyUI();

            showFeedbackThanks(`แก้เป็น "${newInfo.bin}" ในประวัติเครื่องนี้แล้ว`);
            speakThaiText(`ขอบคุณครับ อันนี้ทิ้ง${newInfo.bin}`);
            setTimeout(finishCountdown, 1600);
        });
    }

    if (skipCountdownBtn) skipCountdownBtn.addEventListener('click', finishCountdown);

    // ==========================================================================
    // Installable app & offline (PWA)
    // ==========================================================================
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        navigator.serviceWorker.register('sw.js').catch(err => console.warn('Service worker not registered:', err));
    }

    const offlineBadge = document.getElementById('offlineBadge');
    function updateOnlineBadge() {
        if (offlineBadge) offlineBadge.classList.toggle('hidden', navigator.onLine);
    }
    window.addEventListener('online', updateOnlineBadge);
    window.addEventListener('offline', updateOnlineBadge);
    updateOnlineBadge();

    const installAppBtn = document.getElementById('installAppBtn');
    let installPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        installPrompt = e;
        if (installAppBtn) installAppBtn.classList.remove('hidden');
    });
    if (installAppBtn) {
        installAppBtn.addEventListener('click', async () => {
            if (!installPrompt) return;
            installPrompt.prompt();
            await installPrompt.userChoice.catch(() => null);
            installPrompt = null;
            installAppBtn.classList.add('hidden');
        });
    }
    window.addEventListener('appinstalled', () => {
        if (installAppBtn) installAppBtn.classList.add('hidden');
    });

    // --- Mobile UX Enhancements (Menu Drawer, 1-Tap Flip Camera, iOS Audio Unlock, Battery Saver & Wake Lock) ---
    const mobileMenuToggleBtn = document.getElementById('mobileMenuToggleBtn');
    const headerControlsEl = document.querySelector('.header-controls');
    if (mobileMenuToggleBtn && headerControlsEl) {
        mobileMenuToggleBtn.addEventListener('click', () => {
            const isOpen = headerControlsEl.classList.toggle('mobile-open');
            mobileMenuToggleBtn.setAttribute('aria-expanded', String(isOpen));
            const icon = mobileMenuToggleBtn.querySelector('i');
            if (icon) icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        });
    }

    const flipCameraBtn = document.getElementById('flipCameraBtn');
    if (flipCameraBtn) {
        flipCameraBtn.addEventListener('click', async () => {
            try {
                flipCameraBtn.classList.add('spinning');
                const devices = (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)
                    ? (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput')
                    : [];
                if (devices.length >= 2 && selectedDeviceId) {
                    const curIdx = devices.findIndex(d => d.deviceId === selectedDeviceId);
                    const nextDevice = devices[(curIdx + 1) % devices.length];
                    await startWebcam(nextDevice.deviceId);
                } else {
                    const nextFacing = currentFacingMode === 'environment' ? 'user' : 'environment';
                    await startWebcam(null, nextFacing);
                }
                isCameraActive = true;
            } catch (err) {
                console.warn('Flip camera warning:', err);
            } finally {
                setTimeout(() => flipCameraBtn.classList.remove('spinning'), 350);
            }
        });
    }

    // Unlock AudioContext & SpeechSynthesis on first click/touchend (iOS Safari ignores touchstart for speech!)
    function unlockAudioOnGesture(e) {
        if (speechUnlocked) return;
        speechUnlocked = true;
        hideAudioUnlockBanner();
        try {
            getAudioContext();
            const target = e && e.target;
            const clickedSpeechControl = target && target.closest && target.closest('.sample-btn, #toggleDialectBtn, #toggleSoundBtn');
            if (!clickedSpeechControl && !isSoundMuted) {
                const msg = pendingSpeechText || (currentDialect === 'khammuang'
                    ? 'สวัสดี น้องตาวิเศษพร้อมฮอมบุญแยกขยะแล้ว'
                    : 'สวัสดี น้องตาวิเศษพร้อมแยกขยะแล้ว');
                pendingSpeechText = '';
                speakThaiText(msg);
            }
        } catch (err) { /* ignore */ }
    }
    if (audioUnlockBanner) {
        audioUnlockBanner.addEventListener('click', (e) => {
            e.stopPropagation();
            unlockAudioOnGesture(e);
        });
    }
    window.addEventListener('click', unlockAudioOnGesture, { once: true });

    // Battery Saver (pause AI when app/tab is in background) + Screen Wake Lock
    let wakeLockSentinel = null;
    async function requestScreenWakeLock() {
        if (!('wakeLock' in navigator) || document.hidden) return;
        try {
            wakeLockSentinel = await navigator.wakeLock.request('screen');
        } catch (e) { /* permission or battery saver denied; safe to ignore */ }
    }
    let wasDetectingBeforeHide = false;
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            wasDetectingBeforeHide = isDetecting;
            isDetecting = false;
            if (wakeLockSentinel) {
                wakeLockSentinel.release().catch(() => {});
                wakeLockSentinel = null;
            }
        } else {
            if (wasDetectingBeforeHide && model) isDetecting = true;
            requestScreenWakeLock();
        }
    });
    requestScreenWakeLock();

    // --- Admin Price Board Editor & Cloud Sync (settings/price_board) ---
    const priceDatePillEl = document.getElementById('priceDatePill');
    const openPriceEditorBtn = document.getElementById('openPriceEditorBtn');
    const priceEditorModalBackdrop = document.getElementById('priceEditorModalBackdrop');
    const closePriceEditorBtn = document.getElementById('closePriceEditorBtn');
    const priceEditorForm = document.getElementById('priceEditorForm');
    const priceDateInput = document.getElementById('priceDateInput');
    const priceEditorFields = document.getElementById('priceEditorFields');
    const resetPriceBoardBtn = document.getElementById('resetPriceBoardBtn');

    const DEFAULT_PRICE_DATE = priceDatePillEl ? priceDatePillEl.innerText.trim() : 'วันที่ 20 พฤศจิกายน 2569';
    const DEFAULT_PRICE_ITEMS = {};
    const PRICE_ITEM_LABELS = {};
    document.querySelectorAll('#priceCategoriesGrid li[data-price-key]').forEach(li => {
        const key = li.getAttribute('data-price-key');
        const labelEl = li.querySelector('span');
        const valEl = li.querySelector('strong');
        if (key && labelEl && valEl) {
            PRICE_ITEM_LABELS[key] = labelEl.innerText.trim();
            DEFAULT_PRICE_ITEMS[key] = valEl.innerText.trim();
        }
    });

    let currentPriceBoard = { dateLabel: DEFAULT_PRICE_DATE, items: { ...DEFAULT_PRICE_ITEMS } };

    function applyPriceBoardToDOM(board) {
        if (!board) return;
        currentPriceBoard = {
            dateLabel: board.dateLabel || DEFAULT_PRICE_DATE,
            items: { ...DEFAULT_PRICE_ITEMS, ...(board.items || {}) }
        };
        if (priceDatePillEl) priceDatePillEl.innerText = currentPriceBoard.dateLabel;
        document.querySelectorAll('#priceCategoriesGrid li[data-price-key]').forEach(li => {
            const key = li.getAttribute('data-price-key');
            const valEl = li.querySelector('strong');
            if (key && valEl && currentPriceBoard.items[key] !== undefined) {
                valEl.innerText = currentPriceBoard.items[key];
            }
        });
    }

    function loadSavedPriceBoard() {
        try {
            const raw = localStorage.getItem('ecoscan_price_board');
            if (raw) applyPriceBoardToDOM(JSON.parse(raw));
        } catch (e) { /* ignore */ }
    }

    function listenToCloudPriceBoard() {
        if (!db) return;
        try {
            db.collection('settings').doc('price_board').onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    applyPriceBoardToDOM(data);
                    try {
                        localStorage.setItem('ecoscan_price_board', JSON.stringify({
                            dateLabel: data.dateLabel,
                            items: data.items
                        }));
                    } catch (e) { /* ignore */ }
                }
            }, err => console.warn('Price board sync warning:', err));
        } catch (e) { /* ignore */ }
    }

    function openPriceEditorModal() {
        if (!priceEditorModalBackdrop || !priceEditorFields) return;
        if (priceDateInput) priceDateInput.value = currentPriceBoard.dateLabel;
        priceEditorFields.innerHTML = Object.keys(PRICE_ITEM_LABELS).map(key => `
            <div class="price-edit-row">
                <label for="pe_${escapeHtml(key)}">${escapeHtml(PRICE_ITEM_LABELS[key])}</label>
                <input type="text" id="pe_${escapeHtml(key)}" data-price-key="${escapeHtml(key)}" class="form-input" value="${escapeHtml(currentPriceBoard.items[key] || '')}" required>
            </div>
        `).join('');
        priceEditorModalBackdrop.classList.remove('hidden');
    }

    function closePriceEditorModal() {
        if (priceEditorModalBackdrop) priceEditorModalBackdrop.classList.add('hidden');
    }

    if (openPriceEditorBtn) {
        openPriceEditorBtn.addEventListener('click', () => {
            if (!requireAdminPin('แก้ไขตารางราคารับซื้อขยะรีไซเคิล')) return;
            openPriceEditorModal();
        });
    }
    if (closePriceEditorBtn) closePriceEditorBtn.addEventListener('click', closePriceEditorModal);
    if (priceEditorModalBackdrop) {
        priceEditorModalBackdrop.addEventListener('click', (e) => {
            if (e.target === priceEditorModalBackdrop) closePriceEditorModal();
        });
    }

    if (priceEditorForm) {
        priceEditorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newDate = (priceDateInput ? priceDateInput.value.trim() : '') || DEFAULT_PRICE_DATE;
            const newItems = {};
            priceEditorFields.querySelectorAll('input[data-price-key]').forEach(inp => {
                newItems[inp.getAttribute('data-price-key')] = inp.value.trim();
            });
            const payload = { dateLabel: newDate, items: newItems };
            applyPriceBoardToDOM(payload);
            try { localStorage.setItem('ecoscan_price_board', JSON.stringify(payload)); } catch (err) { /* ignore */ }
            if (db) {
                try {
                    await db.collection('settings').doc('price_board').set({
                        dateLabel: newDate,
                        items: newItems,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } catch (cloudErr) {
                    console.warn('Cloud price board save warning:', cloudErr);
                }
            }
            closePriceEditorModal();
            alert('บันทึกตารางราคารับซื้อเรียบร้อยและอัปเดตทุกเครื่องแล้ว');
        });
    }

    if (resetPriceBoardBtn) {
        resetPriceBoardBtn.addEventListener('click', () => {
            if (!confirm('คืนค่าราคาทั้งหมดกลับเป็นประกาศเริ่มต้นใช่หรือไม่?')) return;
            if (priceDateInput) priceDateInput.value = DEFAULT_PRICE_DATE;
            priceEditorFields.querySelectorAll('input[data-price-key]').forEach(inp => {
                const k = inp.getAttribute('data-price-key');
                inp.value = DEFAULT_PRICE_ITEMS[k] || '';
            });
        });
    }

    // --- Monthly Executive Report Dashboard & Print/PDF Export ---
    const openReportHeaderBtn = document.getElementById('openReportHeaderBtn');
    const reportModalBackdrop = document.getElementById('reportModalBackdrop');
    const closeReportModalBtn = document.getElementById('closeReportModalBtn');
    const reportMonthPicker = document.getElementById('reportMonthPicker');
    const reportKioskFilter = document.getElementById('reportKioskFilter');
    const refreshReportBtn = document.getElementById('refreshReportBtn');
    const exportMonthlyCsvBtn = document.getElementById('exportMonthlyCsvBtn');
    const printReportBtn = document.getElementById('printReportBtn');
    const reportStatusNote = document.getElementById('reportStatusNote');
    const reportPrintMeta = document.getElementById('reportPrintMeta');
    const repTotalCount = document.getElementById('repTotalCount');
    const repEstValue = document.getElementById('repEstValue');
    const repCo2Saved = document.getElementById('repCo2Saved');
    const repTreesEq = document.getElementById('repTreesEq');
    const reportCategoryBars = document.getElementById('reportCategoryBars');
    const reportBinDifference = document.getElementById('reportBinDifference');
    const reportKioskTableBody = document.getElementById('reportKioskTableBody');
    const reportDailyTableBody = document.getElementById('reportDailyTableBody');

    let cachedMonthlyDocs = []; // { id, day, kiosk, total, plastic_bottle, recyclable, general, hazardous, co2 }
    let lastRenderedDailyRows = [];

    function currentYearMonth() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    function formatThaiMonth(ym) {
        const [y, m] = ym.split('-').map(Number);
        const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        return `${months[(m || 1) - 1] || ''} ${y + 543}`;
    }

    async function fetchMonthlyReportData(ym) {
        if (reportStatusNote) reportStatusNote.innerText = 'กำลังโหลดข้อมูลรายเดือนจาก Cloud Firestore...';
        cachedMonthlyDocs = [];

        if (db) {
            try {
                const startDay = `${ym}-01`;
                const endDay = `${ym}-31`;
                const snap = await db.collection('stats')
                    .where('day', '>=', startDay)
                    .where('day', '<=', endDay)
                    .get();
                snap.forEach(doc => {
                    const d = doc.data() || {};
                    const isPerKiosk = doc.id.includes('__');
                    cachedMonthlyDocs.push({
                        id: doc.id,
                        day: d.day || doc.id.split('__')[0],
                        kiosk: isPerKiosk ? (d.kiosk || doc.id.split('__')[1] || 'ไม่ระบุ') : '__all__',
                        total: Number(d.total) || 0,
                        plastic_bottle: Number(d.plastic_bottle) || 0,
                        recyclable: Number(d.recyclable) || 0,
                        general: Number(d.general) || 0,
                        hazardous: Number(d.hazardous) || 0,
                        co2: Number(d.co2) || 0
                    });
                });
            } catch (err) {
                console.warn('Monthly report Firestore fetch warning:', err);
            }
        }

        // Fallback to local today stats if selected month is current month and cloud returned nothing
        if (cachedMonthlyDocs.length === 0 && ym === currentYearMonth() && stats.total > 0) {
            cachedMonthlyDocs.push({
                id: todayKey(),
                day: todayKey(),
                kiosk: '__all__',
                total: stats.total || 0,
                plastic_bottle: stats.plastic_bottle || 0,
                recyclable: stats.recyclable || 0,
                general: stats.general || 0,
                hazardous: stats.hazardous || 0,
                co2: stats.co2 || 0
            });
            if (reportStatusNote) reportStatusNote.innerText = 'แสดงข้อมูลจากเครื่องนี้ (ยังไม่พบข้อมูลคลาวด์ในเดือนที่เลือก)';
        } else if (reportStatusNote) {
            reportStatusNote.innerText = cachedMonthlyDocs.length > 0
                ? `โหลดข้อมูลเดือน${formatThaiMonth(ym)} สำเร็จ (${cachedMonthlyDocs.length} รายการ)`
                : `ยังไม่มีข้อมูลการสแกนในเดือน${formatThaiMonth(ym)}`;
        }

        // Populate kiosk dropdown
        if (reportKioskFilter) {
            const kiosks = Array.from(new Set(cachedMonthlyDocs.filter(d => d.kiosk !== '__all__').map(d => d.kiosk))).sort();
            const prev = reportKioskFilter.value;
            reportKioskFilter.innerHTML = `<option value="__all__">ทุกตู้รวมกัน</option>` +
                kiosks.map(k => `<option value="${escapeHtml(k)}">ตู้: ${escapeHtml(k)}</option>`).join('');
            if (kiosks.includes(prev)) reportKioskFilter.value = prev;
        }

        renderMonthlyReport();
    }

    function reportDifference(row) {
        return row.total - row.recyclable - row.plastic_bottle - row.general - row.hazardous;
    }

    function renderMonthlyReport() {
        const ym = (reportMonthPicker && reportMonthPicker.value) || currentYearMonth();
        const selectedKiosk = (reportKioskFilter && reportKioskFilter.value) || '__all__';
        const rows = cachedMonthlyDocs
            .filter(d => d.kiosk === selectedKiosk)
            .sort((a, b) => a.day.localeCompare(b.day));

        lastRenderedDailyRows = rows;

        const sum = rows.reduce((acc, r) => {
            acc.total += r.total;
            acc.plastic_bottle += r.plastic_bottle;
            acc.recyclable += r.recyclable;
            acc.general += r.general;
            acc.hazardous += r.hazardous;
            acc.co2 += r.co2;
            return acc;
        }, { total: 0, plastic_bottle: 0, recyclable: 0, general: 0, hazardous: 0, co2: 0 });

        const estValue = sum.plastic_bottle * 0.15 + sum.recyclable * 0.30;
        const trees = sum.co2 / 9.0;

        if (reportPrintMeta) {
            const scopeLabel = selectedKiosk === '__all__' ? 'รวมทุกจุดตั้งตู้' : `จุดตั้งตู้: ${selectedKiosk}`;
            reportPrintMeta.innerText = `ประจำเดือน${formatThaiMonth(ym)} · ${scopeLabel} · พิมพ์เมื่อ ${new Date().toLocaleDateString('th-TH')}`;
        }
        if (repTotalCount) repTotalCount.innerText = sum.total.toLocaleString('th-TH');
        if (repEstValue) repEstValue.innerText = estValue.toFixed(2);
        if (repCo2Saved) repCo2Saved.innerText = sum.co2.toFixed(2);
        if (repTreesEq) repTreesEq.innerText = (trees > 0 && trees < 1) ? trees.toFixed(2) : trees.toFixed(1);

        // Three-bin bars, including bottles recorded by older versions.
        if (reportCategoryBars) {
            const cats = [
                { key: 'recyclable', label: '♻️ ขยะรีไซเคิล', count: sum.recyclable + sum.plastic_bottle, cls: 'recyclable' },
                { key: 'general', label: '🗑️ ขยะทั่วไป', count: sum.general, cls: 'general' },
                { key: 'hazardous', label: '☣️ ขยะอันตราย', count: sum.hazardous, cls: 'hazardous' }
            ];
            const denom = Math.max(sum.total, 1);
            reportCategoryBars.innerHTML = cats.map(c => {
                const pct = Math.round((c.count / denom) * 100);
                return `
                    <div class="report-bar-row">
                        <div class="report-bar-head">
                            <span>${c.label}</span>
                            <strong>${c.count.toLocaleString('th-TH')} ชิ้น (${pct}%)</strong>
                        </div>
                        <div class="report-bar-track">
                            <div class="report-bar-fill ${c.cls}" style="width: ${pct}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        const difference = reportDifference(sum);
        reportBinDifference.hidden = difference === 0;
        if (difference !== 0) {
            const count = Math.abs(difference).toLocaleString('th-TH');
            reportBinDifference.textContent = difference > 0
                ? `ยอดรวมมีอีก ${count} รายการที่ไม่อยู่ใน 3 ถัง เช่น รายการธนบัตรจากระบบเดิม`
                : `ยอดสามถังสูงกว่ายอดรวมที่บันทึกไว้ ${count} รายการ`;
        }

        // Kiosk Comparison Table
        if (reportKioskTableBody) {
            const byKiosk = new Map();
            cachedMonthlyDocs.filter(d => d.kiosk !== '__all__').forEach(d => {
                const cur = byKiosk.get(d.kiosk) || { kiosk: d.kiosk, total: 0, plastic_bottle: 0, recyclable: 0, general: 0, hazardous: 0, co2: 0 };
                cur.total += d.total;
                cur.plastic_bottle += d.plastic_bottle;
                cur.recyclable += d.recyclable;
                cur.general += d.general;
                cur.hazardous += d.hazardous;
                cur.co2 += d.co2;
                byKiosk.set(d.kiosk, cur);
            });
            const kList = Array.from(byKiosk.values()).sort((a, b) => b.total - a.total);
            if (kList.length === 0) {
                reportKioskTableBody.innerHTML = `<tr class="empty-row"><td colspan="7">ยังไม่มีข้อมูลแยกตามชื่อตู้ในเดือนนี้ (ตั้งชื่อตู้ได้ผ่านลิงก์ ?kiosk=ชื่อตู้)</td></tr>`;
            } else {
                reportKioskTableBody.innerHTML = kList.map(k => `
                    <tr>
                        <td><strong>${escapeHtml(k.kiosk)}</strong></td>
                        <td><strong>${k.total}</strong></td>
                        <td>${k.recyclable + k.plastic_bottle}</td>
                        <td>${k.general}</td>
                        <td>${k.hazardous}</td>
                        <td>${reportDifference(k)}</td>
                        <td>${k.co2.toFixed(2)}</td>
                    </tr>
                `).join('');
            }
        }

        // Daily Breakdown Table
        if (reportDailyTableBody) {
            if (rows.length === 0) {
                reportDailyTableBody.innerHTML = `<tr class="empty-row"><td colspan="7">ไม่มีรายการในเดือนที่เลือก</td></tr>`;
            } else {
                reportDailyTableBody.innerHTML = rows.map(r => `
                    <tr>
                        <td>${escapeHtml(r.day)}</td>
                        <td><strong>${r.total}</strong></td>
                        <td>${r.recyclable + r.plastic_bottle}</td>
                        <td>${r.general}</td>
                        <td>${r.hazardous}</td>
                        <td>${reportDifference(r)}</td>
                        <td>${r.co2.toFixed(2)}</td>
                    </tr>
                `).join('');
            }
        }
    }

    function openReportModal() {
        if (!reportModalBackdrop) return;
        if (reportMonthPicker && !reportMonthPicker.value) {
            reportMonthPicker.value = currentYearMonth();
        }
        reportModalBackdrop.classList.remove('hidden');
        fetchMonthlyReportData(reportMonthPicker ? reportMonthPicker.value : currentYearMonth());
    }

    function closeReportModal() {
        if (reportModalBackdrop) reportModalBackdrop.classList.add('hidden');
    }

    if (openReportHeaderBtn) openReportHeaderBtn.addEventListener('click', openReportModal);
    if (closeReportModalBtn) closeReportModalBtn.addEventListener('click', closeReportModal);
    if (reportModalBackdrop) {
        reportModalBackdrop.addEventListener('click', (e) => {
            if (e.target === reportModalBackdrop) closeReportModal();
        });
    }
    if (reportMonthPicker) {
        reportMonthPicker.addEventListener('change', () => fetchMonthlyReportData(reportMonthPicker.value));
    }
    if (reportKioskFilter) {
        reportKioskFilter.addEventListener('change', renderMonthlyReport);
    }
    if (refreshReportBtn) {
        refreshReportBtn.addEventListener('click', () => fetchMonthlyReportData(reportMonthPicker ? reportMonthPicker.value : currentYearMonth()));
    }
    if (printReportBtn) {
        printReportBtn.addEventListener('click', () => window.print());
    }
    if (exportMonthlyCsvBtn) {
        exportMonthlyCsvBtn.addEventListener('click', () => {
            if (lastRenderedDailyRows.length === 0) {
                alert('ไม่มีข้อมูลในเดือนนี้สำหรับส่งออก');
                return;
            }
            const ym = (reportMonthPicker && reportMonthPicker.value) || currentYearMonth();
            const headers = ['Date,Total,Recyclable,General,Hazardous,CO2_kg,Bin_Count_Difference'];
            const lines = lastRenderedDailyRows.map(r =>
                [r.day, r.total, r.plastic_bottle + r.recyclable, r.general, r.hazardous, r.co2.toFixed(2), reportDifference(r)].join(',')
            );
            const blob = new Blob(['\uFEFF' + [headers, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `nongtawiset_report_${ym}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    // --- Cute Confetti, Interactive Pet Mascot & Every-5-Items Celebration ---
    const confettiLayer = document.getElementById('confettiLayer');
    const mascotTapTarget = document.getElementById('mascotTapTarget');
    const milestoneToast = document.getElementById('milestoneCelebrationToast');
    const milestoneTitle = document.getElementById('milestoneTitle');
    const milestoneSub = document.getElementById('milestoneSub');
    let milestoneTimer = null;

    function spawnCuteConfetti(kind = 'eco') {
        if (!confettiLayer) return;
        const palettes = {
            eco: ['✨', '🍃', '🌼', '♻️', '🌿', '💚'],
            money: ['✨', '💵', '⭐', '💛', '✨'],
            celebrate: ['🎊', '🎉', '✨', '🍃', '🌼', '⭐', '💚']
        };
        const icons = palettes[kind] || palettes.eco;
        const count = kind === 'celebrate' ? 28 : 16;

        for (let i = 0; i < count; i++) {
            const el = document.createElement('span');
            el.className = 'confetti-piece';
            el.textContent = icons[Math.floor(Math.random() * icons.length)];
            el.style.left = `${Math.random() * 96 + 2}vw`;
            el.style.fontSize = `${1.05 + Math.random() * 0.8}rem`;
            const dur = 1.6 + Math.random() * 1.1;
            const delay = Math.random() * 0.35;
            el.style.animationDuration = `${dur}s`;
            el.style.animationDelay = `${delay}s`;
            el.style.setProperty('--drift', `${(Math.random() - 0.5) * 140}px`);
            el.style.setProperty('--spin', `${(Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360)}deg`);
            confettiLayer.appendChild(el);
            setTimeout(() => el.remove(), (dur + delay) * 1000 + 150);
        }
    }

    function showMilestoneCelebration(totalCount) {
        if (!milestoneToast) return;
        const isKhammuang = currentDialect === 'khammuang';
        if (milestoneTitle) {
            milestoneTitle.innerText = isKhammuang
                ? `🎊 เย้! ฮอมบุญครบ ${totalCount} ชิ้นแล้วเน้อ!`
                : `🎊 เย้! แยกขยะครบ ${totalCount} ชิ้นแล้ว!`;
        }
        if (milestoneSub) {
            milestoneSub.innerText = isKhammuang
                ? 'สุดยอดนักฮอมบุญ ช่วยโลกและเมืองแม่จันได้จ๊าดนัก ✨'
                : 'สุดยอดนักแยกขยะ ช่วยโลกและชุมชนแม่จันได้เยอะเลย ✨';
        }
        milestoneToast.classList.remove('hidden');
        spawnCuteConfetti('celebrate');
        if (milestoneTimer) clearTimeout(milestoneTimer);
        milestoneTimer = setTimeout(() => milestoneToast.classList.add('hidden'), 4200);
    }

    if (milestoneToast) {
        milestoneToast.addEventListener('click', () => {
            milestoneToast.classList.add('hidden');
            if (milestoneTimer) clearTimeout(milestoneTimer);
        });
    }

    const MASCOT_TIPS_CENTRAL = [
        'รู้ไหม? ขวดน้ำ PET 10 ขวด รีไซเคิลทำเสื้อยืดได้ 1 ตัวเลยนะ! 👕',
        'เทน้ำให้หมดแล้วบีบขวดก่อนทิ้ง ช่วยประหยัดพื้นที่ถังได้ถึง 3 เท่า! 🍾',
        'กระป๋องอลูมิเนียม 1 ใบ รีไซเคิลประหยัดไฟเปิดทีวีได้นาน 3 ชั่วโมง! ⚡',
        'แยกขยะวันละชิ้น โลกยิ้มได้ทุกวัน กองทุนฮอมบุญก็โตขึ้นด้วย! 🌿',
        'ถ่านไฟฉายและหลอดไฟ อย่าทิ้งรวมกับขยะทั่วไปนะ แยกใส่ถังแดงปลอดภัยกว่า! ☣️',
        'เย้! ขอบคุณที่มาช่วยกันดูแลเมืองแม่จันให้สะอาดน่าอยู่! ✨'
    ];
    const MASCOT_TIPS_KHAMMUANG = [
        'ฮู้ก่อ? ขวดน้ำ 10 ขวด เอารีไซเคิลแป๋งเสื้อยืดได้ 1 ตัวเลยเน้อ! 👕',
        'เทน้ำหื้อหมดแล้วบีบขวดก่อนทิ้ง จ่วยลดพื้นที่ถังได้ตั้ง 3 เต้าเน้อ! 🍾',
        'กระป๋องอลูมิเนียม 1 ใบ รีไซเคิลประหยัดไฟเปิดทีวีได้ตั้ง 3 ชั่วโมง! ⚡',
        'แยกขยะวันละชิ้น โลกยิ้มได้กู้วัน กองทุนฮอมบุญก็ใหญ่ขึ้นตวย! 🌿',
        'ถ่านไฟฉายอย่าทิ้งปนขยะทั่วไปเน้อ แยกใส่ถังสีแดงปลอดภัยกว่า! ☣️',
        'ยินดีจ๊าดนัก ที่มาจ่วยกันฮักษาเมืองแม่จันหื้อสะอาดงามตา! ✨'
    ];
    let mascotTipIdx = 0;

    function triggerMascotPet() {
        if (mascotSortingImg) {
            mascotSortingImg.classList.remove('mascot-boing');
            void mascotSortingImg.offsetWidth;
            mascotSortingImg.classList.add('mascot-boing');
        }
        const tips = currentDialect === 'khammuang' ? MASCOT_TIPS_KHAMMUANG : MASCOT_TIPS_CENTRAL;
        const tip = tips[mascotTipIdx % tips.length];
        mascotTipIdx += 1;
        if (mascotGreetingText) mascotGreetingText.innerText = `“${tip}”`;
        spawnCuteConfetti('eco');
        playChime('recyclable');
        speakThaiText(tip.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ''));
    }

    if (mascotTapTarget) {
        mascotTapTarget.addEventListener('click', triggerMascotPet);
        mascotTapTarget.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                triggerMascotPet();
            }
        });
    }

    // --- Start Application ---
    loadSavedPriceBoard();
    updateScanModeUI();
    initApp();
    listenToCloudPriceBoard();

});

