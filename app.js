/* ==========================================================================
   EcoScan AI - Application Engine
   TensorFlow.js COCO-SSD Waste Sorting (4 Bins: Plastic Bottle, Recyclable, Hazardous, General)
   Web Audio & Speech Synthesis
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- Dictionary & Waste Classification Rules (4 Bins) ---
    const WASTE_MAPPING = {
        // Dedicated Plastic Bottle Bin (ถังขวดพลาสติก - PET / HDPE)
        'bottle': { type: 'plastic_bottle', thName: '🍾 ขวดน้ำพลาสติก (PET)', bin: 'ถังขวดพลาสติก', price: 'กก.ละ 6.00 บาท', estValue: 0.30, desc: 'พลาสติก PET ใส (เบอร์ 1) ล้างทำความสะอาด ดึงฉลากออก บีบให้แบนก่อนทิ้งลงถังขวดพลาสติก' },
        'singha_bottle': { type: 'plastic_bottle', thName: '🍾 น้ำดื่มสิงห์ / คริสตัล (PET)', bin: 'ถังขวดพลาสติก', price: 'กก.ละ 6.00 บาท', estValue: 0.30, desc: 'ขวดน้ำดื่ม PET ใส (เบอร์ 1) ล้างทำความสะอาด ดึงฉลากพลาสติกออก และบีบให้แบนก่อนทิ้งลงถังขวดพลาสติก' },
        'oishi_bottle': { type: 'plastic_bottle', thName: '🧃 ชาเขียวโออิชิ / อิชิตัน (PET)', bin: 'ถังขวดพลาสติก', price: 'กก.ละ 6.00 บาท', estValue: 0.25, desc: 'ขวดชาเขียว PET ใส เทน้ำออกให้หมด ล้างน้ำเปล่า บีบให้แบนก่อนทิ้งลงถังขวดพลาสติก' },
        'coke_pepsi_bottle': { type: 'plastic_bottle', thName: '🥤 โค้ก / เป๊ปซี่ / เอส (PET)', bin: 'ถังขวดพลาสติก', price: 'กก.ละ 6.00 บาท', estValue: 0.35, desc: 'ขวดน้ำอัดลมพลาสติก PET ใส ล้างคราบหวานออก บีบให้แบนทิ้งลงถังขวดพลาสติก' },
        'cvitt_yanhee_bottle': { type: 'plastic_bottle', thName: '🍋 ซี-วิตต์ / น้ำยันฮี (PET)', bin: 'ถังขวดพลาสติก', price: 'กก.ละ 6.00 บาท', estValue: 0.25, desc: 'ขวดวิตามินพลาสติก PET ล้างสะอาด ดึงฉลากออก บีบแบนส่งรีไซเคิล' },
        'hdpe_bottle': { type: 'plastic_bottle', thName: '🥛 ขวดน้ำพลาสติกขุ่น (HDPE)', bin: 'ถังขวดพลาสติก', price: 'กก.ละ 7.00 บาท', estValue: 0.35, desc: 'พลาสติก HDPE ขุ่น (เบอร์ 2) เช่น ขวดนม/ขวดน้ำยาล้างจาน ล้างทำความสะอาดทิ้งลงถังขวดพลาสติก' },
        'meiji_milk_bottle': { type: 'plastic_bottle', thName: '🥛 นมพาสเจอร์ไรส์เมจิ / โฟร์โมสต์ (HDPE)', bin: 'ถังขวดพลาสติก', price: 'กก.ละ 7.00 บาท', estValue: 0.40, desc: 'ขวดนมพลาสติก HDPE สีขาวขุ่น ล้างคราบนมให้สะอาดหมดจดเพื่อป้องกันกลิ่นบูด แล้วทิ้งลงถังขวดพลาสติก' },
        'sunlight_bottle': { type: 'plastic_bottle', thName: '🧴 ซันไลต์ / บรีสเอกเซล (HDPE)', bin: 'ถังขวดพลาสติก', price: 'กก.ละ 7.00 บาท', estValue: 0.50, desc: 'ขวดน้ำยาล้างจาน/น้ำยาซักผ้า HDPE ล้างคราบฟองน้ำยาออกให้หมดก่อนทิ้งถังขวดพลาสติก' },
        'betagen_bottle': { type: 'plastic_bottle', thName: '🍼 นมเปรี้ยวบีทาเก้น (HDPE)', bin: 'ถังขวดพลาสติก', price: 'กก.ละ 7.00 บาท', estValue: 0.15, desc: 'ขวดนมเปรี้ยวพลาสติก HDPE ล้างคราบนมเปรี้ยวออกให้เกลี้ยงก่อนทิ้งลงถังขวดพลาสติก' },

        // Recyclable Items & Thai Products (ขยะรีไซเคิล - แก้ว, โลหะ, UHT, กระดาษ, พลาสติกสะอาด)
        'pp_pe_ps': { type: 'recyclable', thName: '🥣 พลาสติก PP, PE, PS', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3.00 บาท', estValue: 0.15, desc: 'พลาสติก PP/PE/PS (เบอร์ 5 และ 6) กล่องอาหารพลาสติก ล้างคราบอาหารก่อนส่งรีไซเคิล' },
        'ldpe_bag': { type: 'recyclable', thName: '🛍️ ถุงพลาสติก 7-11 สะอาด (LDPE)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 2.00 บาท', estValue: 0.05, desc: 'พลาสติก LDPE นิ่มยืดได้ (เบอร์ 4) เช่น ถุงหิ้วร้านสะดวกซื้อที่สะอาด รวบรวมส่งรีไซเคิล' },
        'clean_7eleven_bag': { type: 'recyclable', thName: '🛍️ ถุงพลาสติก 7-Eleven สะอาด (LDPE)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 2.00 บาท', estValue: 0.05, desc: 'ถุงพลาสติกหูหิ้วสะอาด ปราศจากคราบอาหาร รวบรวมมัดส่งโรงงานรีไซเคิลเม็ดพลาสติก' },
        'seven_eleven_bento': { type: 'recyclable', thName: '🍱 กล่องข้าว 7-11 / Ezygo (PP)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3.00 บาท', estValue: 0.20, desc: 'กล่องอาหารพลาสติก PP ขาวใส ล้างคราบมันและเศษข้าวออกให้สะอาด สามารถรีไซเคิลได้' },
        'm150_bottle': { type: 'recyclable', thName: '⚡ เอ็ม-150 / คาราบาวแดง (ขวดแก้ว)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 0.80 บาท', estValue: 0.50, desc: 'ขวดแก้วเครื่องดื่มชูกำลังสีชา ล้างน้ำเปล่า คัดแยกส่งโรงงานหลอมแก้วรีไซเคิล' },
        'chang_singha_beer_bottle': { type: 'recyclable', thName: '🍺 เบียร์ช้าง / สิงห์ / ลีโอ (ขวดแก้ว)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 0.80 บาท', estValue: 0.70, desc: 'ขวดแก้วเบียร์ เทน้ำออกให้หมด ล้างน้ำ คัดแยกส่งโรงงานหลอมแก้วใหม่' },
        'wine glass': { type: 'recyclable', thName: '🍷 ขวดแก้ว / แก้วน้ำ', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 0.80 บาท', estValue: 0.40, desc: 'ขวดแก้วเครื่องดื่ม คัดแยกออกจากขยะอื่นๆ เพื่อนำไปหลอมใหม่' },
        'lactasoy_carton': { type: 'recyclable', thName: '🥛 นมแลคตาซอย / ไวตามิลค์ (UHT)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 2.00 บาท', estValue: 0.10, desc: 'กล่องเครื่องดื่ม UHT พับให้แบน แกะหลอดออก ตัด-ล้าง-ตากแห้ง ส่งโครงการรีไซเคิลกล่องเครื่องดื่ม' },
        'thai_denmark_milk': { type: 'recyclable', thName: '🐄 นมวัวแดง ไทย-เดนมาร์ค (UHT)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 2.00 บาท', estValue: 0.10, desc: 'กล่องนม UHT ไทย-เดนมาร์ค แกะหลอด พับแบน ล้างสะอาดส่งรีไซเคิลทำแผ่นบอร์ดรักษ์โลก' },
        'birdy_can': { type: 'recyclable', thName: '☕ กาแฟเบอร์ดี้ / เนสกาแฟ (กระป๋อง)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 60.00 บาท (อลูมิเนียม)', estValue: 0.80, desc: 'กระป๋องกาแฟอลูมิเนียม/เหล็ก เทน้ำออกให้หมด เหยียบแบนส่งรีไซเคิลหลอมได้ 100%' },
        'sammaekrua_canned_fish': { type: 'recyclable', thName: '🐟 ปลากระป๋องสามแม่ครัว / โรซ่า (กระป๋องเหล็ก)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 7.00 บาท', estValue: 0.50, desc: 'กระป๋องเหล็ก/ดีบุก ล้างคราบซอสมะเขือเทศและน้ำมันออกให้สะอาด ป้องกันกลิ่นบูด' },
        'thai_post_box': { type: 'recyclable', thName: '📦 กล่องพัสดุไปรษณีย์ไทย / Flash', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3.00 บาท', estValue: 0.45, desc: 'กล่องกระดาษลูกฟูก แกะเทปกาวและสติกเกอร์ใบปะหน้าออก พับให้แบนเพื่อรีไซเคิล' },
        'box': { type: 'recyclable', thName: '📦 กล่องพัสดุกระดาษ / กล่องลังลูกฟูก', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3.00 บาท', estValue: 0.45, desc: 'กระดาษกล่องลังสีน้ำตาล พับกล่องให้แบนเพื่อประหยัดพื้นที่' },
        'cup': { type: 'recyclable', thName: '🥤 แก้วพลาสติก (PET/PP)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3.00 - 6.00 บาท', estValue: 0.20, desc: 'แก้วพลาสติก PET หรือ PP เทน้ำออกให้หมด ล้างคราบเครื่องดื่มก่อนทิ้ง' },
        'bowl': { type: 'recyclable', thName: '🥣 ชามพลาสติก (PP/PS)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3.00 บาท', estValue: 0.15, desc: 'ชามพลาสติก PP/PS ล้างคราบอาหารให้สะอาดก่อนนำไปส่งรีไซเคิล' },
        'book': { type: 'recyclable', thName: '📚 หนังสือ / กระดาษขาวดำ A4', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 2.00 - 5.00 บาท', estValue: 0.50, desc: 'กระดาษขาวดำ/สมุด/หนังสือ มัดรวมกันให้เรียบร้อยส่งรีไซเคิล' },
        'fork': { type: 'recyclable', thName: '🍴 ช้อนส้อมพลาสติก (PP/PS)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3.00 บาท', estValue: 0.05, desc: 'พลาสติก PP/PS ล้างคราบอาหารออกก่อนทิ้งถังรีไซเคิล' },
        'spoon': { type: 'recyclable', thName: '🥄 ช้อนพลาสติก (PP/PS)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 3.00 บาท', estValue: 0.05, desc: 'พลาสติก PP/PS ล้างคราบอาหารก่อนนำไปคัดแยก' },
        'backpack': { type: 'recyclable', thName: '🎒 กระเป๋า / ผ้า', bin: 'ขยะรีไซเคิล', price: 'ตามสภาพชิ้นงาน', estValue: 1.00, desc: 'ส่งต่อบริจาคหรือนำเข้ากระบวนการรีไซเคิลสิ่งทอ' },
        'umbrella': { type: 'recyclable', thName: '☂️ ร่ม (โลหะ/พลาสติก)', bin: 'ขยะรีไซเคิล', price: 'กก.ละ 7.00 บาท (โลหะ)', estValue: 0.70, desc: 'แยกชิ้นส่วนโลหะและพลาสติกก่อนส่งรีไซเคิล' },

        // Hazardous Waste Items (ขยะอันตราย - สีแดง)
        'panasonic_battery': { type: 'hazardous', thName: '🔋 ถ่านไฟฉาย Panasonic / อัลคาไลน์', bin: 'ขยะอันตราย', price: 'ชิ้นละ 0.50 บาท', estValue: 0.00, desc: 'มีสารแคดเมียม ปรอท และสารเคมีพิษ ห้ามทิ้งปนกับขยะทั่วไป ต้องทิ้งลงถังขยะอันตรายสีแดงเท่านั้น' },
        'baygon_spray_can': { type: 'hazardous', thName: '💨 สเปรย์ไบกอน / ยาฆ่าแมลง', bin: 'ขยะอันตราย', price: 'กก.ละ 1.00 บาท', estValue: 0.00, desc: 'กระป๋องสเปรย์แรงดันสูงและมีสารเคมีอันตราย ห้ามเจาะรูหรือเผาไฟ ทิ้งลงถังขยะอันตราย' },
        'cell phone': { type: 'hazardous', thName: '📱 มือถือเก่า / พาวเวอร์แบงก์ E-Waste', bin: 'ขยะอันตราย', price: 'เครื่องละ 20.00 - 50.00 บาท', estValue: 30.00, desc: 'ขยะอิเล็กทรอนิกส์ มีแบตเตอรี่ลิเธียมไอออนและโลหะหนัก ต้องทิ้งในถังขยะอันตรายหรือจุดรับ E-Waste' },
        'razor_sharp_blade': { type: 'hazardous', thName: '🪒 ใบมีดโกน / คัตเตอร์ / ของมีคม', bin: 'ขยะอันตราย', price: 'กก.ละ 7.00 บาท (เหล็ก)', estValue: 0.00, desc: 'ของมีคมเสี่ยงอันตรายต่อเจ้าหน้าที่เก็บขยะ ควรห่อกระดาษหนาหรือใส่ขวดพลาสติกก่อนทิ้งถังขยะอันตราย' },
        'laptop': { type: 'hazardous', thName: '💻 คอมพิวเตอร์ / จอภาพ E-Waste', bin: 'ขยะอันตราย', price: 'เครื่องละ 20.00 บาท', estValue: 20.00, desc: 'ขยะอิเล็กทรอนิกส์มีส่วนประกอบสารเคมีอันตราย ควรทิ้งถังขยะอันตราย' },
        'remote': { type: 'hazardous', thName: '🔋 รีโมท / อุปกรณ์มีถ่าน', bin: 'ขยะอันตราย', price: 'ตามประเภท E-Waste', estValue: 2.00, desc: 'ถอดถ่านออก และแยกทิ้งตัวอุปกรณ์ในถังขยะอันตราย' },
        'scissors': { type: 'hazardous', thName: '✂️ กรรไกร / ของมีคม', bin: 'ขยะอันตราย', price: 'กก.ละ 7.00 บาท (เหล็ก)', estValue: 0.70, desc: 'ของมีคมอันตราย ควรห่อหุ้มปลายแหลมให้ปลอดภัยก่อนทิ้งถังขยะอันตราย' },
        'knife': { type: 'hazardous', thName: '🔪 มีด / ของมีคม', bin: 'ขยะอันตราย', price: 'กก.ละ 7.00 บาท (เหล็ก)', estValue: 0.70, desc: 'ห่อกระดาษหนาและแยกทิ้งในถังขยะอันตรายเพื่อป้องกันอันตราย' },
        'keyboard': { type: 'hazardous', thName: '⌨️ คีย์บอร์ด / E-Waste', bin: 'ขยะอันตราย', price: 'ชิ้นละ 5.00 บาท', estValue: 5.00, desc: 'อุปกรณ์วงจรอิเล็กทรอนิกส์ชำรุด ทิ้งถังขยะอันตราย' },
        'mouse': { type: 'hazardous', thName: '🖱️ เมาส์ / E-Waste', bin: 'ขยะอันตราย', price: 'ชิ้นละ 3.00 บาท', estValue: 3.00, desc: 'ขยะอิเล็กทรอนิกส์ คัดแยกทิ้งถังขยะอันตราย' },
        'hair drier': { type: 'hazardous', thName: '🔌 ไดร์เป่าผม / เครื่องใช้ไฟฟ้า', bin: 'ขยะอันตราย', price: 'กก.ละ 1.00 บาท (ไฟเบอร์)', estValue: 2.00, desc: 'เครื่องใช้ไฟฟ้าชำรุดจัดเป็นขยะอันตราย' },

        // Money & Banknotes (เงิน / ธนบัตร - เตือนพิเศษไม่ควรทิ้ง)
        'banknote': { type: 'money', thName: '💵 ธนบัตร (เงินบาทไทย)', bin: '⚠️ ไม่ควรทิ้ง!', price: '⚠️ เงินสด ไม่ควรทิ้ง!', desc: 'นี่คือ เงิน ไม่ควรทิ้ง! กรุณาเก็บไว้ในกระเป๋าสตางค์ หรือนำมาร่วมบุญ' },
        'money': { type: 'money', thName: '💵 ธนบัตร / เงิน', bin: '⚠️ ไม่ควรทิ้ง!', price: '⚠️ เงินสด ไม่ควรทิ้ง!', desc: 'นี่คือ เงิน ไม่ควรทิ้ง! กรุณาเก็บไว้ในกระเป๋าสตางค์' },
        'cash': { type: 'money', thName: '💵 ธนบัตร / เงินสด', bin: '⚠️ ไม่ควรทิ้ง!', price: '⚠️ เงินสด ไม่ควรทิ้ง!', desc: 'นี่คือ เงิน ไม่ควรทิ้ง! กรุณาเก็บไว้ในกระเป๋าสตางค์' },

        // Thai General Waste Items (ขยะทั่วไป - ซองฟอยล์, ปนเปื้อนคราบมัน, เปลือกผลไม้)
        'mama_noodle': { type: 'general', thName: '🍜 ซองมาม่าต้มยำกุ้ง / ไวไว', bin: 'ขยะทั่วไป', price: 'ไม่สามารถรับซื้อรีไซเคิลได้', desc: 'ซองพลาสติกลามิเนตเคลือบฟอยล์ปนเปื้อนคราบน้ำมันและเครื่องปรุง ทิ้งในถังขยะทั่วไป' },
        'mama_cup': { type: 'general', thName: '🥣 ถ้วยมาม่าคัพ (ปนเปื้อนซุป)', bin: 'ขยะทั่วไป', price: 'ไม่สามารถรับซื้อรีไซเคิลได้', desc: 'ถ้วยบะหมี่กึ่งสำเร็จรูปปนเปื้อนน้ำมันและคราบเครื่องปรุง ไม่สามารถนำไปรีไซเคิลได้ ทิ้งถังขยะทั่วไป' },
        'lays_bag': { type: 'general', thName: '🥔 ซองมันฝรั่งเลย์ / ตะวัน', bin: 'ขยะทั่วไป', price: 'ไม่สามารถรับซื้อรีไซเคิลได้', desc: 'ซองขนมฟอยล์ลามิเนตหลายชั้นประกบกัน ไม่สามารถเข้ากระบวนการรีไซเคิลปกติได้ ทิ้งในถังขยะทั่วไป' },
        'amazon_cup': { type: 'general', thName: '🥤 แก้ว Cafe Amazon / All Café (เปื้อน)', bin: 'ขยะทั่วไป', price: 'ไม่สามารถรับซื้อรีไซเคิลได้', desc: 'แก้วพลาสติกที่ปนเปื้อนคราบกาแฟ/น้ำตาล หากไม่ได้ล้างทำความสะอาด ให้ทิ้งถังขยะทั่วไป' },
        'oily_curry_bag': { type: 'general', thName: '🍛 ถุงแกงเปื้อนคราบน้ำมัน', bin: 'ขยะทั่วไป', price: 'ไม่สามารถรับซื้อรีไซเคิลได้', desc: 'ถุงแกงและถุงน้ำจิ้มที่เปื้อนคราบไขมันสัตว์ ไม่สามารถนำไปรีไซเคิลได้ ทิ้งในถังขยะทั่วไป' },
        'banana': { type: 'general', thName: '🍌 เปลือกกล้วย / เปลือกผลไม้ไทย', bin: 'ขยะทั่วไป', desc: 'ขยะอินทรีย์ย่อยสลายได้ตามธรรมชาติ ทิ้งลงถังขยะทั่วไป หรือนำไปหมักทำปุ๋ยชีวภาพ' },
        'orange': { type: 'general', thName: '🍊 เปลือกส้ม / เศษอาหาร', bin: 'ขยะทั่วไป', desc: 'นำไปทำปุ๋ยอินทรีย์หรือทิ้งถังขยะทั่วไป' },
        'broccoli': { type: 'general', thName: '🥦 เศษผัก / บรอกโคลี', bin: 'ขยะทั่วไป', desc: 'ขยะย่อยสลายได้ตามธรรมชาติ ทิ้งถังขยะทั่วไป' },
        'carrot': { type: 'general', thName: '🥕 เศษผัก / แครอท', bin: 'ขยะทั่วไป', desc: 'ทิ้งถังขยะทั่วไปหรือถังปุ๋ยหมัก' },
        'hot dog': { type: 'general', thName: '🌭 เศษอาหาร', bin: 'ขยะทั่วไป', desc: 'เศษอาหาร ทิ้งถังขยะทั่วไป' },
        'pizza': { type: 'general', thName: '🍕 เศษอาหาร / เศษพิซซ่า', bin: 'ขยะทั่วไป', desc: 'เศษอาหารเปื้อนคราบมัน ทิ้งถังขยะทั่วไป' },
        'donut': { type: 'general', thName: '🍩 เศษขนม / ขนมปัง', bin: 'ขยะทั่วไป', desc: 'เศษขนม ย่อยสลายได้ ทิ้งถังขยะทั่วไป' },
        'cake': { type: 'general', thName: '🍰 เศษเค้ก / อาหาร', bin: 'ขยะทั่วไป', desc: 'เศษอาหาร ทิ้งถังขยะทั่วไป' },
        'potted plant': { type: 'general', thName: '🪴 ต้นไม้ / ดิน', bin: 'ขยะทั่วไป', desc: 'เศษใบไม้และดินควรทิ้งในสวนหรือถังขยะทั่วไป' },

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
    let currentConfidenceThreshold = 0.58; // 58% optimal confidence threshold for high accuracy
    // Escape text before putting it into innerHTML (names and history can come from the shared cloud database)
    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[ch]);
    }

    const IGNORED_CLASSES = ['person', 'dog', 'cat', 'bird', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe'];


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

                if (firebaseStatusTextEl) firebaseStatusTextEl.innerText = 'waste-5b576 (Connected)';
                if (firebaseStatusEl) firebaseStatusEl.classList.add('online');

                listenToCloudHistory();
            } catch (err) {
                console.warn('Firebase init warning:', err);
                if (firebaseStatusTextEl) firebaseStatusTextEl.innerText = 'waste-5b576 (Offline)';
            }
        } else {
            if (firebaseStatusTextEl) firebaseStatusTextEl.innerText = 'waste-5b576 (Local)';
        }
    }

    function saveScanToCloud(historyItem, info) {
        if (!db) return;
        try {
            db.collection('scans').add({
                item: historyItem.item,
                bin: historyItem.bin,
                type: historyItem.type,
                confidence: historyItem.confidence,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                timeString: historyItem.time
            });

            // Update cloud aggregate stats doc
            const statsRef = db.collection('stats').doc('today');
            statsRef.set({
                total: firebase.firestore.FieldValue.increment(1),
                plastic_bottle: firebase.firestore.FieldValue.increment(info.type === 'plastic_bottle' ? 1 : 0),
                recyclable: firebase.firestore.FieldValue.increment(info.type === 'recyclable' ? 1 : 0),
                general: firebase.firestore.FieldValue.increment(info.type === 'general' ? 1 : 0),
                hazardous: firebase.firestore.FieldValue.increment(info.type === 'hazardous' ? 1 : 0),
                co2: firebase.firestore.FieldValue.increment(
                    info.type === 'plastic_bottle' ? 0.18 : (info.type === 'recyclable' ? 0.15 : 0)
                ),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
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
    let currentStableClass = null;
    let stableStartTime = 0;
    let lastAutoCommitTime = 0;
    let isCountdownActive = false;
    let countdownInterval = null;
    const STABILITY_THRESHOLD_MS = 1000; // Hold steady for 1.0s

    const AUTO_COMMIT_COOLDOWN_MS = 3000; // 3s cooldown between auto-commits
    const DETECT_INTERVAL_MS = 120; // Run the AI at most ~8 times/sec so the video stays smooth
    const BOX_HOLD_MS = 600; // Keep the last boxes on screen briefly when a frame misses, to stop blinking
    let lastDetectTime = 0;
    let lastValidDetectionTime = 0;
    let lastPredictionUIKey = '';

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
    let currentDialect = 'khammuang'; // 'khammuang' (คำเมืองล้านนา) or 'central' (ภาษากลาง)

    // --- DOM Element References ---
    const webcamEl = document.getElementById('webcam');
    const canvasEl = document.getElementById('detectionCanvas');
    const ctx = canvasEl.getContext('2d');
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
    const uploadBtn = document.getElementById('uploadBtn');
    const imageUploadEl = document.getElementById('imageUpload');
    const resetStatsBtn = document.getElementById('resetStatsBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

    // AI Trainer Studio DOM Elements & State
    const openTrainerHeaderBtn = document.getElementById('openTrainerHeaderBtn');
    const openTrainerBtn = document.getElementById('openTrainerBtn');
    const trainerModalBackdrop = document.getElementById('trainerModalBackdrop');
    const closeTrainerModalBtn = document.getElementById('closeTrainerModalBtn');
    const trainerForm = document.getElementById('trainerForm');
    const trainProductName = document.getElementById('trainProductName');
    const trainProductBin = document.getElementById('trainProductBin');
    const trainProductShape = document.getElementById('trainProductShape');
    const trainProductPrice = document.getElementById('trainProductPrice');
    const trainProductEstValue = document.getElementById('trainProductEstValue');
    const trainProductAdvice = document.getElementById('trainProductAdvice');
    const trainerSnapBtn = document.getElementById('trainerSnapBtn');
    const trainerImageUpload = document.getElementById('trainerImageUpload');
    const trainerUploadBtn = document.getElementById('trainerUploadBtn');
    const trainerPreviewImg = document.getElementById('trainerPreviewImg');
    const trainerPreviewPlaceholder = document.getElementById('trainerPreviewPlaceholder');
    const resetTrainerFormBtn = document.getElementById('resetTrainerFormBtn');
    const trainerProductsContainer = document.getElementById('trainerProductsContainer');
    const trainerTotalCount = document.getElementById('trainerTotalCount');
    const clearAllCustomBtn = document.getElementById('clearAllCustomBtn');
    const customTrainedSection = document.getElementById('customTrainedSection');
    const customTrainedButtons = document.getElementById('customTrainedButtons');
    const customProductCountBadge = document.getElementById('customProductCountBadge');

    let customThaiProducts = [];
    let currentTrainerImage = null;

    // UI Prediction Card Elements
    const confidencePill = document.getElementById('confidencePill');
    const binResultBadge = document.getElementById('binResultBadge');
    const binIcon = document.getElementById('binIcon');
    const detectedObjectText = document.getElementById('detectedObjectText');
    const binTitleText = document.getElementById('binTitleText');
    const binDescriptionText = document.getElementById('binDescriptionText');
    const itemPricePill = document.getElementById('itemPricePill');
    const itemPriceText = document.getElementById('itemPriceText');
    const holdProgressBar = document.getElementById('holdProgressBar');
    const nextScanCountdownEl = document.getElementById('nextScanCountdown');
    const countdownNumberEl = document.getElementById('countdownNumber');

    // Kiosk Mode DOM Elements
    const toggleKioskBtn = document.getElementById('toggleKioskBtn');
    const exitKioskBtn = document.getElementById('exitKioskBtn');
    const kioskOverlay = document.getElementById('kioskOverlay');
    const kioskWebcam = document.getElementById('kioskWebcam');
    const kioskCanvas = document.getElementById('kioskCanvas');
    const kioskCtx = kioskCanvas ? kioskCanvas.getContext('2d') : null;
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
    const plasticBottleCountEl = document.getElementById('plasticBottleCount');
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

    function speakThaiText(text) {
        if (isSoundMuted || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'th-TH';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error('Speech synthesis error:', e);
        }
    }



    // --- Initialization & Model Loading ---
    async function initApp() {
        loadSavedStats();
        initFirebase();
        loadCustomProducts();

        // 1. Try starting webcam
        try {
            loaderMessageEl.innerText = 'กำลังขออนุญาตเปิดกล้องและเชื่อมต่อ...';
            await startWebcam();
            isCameraActive = true;
        } catch (camErr) {
            console.warn('Webcam warning:', camErr);
            showCameraFallbackMessage('ไม่พบกล้องหรือยังไม่อนุญาตการใช้กล้อง — สามารถใช้ปุ่มตัวอย่างสิ่งของหรืออัปโหลดรูปภาพทดสอบแทนได้');
        }

        // 2. Load COCO-SSD Model (High-Accuracy MobileNet V2 with Lite Fallback)
        try {
            loaderMessageEl.innerText = 'กำลังดาวน์โหลดโมเดล AI คุณภาพสูง (COCO-SSD MobileNet V2)...';
            try {
                model = await cocoSsd.load({ base: 'mobilenet_v2' });
            } catch (v2Err) {
                console.warn('Fallback to lite_mobilenet_v2:', v2Err);
                model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
            }
            
            aiStatusTextEl.innerText = 'AI พร้อมทำงาน (แม่นยำสูง)';
            aiStatusEl.classList.add('ready');

            cameraLoaderEl.classList.add('hidden');
            isDetecting = true;
            requestAnimationFrame(detectLoop);

        } catch (modelErr) {
            console.error('Model load error:', modelErr);
            loaderMessageEl.innerHTML = `<span style="color: #ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> ไม่สามารถโหลดโมเดล AI ได้</span><br><small>กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองเปิดใหม่อีกครั้ง</small>`;
            aiStatusTextEl.innerText = 'ข้อผิดพลาด AI';
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
    async function startWebcam(deviceId = null) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('เบราว์เซอร์ไม่รองรับกล้อง Webcam หรือไม่ได้รันบนเซิร์ฟเวอร์ย่อย');
        }

        // Stop previous camera tracks if active
        if (webcamStream) {
            webcamStream.getTracks().forEach(track => track.stop());
        }

        const targetId = deviceId || selectedDeviceId;

        const videoConstraints = targetId
            ? { deviceId: { exact: targetId }, width: { ideal: 640 }, height: { ideal: 480 } }
            : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'environment' };

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
                canvasEl.width = webcamEl.videoWidth || 640;
                canvasEl.height = webcamEl.videoHeight || 480;
                if (kioskCanvas) {
                    kioskCanvas.width = canvasEl.width;
                    kioskCanvas.height = canvasEl.height;
                }
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

    // --- Real-time Detection Loop ---
    async function detectLoop() {
        if (!isDetecting || !model) {
            requestAnimationFrame(detectLoop);
            return;
        }

        const now = performance.now();
        if (isCameraActive && webcamEl.readyState === 4 && now - lastDetectTime >= DETECT_INTERVAL_MS) {
            lastDetectTime = now;
            try {
                syncCanvasSize();
                const predictions = await model.detect(webcamEl);
                renderStableBoxes(predictions);
                processPredictions(predictions);
            } catch (e) {
                console.error('Detection loop error:', e);
            }
        }

        requestAnimationFrame(detectLoop);
    }

    // Resize canvases only when the video size really changes (setting width always clears the canvas)
    function syncCanvasSize() {
        const w = webcamEl.videoWidth;
        const h = webcamEl.videoHeight;
        if (!w || !h) return;
        if (canvasEl.width !== w || canvasEl.height !== h) {
            canvasEl.width = w;
            canvasEl.height = h;
        }
        if (kioskCanvas && (kioskCanvas.width !== w || kioskCanvas.height !== h)) {
            kioskCanvas.width = w;
            kioskCanvas.height = h;
        }
    }

    function isValidBox(p) {
        return p.score >= currentConfidenceThreshold && !IGNORED_CLASSES.includes(p.class.toLowerCase());
    }

    // Keep the previous boxes for a short moment when the AI misses a frame, so boxes don't blink on and off
    function renderStableBoxes(predictions) {
        const now = performance.now();
        if (predictions.some(isValidBox)) {
            lastValidDetectionTime = now;
            drawBoundingBoxes(predictions);
        } else if (now - lastValidDetectionTime > BOX_HOLD_MS) {
            drawBoundingBoxes([]);
        }
        // Otherwise leave the last boxes on screen
    }

    // --- Bounding Box Canvas Renderer ---
    function drawBoundingBoxes(predictions) {
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        if (isKioskMode && kioskCtx) {
            kioskCtx.clearRect(0, 0, kioskCanvas.width, kioskCanvas.height);
        }

        predictions.forEach(prediction => {
            if (prediction.score < currentConfidenceThreshold) return;
            if (IGNORED_CLASSES.includes(prediction.class.toLowerCase())) return;


            const [x, y, width, height] = prediction.bbox;
            const itemKey = prediction.class.toLowerCase();
            const matchingCustoms = customThaiProducts.filter(p => p.shape === itemKey);
            const mappedInfo = matchingCustoms.length > 0 ? {
                type: matchingCustoms[0].bin,
                thName: `⭐ ${matchingCustoms[0].name}`
            } : (WASTE_MAPPING[itemKey] || DEFAULT_GENERAL_WASTE);

            let boxColor = '#0ea5e9'; // general (cyan)
            if (mappedInfo.type === 'plastic_bottle') {
                boxColor = '#0d9488'; // teal
            } else if (mappedInfo.type === 'recyclable') {
                boxColor = '#10b981'; // green
            } else if (mappedInfo.type === 'hazardous') {
                boxColor = '#f43f5e'; // red
            } else if (mappedInfo.type === 'money') {
                boxColor = '#d97706'; // gold amber
            }


            // Draw bounding box on main canvas
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            const labelText = `${mappedInfo.thName} (${Math.round(prediction.score * 100)}%)`;
            ctx.font = '14px Sarabun, sans-serif';
            const textWidth = ctx.measureText(labelText).width;

            ctx.fillStyle = boxColor;
            ctx.fillRect(x, y > 22 ? y - 24 : y, textWidth + 12, 24);

            ctx.fillStyle = '#ffffff';
            ctx.fillText(labelText, x + 6, y > 22 ? y - 7 : y + 17);

            // Draw bounding box on Kiosk Canvas if active
            if (isKioskMode && kioskCtx && kioskCanvas.width > 0) {
                const scaleX = kioskCanvas.width / canvasEl.width;
                const scaleY = kioskCanvas.height / canvasEl.height;

                const kX = x * scaleX;
                const kY = y * scaleY;
                const kW = width * scaleX;
                const kH = height * scaleY;

                kioskCtx.strokeStyle = boxColor;
                kioskCtx.lineWidth = 4;
                kioskCtx.strokeRect(kX, kY, kW, kH);

                kioskCtx.font = '18px Sarabun, sans-serif';
                const kTextWidth = kioskCtx.measureText(labelText).width;

                kioskCtx.fillStyle = boxColor;
                kioskCtx.fillRect(kX, kY > 30 ? kY - 30 : kY, kTextWidth + 16, 30);

                kioskCtx.fillStyle = '#ffffff';
                kioskCtx.fillText(labelText, kX + 8, kY > 30 ? kY - 8 : kY + 22);
            }
        });
    }


    // --- Process Detection Results & Stability Trigger ---
    function processPredictions(predictions) {
        if (isCountdownActive) {
            currentStableClass = null;
            holdProgressBar.style.width = '0%';
            return;
        }

        const validPredictions = predictions
            .filter(p => {
                const cls = p.class.toLowerCase();
                if (IGNORED_CLASSES.includes(cls)) return false;
                if (p.score < currentConfidenceThreshold) return false;

                // Filter out tiny peripheral noise if dimensions exist (< 1.2% frame size)
                const [x, y, w, h] = p.bbox;
                const area = w * h;
                const minArea = (canvasEl.width * canvasEl.height) * 0.012;
                if (area < minArea && p.score < (currentConfidenceThreshold + 0.12)) return false;

                return true;
            })
            .sort((a, b) => {
                // Salience priority: confidence weighted by proximity to center of frame
                const centerX = canvasEl.width / 2;
                const centerY = canvasEl.height / 2;

                const aMidX = a.bbox[0] + a.bbox[2] / 2;
                const aMidY = a.bbox[1] + a.bbox[3] / 2;
                const aDist = Math.hypot(aMidX - centerX, aMidY - centerY) / (Math.hypot(centerX, centerY) || 1);

                const bMidX = b.bbox[0] + b.bbox[2] / 2;
                const bMidY = b.bbox[1] + b.bbox[3] / 2;
                const bDist = Math.hypot(bMidX - centerX, bMidY - centerY) / (Math.hypot(centerX, centerY) || 1);

                const aPriority = a.score * (1.2 - aDist * 0.35);
                const bPriority = b.score * (1.2 - bDist * 0.35);

                return bPriority - aPriority;
            });



        const now = Date.now();

        if (validPredictions.length === 0) {
            // Ignore a short miss so the progress bar doesn't jump back to zero on every blink
            if (performance.now() - lastValidDetectionTime > BOX_HOLD_MS) {
                currentStableClass = null;
                holdProgressBar.style.width = '0%';
            }
            return;
        }

        const topPrediction = validPredictions[0];
        const itemKey = topPrediction.class.toLowerCase();
        const matchingCustoms = customThaiProducts.filter(p => p.shape === itemKey);
        let mappedInfo = null;
        if (matchingCustoms.length > 0) {
            const c = matchingCustoms[0];
            mappedInfo = {
                type: c.bin,
                thName: `⭐ ${c.name} (${topPrediction.class})`,
                bin: c.binName || BIN_NAMES[c.bin] || 'ขยะทั่วไป',
                price: c.price || 'กก.ละ 3.00-6.00 บาท',
                estValue: c.estValue || 0.25,
                desc: c.advice || DEFAULT_GENERAL_WASTE.desc,
                custom: true
            };
        } else {
            mappedInfo = WASTE_MAPPING[itemKey] || {
                type: 'general',
                thName: `ขยะทั่วไป (${topPrediction.class})`,
                bin: 'ขยะทั่วไป',
                desc: DEFAULT_GENERAL_WASTE.desc
            };
        }

        updatePredictionUI(mappedInfo, topPrediction.score);

        // Check Hold-Steady stability
        if (currentStableClass === itemKey) {
            const timeHeld = now - stableStartTime;
            const progressPct = Math.min((timeHeld / STABILITY_THRESHOLD_MS) * 100, 100);
            holdProgressBar.style.width = `${progressPct}%`;

            if (timeHeld >= STABILITY_THRESHOLD_MS && (now - lastAutoCommitTime) > AUTO_COMMIT_COOLDOWN_MS) {
                commitWasteScan(mappedInfo, topPrediction.score);
                lastAutoCommitTime = now;
                holdProgressBar.style.width = '0%';
            }
        } else {
            currentStableClass = itemKey;
            stableStartTime = now;
            holdProgressBar.style.width = '0%';
        }
    }

    // --- Update UI Badge & Cards ---
    function updatePredictionUI(info, score) {
        confidencePill.innerText = `${Math.round(score * 100)}% Confidence`;

        // Only rebuild the result card when the detected item changes (rebuilding every frame makes it flash)
        const uiKey = `${info.type}|${info.thName}|${info.bin}|${info.desc}`;
        if (uiKey === lastPredictionUIKey) return;
        lastPredictionUIKey = uiKey;

        binResultBadge.className = `bin-result-badge ${info.type}`;
        detectedObjectText.innerText = info.thName;
        binDescriptionText.innerText = info.desc;

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
    function commitWasteScan(info, score) {
        stats.total += 1;
        if (info.type === 'plastic_bottle') {
            stats.plastic_bottle = (stats.plastic_bottle || 0) + 1;
            stats.co2 += 0.18;
            stats.estimatedValue += (info.estValue || 0.30);
            stats.meritPoints = (stats.meritPoints || 0) + 10;
        } else if (info.type === 'recyclable') {
            stats.recyclable += 1;
            stats.co2 += 0.15;
            stats.estimatedValue += (info.estValue || 0.40);
            stats.meritPoints = (stats.meritPoints || 0) + 10;
        } else if (info.type === 'hazardous') {
            stats.hazardous += 1;
            stats.estimatedValue += (info.estValue || 0.00);
            stats.meritPoints = (stats.meritPoints || 0) + 15;
        } else if (info.type === 'money') {
            // Money is not waste
            stats.meritPoints = (stats.meritPoints || 0) + 20;
        } else {
            stats.general += 1;
            stats.meritPoints = (stats.meritPoints || 0) + 5;
        }


        updateStatsUI();

        // Add history log entry
        const timeString = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        lastScanInfo = { info, score, time: timeString };
        const historyItem = {
            id: Date.now(),
            time: timeString,
            item: info.thName,
            bin: info.bin,
            type: info.type,
            confidence: `${Math.round(score * 100)}%`
        };


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
            modalCategoryPill.innerText = `${info.bin} (${Math.round(score * 100)}% Confidence)`;
            modalDesc.innerText = info.desc;
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
                speakThaiText('อันนี้แม่นเงินเน้อเจ้า! อย่าเอาทิ้งเน้อเจ้า เก็บไว้ในเป๋าเป๋นบุญเป๋นกุศลเจ้า');
            } else {
                speakThaiText('นี่คือ เงิน ไม่ควรทิ้ง');
            }
        } else if (info.type === 'plastic_bottle') {
            if (currentDialect === 'khammuang') {
                speakThaiText(`${info.thName} เอาทิ้งลงถังขวดพลาสติกเน้อเจ้า ฮอมบุญตวยกันเจ้า`);
            } else {
                speakThaiText(`${info.thName} ทิ้งลง${info.bin}`);
            }
        } else if (info.type === 'recyclable') {
            if (currentDialect === 'khammuang') {
                speakThaiText(`${info.thName} เอาทิ้งลงถังรีไซเคิลสีเขียวเน้อเจ้า ฮอมบุญตวยกันเจ้า`);
            } else {
                speakThaiText(`${info.thName} ทิ้งลง${info.bin}`);
            }
        } else if (info.type === 'hazardous') {
            if (currentDialect === 'khammuang') {
                speakThaiText(`อันตรายเน้อเจ้า! ${info.thName} เอาทิ้งลงถังขยะอันตรายสีแดงเน้อเจ้า`);
            } else {
                speakThaiText(`${info.thName} ทิ้งลง${info.bin}`);
            }
        } else {
            if (currentDialect === 'khammuang') {
                speakThaiText(`${info.thName} เอาทิ้งลงถังขยะทั่วไปสีฟ้าเน้อเจ้า`);
            } else {
                speakThaiText(`${info.thName} ทิ้งลง${info.bin}`);
            }
        }





        // Start 5-4-3-2-1 countdown for next scan
        startScanCountdown();
    }


    // --- 7-6-5-4-3-2-1 Countdown Timer Function with Modal (7 Seconds Delay) ---
    function startScanCountdown() {
        if (countdownInterval) clearInterval(countdownInterval);

        isCountdownActive = true;
        currentStableClass = null;
        holdProgressBar.style.width = '0%';

        let count = 7;

        countdownNumberEl.innerText = count;
        if (kioskCountdownNumEl) kioskCountdownNumEl.innerText = count;
        if (modalTimerNum) modalTimerNum.innerText = count;

        nextScanCountdownEl.classList.remove('hidden');
        if (kioskCountdownOverlay) kioskCountdownOverlay.classList.remove('hidden');
        if (resultModalBackdrop) resultModalBackdrop.classList.remove('hidden');

        countdownInterval = setInterval(() => {
            count -= 1;
            if (count > 0) {
                countdownNumberEl.innerText = count;
                if (kioskCountdownNumEl) kioskCountdownNumEl.innerText = count;
                if (modalTimerNum) modalTimerNum.innerText = count;

                countdownNumberEl.style.animation = 'none';
                countdownNumberEl.offsetHeight;
                countdownNumberEl.style.animation = 'popScale 0.3s ease-out';
            } else {
                clearInterval(countdownInterval);
                countdownInterval = null;
                nextScanCountdownEl.classList.add('hidden');
                if (kioskCountdownOverlay) kioskCountdownOverlay.classList.add('hidden');
                if (resultModalBackdrop) resultModalBackdrop.classList.add('hidden');
                isCountdownActive = false;
                currentStableClass = null;
            }
        }, 1000);
    }


    // --- Update Statistics UI ---
    function updateStatsUI() {
        totalCountEl.innerText = stats.total;
        if (plasticBottleCountEl) plasticBottleCountEl.innerText = stats.plastic_bottle || 0;
        recyclableCountEl.innerText = stats.recyclable;
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
        if (treeValEl) treeValEl.innerText = treesEquivalent.toFixed(1);
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
            if (!stats.plastic_bottle) stats.plastic_bottle = 0;
            if (!stats.hazardous) stats.hazardous = 0;
            if (savedHistory) scanHistory = JSON.parse(savedHistory);

            const savedConf = localStorage.getItem('ecoscan_confidence');
            if (savedConf) {
                const parsedConf = parseFloat(savedConf);
                if (!isNaN(parsedConf)) setConfidenceThreshold(parsedConf);
            } else {
                setConfidenceThreshold(0.58);
            }



            updateStatsUI();
            renderHistoryTable();
        } catch (e) {
            console.error('LocalStorage load error:', e);
        }
    }

    // --- Manual Snapshot Scan Handler ---
    async function triggerManualSnapshot() {
        if (!model || isCountdownActive) return; // Don't double-count while the result card is showing

        if (isCameraActive && webcamEl.readyState === 4) {
            try {
                const predictions = await model.detect(webcamEl);
                const valid = predictions
                    .filter(p => p.score >= currentConfidenceThreshold && !IGNORED_CLASSES.includes(p.class.toLowerCase()))
                    .sort((a, b) => b.score - a.score);

                if (valid.length > 0) {
                    const top = valid[0];
                    const itemKey = top.class.toLowerCase();
                    const matchingCustoms = customThaiProducts.filter(p => p.shape === itemKey);
                    let mappedInfo = null;
                    if (matchingCustoms.length > 0) {
                        const c = matchingCustoms[0];
                        mappedInfo = {
                            type: c.bin,
                            thName: `⭐ ${c.name} (${top.class})`,
                            bin: c.binName || BIN_NAMES[c.bin] || 'ขยะทั่วไป',
                            price: c.price || 'กก.ละ 3.00-6.00 บาท',
                            estValue: c.estValue || 0.25,
                            desc: c.advice || DEFAULT_GENERAL_WASTE.desc,
                            custom: true
                        };
                    } else {
                        mappedInfo = WASTE_MAPPING[itemKey] || {
                            type: 'general',
                            thName: `ขยะทั่วไป (${top.class})`,
                            bin: 'ขยะทั่วไป',
                            desc: DEFAULT_GENERAL_WASTE.desc
                        };
                    }
                    updatePredictionUI(mappedInfo, top.score);
                    commitWasteScan(mappedInfo, top.score);
                } else {
                    commitWasteScan(DEFAULT_GENERAL_WASTE, 0.50);
                }
            } catch (e) {
                console.error('Snapshot error:', e);
            }
        } else {
            // Default sample snapshot if camera is not active
            const sampleKey = 'singha_bottle';
            const mappedInfo = WASTE_MAPPING[sampleKey] || WASTE_MAPPING['bottle'];
            updatePredictionUI(mappedInfo, 0.95);
            commitWasteScan(mappedInfo, 0.95);
        }
    }

    // --- Sample Test Buttons Click Handler (Event Delegation for Static & Dynamic Custom Buttons) ---
    const sampleObjectsContainer = document.querySelector('.sample-objects-container');
    if (sampleObjectsContainer) {
        sampleObjectsContainer.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.custom-btn-del');
            if (delBtn) {
                e.stopPropagation();
                const prodId = delBtn.getAttribute('data-del');
                deleteCustomProduct(prodId);
                return;
            }

            const btn = e.target.closest('.sample-btn');
            if (!btn) return;
            const itemKey = btn.getAttribute('data-item');
            if (!itemKey) return;

            const mappedInfo = WASTE_MAPPING[itemKey] || DEFAULT_GENERAL_WASTE;
            updatePredictionUI(mappedInfo, 0.95);
            commitWasteScan(mappedInfo, 0.95);
        });
    }

    // --- File Upload Test Image Handler ---
    imageUploadEl.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = async () => {
                if (!model) return;
                const predictions = await model.detect(img);
                drawBoundingBoxes(predictions);
                const valid = predictions
                    .filter(p => p.score >= currentConfidenceThreshold && !IGNORED_CLASSES.includes(p.class.toLowerCase()))
                    .sort((a, b) => b.score - a.score);

                if (valid.length > 0) {
                    const top = valid[0];
                    const itemKey = top.class.toLowerCase();
                    const matchingCustoms = customThaiProducts.filter(p => p.shape === itemKey);
                    let info = null;
                    if (matchingCustoms.length > 0) {
                        const c = matchingCustoms[0];
                        info = {
                            type: c.bin,
                            thName: `⭐ ${c.name} (${top.class})`,
                            bin: c.binName || BIN_NAMES[c.bin] || 'ขยะทั่วไป',
                            price: c.price || 'กก.ละ 3.00-6.00 บาท',
                            estValue: c.estValue || 0.25,
                            desc: c.advice || DEFAULT_GENERAL_WASTE.desc,
                            custom: true
                        };
                    } else {
                        info = WASTE_MAPPING[itemKey] || DEFAULT_GENERAL_WASTE;
                    }
                    updatePredictionUI(info, top.score);
                    commitWasteScan(info, top.score);
                } else {
                    updatePredictionUI(DEFAULT_GENERAL_WASTE, 0.60);
                    commitWasteScan(DEFAULT_GENERAL_WASTE, 0.60);
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

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

    uploadBtn.addEventListener('click', () => imageUploadEl.click());

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
                speakThaiText('สลับเป็นเสียงภาษากลางครับ');
            } else {
                currentDialect = 'khammuang';
                dialectLabel.innerText = '🌺 เสียงคำเมือง';
                toggleDialectBtn.className = 'btn btn-sm btn-outline dialect-btn';
                speakThaiText('สลับเป๋นเสียงคำเมืองล้านนาเจ้า');
            }
        });
    }

    toggleSoundBtn.addEventListener('click', () => {
        isSoundMuted = !isSoundMuted;
        soundIcon.className = isSoundMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
        toggleSoundBtn.style.opacity = isSoundMuted ? '0.5' : '1';
    });


    resetStatsBtn.addEventListener('click', () => {
        if (confirm('คุณต้องการรีเซ็ตสถิติและประวัติการสแกนทั้งหมดใช่หรือไม่?')) {
            stats = { total: 0, plastic_bottle: 0, recyclable: 0, general: 0, hazardous: 0, co2: 0.0, estimatedValue: 0.0 };
            scanHistory = [];

            saveStats();
            updateStatsUI();
            renderHistoryTable();
        }
    });

    // --- Kiosk Mode Handlers ---
    function enterKioskMode() {
        isKioskMode = true;
        kioskOverlay.classList.remove('hidden');
        if (webcamStream) {
            kioskWebcam.srcObject = webcamStream;
            kioskCanvas.width = canvasEl.width || 640;
            kioskCanvas.height = canvasEl.height || 480;
        }
        updateStatsUI();
    }

    function exitKioskMode() {
        isKioskMode = false;
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
        closeModalBtn.addEventListener('click', () => {
            if (resultModalBackdrop) resultModalBackdrop.classList.add('hidden');
        });
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
        localStorage.setItem('ecoscan_confidence', currentConfidenceThreshold.toString());
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
    // Thai Product AI Training Studio Engine
    // ==========================================================================

    function loadCustomProducts() {
        try {
            const stored = localStorage.getItem('ecoscan_custom_thai_products');
            if (stored) {
                customThaiProducts = JSON.parse(stored);
            } else {
                customThaiProducts = [];
            }
        } catch (e) {
            console.warn('Failed to load custom products from localStorage:', e);
            customThaiProducts = [];
        }

        // Register custom products into active WASTE_MAPPING dictionary
        customThaiProducts.forEach(prod => {
            WASTE_MAPPING[prod.id] = {
                type: prod.bin,
                thName: prod.name,
                bin: prod.binName || BIN_NAMES[prod.bin] || 'ขยะทั่วไป',
                price: prod.price || 'กก.ละ 3.00-6.00 บาท',
                estValue: parseFloat(prod.estValue) || 0.25,
                desc: prod.advice || 'คัดแยกให้สะอาดก่อนทิ้ง',
                custom: true,
                shape: prod.shape,
                image: prod.image
            };
        });

        renderCustomProductsUI();

        // Also sync from Firestore cloud database if connected
        if (db) {
            db.collection('custom_thai_products').orderBy('timestamp', 'desc').get()
                .then(snapshot => {
                    if (!snapshot.empty) {
                        const cloudProducts = [];
                        snapshot.forEach(doc => {
                            cloudProducts.push({ id: doc.id, ...doc.data() });
                        });

                        let changed = false;
                        cloudProducts.forEach(cp => {
                            if (!customThaiProducts.some(p => p.id === cp.id)) {
                                customThaiProducts.push(cp);
                                changed = true;
                            }
                        });

                        if (changed) {
                            persistCustomProducts();
                            customThaiProducts.forEach(prod => {
                                WASTE_MAPPING[prod.id] = {
                                    type: prod.bin,
                                    thName: prod.name,
                                    bin: prod.binName || BIN_NAMES[prod.bin] || 'ขยะทั่วไป',
                                    price: prod.price || 'กก.ละ 3.00-6.00 บาท',
                                    estValue: parseFloat(prod.estValue) || 0.25,
                                    desc: prod.advice || 'คัดแยกให้สะอาดก่อนทิ้ง',
                                    custom: true,
                                    shape: prod.shape,
                                    image: prod.image
                                };
                            });
                            renderCustomProductsUI();
                        }
                    }
                })
                .catch(err => console.log('Firestore custom products offline:', err));
        }
    }

    function renderCustomProductsUI() {
        if (!trainerProductsContainer || !customTrainedButtons) return;

        const count = customThaiProducts.length;
        if (trainerTotalCount) trainerTotalCount.innerText = count.toString();
        if (customProductCountBadge) customProductCountBadge.innerText = count.toString();

        if (count === 0) {
            if (customTrainedSection) customTrainedSection.classList.add('hidden');
            trainerProductsContainer.innerHTML = `
                <div class="trainer-empty-notice">
                    <i class="fa-solid fa-graduation-cap" style="font-size: 2.2rem; color: #a78bfa; margin-bottom: 0.5rem; display: block;"></i>
                    ยังไม่มีสินค้าไทยที่บันทึกไว้ในระบบ<br>
                    <span style="font-size: 0.82rem; color: #94a3b8;">กรอกแบบฟอร์มด้านบนแล้วกด "บันทึกการฝึกสอน AI" เพื่อเริ่มสอนสินค้าท้องถิ่นชิ้นแรก</span>
                </div>
            `;
            customTrainedButtons.innerHTML = '';
            return;
        }

        if (customTrainedSection) customTrainedSection.classList.remove('hidden');

        // Render Quick-Test Buttons in Sample Objects Bar
        customTrainedButtons.innerHTML = customThaiProducts.map(prod => {
            let binBtnClass = 'general-btn';
            if (prod.bin === 'plastic_bottle') binBtnClass = 'plastic-bottle-btn';
            else if (prod.bin === 'recyclable') binBtnClass = 'recyclable-btn';
            else if (prod.bin === 'hazardous') binBtnClass = 'hazardous-btn';

            return `
                <button class="btn btn-sm btn-outline sample-btn custom-btn ${binBtnClass}" data-item="${escapeHtml(prod.id)}" title="ทดสอบจำแนก ${escapeHtml(prod.name)}">
                    ⭐ ${escapeHtml(prod.name)}
                    <span class="custom-btn-del" data-del="${escapeHtml(prod.id)}" title="ลบสินค้าชิ้นนี้">&times;</span>
                </button>
            `;
        }).join('');

        // Render Cards in Trainer Studio Modal
        const shapeNames = {
            'bottle': 'ขวด (Bottle)',
            'cup': 'แก้ว/ถ้วย (Cup)',
            'bowl': 'ชาม (Bowl)',
            'box': 'กล่อง (Box)',
            'book': 'กระดาษ (Book)',
            'cell phone': 'มือถือ (Phone)',
            'scissors': 'มีด/ของมีคม (Cutters)'
        };

        trainerProductsContainer.innerHTML = customThaiProducts.map(prod => {
            return `
                <div class="trainer-product-card">
                    <div class="trainer-prod-name">
                        <span>⭐</span> <strong>${escapeHtml(prod.name)}</strong>
                    </div>
                    <div class="trainer-prod-meta">
                        <span class="trainer-bin-pill ${escapeHtml(prod.bin)}">${escapeHtml(prod.binName || BIN_NAMES[prod.bin])}</span>
                        <span style="color: #64748b;">${escapeHtml(shapeNames[prod.shape] || prod.shape)}</span>
                    </div>
                    <div style="font-size: 0.76rem; color: #475569;">
                        <div>💰 ${escapeHtml(prod.price || 'กก.ละ 3.00-6.00 บาท')} (~${(parseFloat(prod.estValue) || 0.25).toFixed(2)} บ./ชิ้น)</div>
                        <div style="margin-top: 2px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(prod.advice)}">💡 ${escapeHtml(prod.advice)}</div>
                    </div>
                    <div class="trainer-prod-actions">
                        <button type="button" class="btn btn-sm btn-primary test-prod-btn" data-id="${escapeHtml(prod.id)}">
                            <i class="fa-solid fa-play"></i> ทดสอบ
                        </button>
                        <button type="button" class="btn btn-sm btn-secondary del-prod-btn" data-id="${escapeHtml(prod.id)}" style="color: #e11d48;">
                            <i class="fa-solid fa-trash"></i> ลบ
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach listeners for modal cards
        trainerProductsContainer.querySelectorAll('.test-prod-btn').forEach(b => {
            b.addEventListener('click', () => {
                const pid = b.getAttribute('data-id');
                const info = WASTE_MAPPING[pid] || DEFAULT_GENERAL_WASTE;
                closeTrainerModal();
                updatePredictionUI(info, 0.96);
                commitWasteScan(info, 0.96);
            });
        });

        trainerProductsContainer.querySelectorAll('.del-prod-btn').forEach(b => {
            b.addEventListener('click', () => {
                const pid = b.getAttribute('data-id');
                deleteCustomProduct(pid);
            });
        });
    }

    function persistCustomProducts() {
        try {
            localStorage.setItem('ecoscan_custom_thai_products', JSON.stringify(customThaiProducts));
        } catch (e) {
            console.warn('Could not save custom products to localStorage:', e);
        }
    }

    function saveCustomProduct(prod) {
        customThaiProducts.unshift(prod);
        persistCustomProducts();

        // Register into active dictionary
        WASTE_MAPPING[prod.id] = {
            type: prod.bin,
            thName: prod.name,
            bin: prod.binName || BIN_NAMES[prod.bin] || 'ขยะทั่วไป',
            price: prod.price || 'กก.ละ 3.00-6.00 บาท',
            estValue: parseFloat(prod.estValue) || 0.25,
            desc: prod.advice || 'คัดแยกให้สะอาดก่อนทิ้ง',
            custom: true,
            shape: prod.shape,
            image: prod.image
        };

        // Sync with Firestore if online
        if (db) {
            db.collection('custom_thai_products').doc(prod.id).set(prod)
                .catch(err => console.log('Failed to save to Firestore:', err));
        }

        renderCustomProductsUI();

        // Audio confirmation in selected dialect
        if (currentDialect === 'khammuang') {
            speakThaiText(`บันทึกการฝึกสอนสินค้า ${prod.name} เรียบร้อยแล้วเจ้า`);
        } else {
            speakThaiText(`บันทึกการฝึกสอนสินค้า ${prod.name} เรียบร้อยแล้วครับ`);
        }
    }

    function deleteCustomProduct(id) {
        const prod = customThaiProducts.find(p => p.id === id);
        const name = prod ? prod.name : 'สินค้านี้';
        if (!confirm(`คุณต้องการลบ "${name}" ออกจากการฝึกสอน AI ใช่หรือไม่?`)) return;

        customThaiProducts = customThaiProducts.filter(p => p.id !== id);
        delete WASTE_MAPPING[id];
        persistCustomProducts();

        if (db) {
            db.collection('custom_thai_products').doc(id).delete()
                .catch(err => console.log('Firestore delete failed:', err));
        }

        renderCustomProductsUI();
    }

    function openTrainerModal() {
        if (trainerModalBackdrop) trainerModalBackdrop.classList.remove('hidden');
    }

    function closeTrainerModal() {
        if (trainerModalBackdrop) trainerModalBackdrop.classList.add('hidden');
    }

    // Modal Triggers
    if (openTrainerHeaderBtn) openTrainerHeaderBtn.addEventListener('click', openTrainerModal);
    if (openTrainerBtn) openTrainerBtn.addEventListener('click', openTrainerModal);
    if (closeTrainerModalBtn) closeTrainerModalBtn.addEventListener('click', closeTrainerModal);
    if (trainerModalBackdrop) {
        trainerModalBackdrop.addEventListener('click', (e) => {
            if (e.target === trainerModalBackdrop) closeTrainerModal();
        });
    }

    // Reference photos are kept small: phone photos are several MB, which overflows
    // localStorage (~5MB) and Firestore's 1MB document limit, so saving silently failed
    function shrinkImageToDataUrl(source, srcW, srcH, maxSide = 320) {
        const w = srcW || 320;
        const h = srcH || 240;
        const scale = Math.min(1, maxSide / Math.max(w, h));
        const c = document.createElement('canvas');
        c.width = Math.round(w * scale);
        c.height = Math.round(h * scale);
        c.getContext('2d').drawImage(source, 0, 0, c.width, c.height);
        return c.toDataURL('image/jpeg', 0.75);
    }

    // Snapshot from Live Webcam for Training Reference
    if (trainerSnapBtn) {
        trainerSnapBtn.addEventListener('click', () => {
            if (!webcamEl || !webcamEl.videoWidth) {
                alert('กรุณาเปิดกล้องเว็บแคมก่อนถ่ายรูปภาพอ้างอิง');
                return;
            }
            currentTrainerImage = shrinkImageToDataUrl(webcamEl, webcamEl.videoWidth, webcamEl.videoHeight);
            showTrainerPreview();
        });
    }

    // Upload Reference Image for Training
    if (trainerUploadBtn && trainerImageUpload) {
        trainerUploadBtn.addEventListener('click', () => trainerImageUpload.click());
        trainerImageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const img = new Image();
                img.onload = () => {
                    currentTrainerImage = shrinkImageToDataUrl(img, img.naturalWidth, img.naturalHeight);
                    showTrainerPreview();
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function showTrainerPreview() {
        if (trainerPreviewImg) {
            trainerPreviewImg.src = currentTrainerImage;
            trainerPreviewImg.classList.remove('hidden');
        }
        if (trainerPreviewPlaceholder) {
            trainerPreviewPlaceholder.classList.add('hidden');
        }
    }

    // Trainer Form Submit Handler
    if (trainerForm) {
        trainerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = trainProductName.value.trim();
            if (!name) return;

            const bin = trainProductBin.value;
            const shape = trainProductShape.value;
            const price = trainProductPrice.value.trim() || 'กก.ละ 3.00-6.00 บาท';
            const estVal = parseFloat(trainProductEstValue.value) || 0.25;
            const advice = trainProductAdvice.value.trim() || 'คัดแยกให้สะอาดก่อนทิ้ง';
            const id = 'thai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);

            const newProduct = {
                id,
                name,
                bin,
                binName: BIN_NAMES[bin] || 'ขยะทั่วไป',
                shape,
                price,
                estValue: estVal,
                advice,
                image: currentTrainerImage,
                timestamp: new Date().toISOString()
            };

            saveCustomProduct(newProduct);

            // Reset form
            trainerForm.reset();
            currentTrainerImage = null;
            if (trainerPreviewImg) {
                trainerPreviewImg.src = '';
                trainerPreviewImg.classList.add('hidden');
            }
            if (trainerPreviewPlaceholder) {
                trainerPreviewPlaceholder.classList.remove('hidden');
            }

            alert(`🎉 ฝึกสอนโมเดล AI สำเร็จ!\nเพิ่มสินค้า: "${name}" ลงใน ${BIN_NAMES[bin]}\nคุณสามารถคลิกทดลองจากแถบทดสอบ หรือส่องกล้องทดสอบได้ทันที`);
        });
    }

    // Reset Form
    if (resetTrainerFormBtn) {
        resetTrainerFormBtn.addEventListener('click', () => {
            trainerForm.reset();
            currentTrainerImage = null;
            if (trainerPreviewImg) {
                trainerPreviewImg.src = '';
                trainerPreviewImg.classList.add('hidden');
            }
            if (trainerPreviewPlaceholder) {
                trainerPreviewPlaceholder.classList.remove('hidden');
            }
        });
    }

    // Clear All Custom Products
    if (clearAllCustomBtn) {
        clearAllCustomBtn.addEventListener('click', () => {
            if (customThaiProducts.length === 0) {
                alert('ยังไม่มีรายการสินค้าที่คุณฝึกสอนไว้');
                return;
            }
            if (confirm('คุณต้องการลบข้อมูลสินค้าไทยที่คุณฝึกสอนไว้ทั้งหมดใช่หรือไม่?')) {
                customThaiProducts.forEach(p => {
                    delete WASTE_MAPPING[p.id];
                    // Also remove from the cloud, otherwise they come back on the next page load
                    if (db) {
                        db.collection('custom_thai_products').doc(p.id).delete()
                            .catch(err => console.log('Firestore delete failed:', err));
                    }
                });
                customThaiProducts = [];
                localStorage.removeItem('ecoscan_custom_thai_products');
                renderCustomProductsUI();
            }
        });
    }

    // --- Start Application ---
    initApp();

});

