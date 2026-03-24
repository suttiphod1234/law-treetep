/**
 * Google Apps Script Backend for Trithep Law Office
 * - Handles data storage in Google Sheets
 * - Categorizes cases automatically
 * - Integrates with Line Messaging API
 */

const SHEET_ID = '17Nxa7YJah28ySjCmVtq8XJf_hoLqhUlT2I9wNTUw2S4';
const LINE_ACCESS_TOKEN = 'ZDo/w/TP1R90TnVb6A3ZB4482+2ikAD2/imlwhvXTti9kezS35nRIfxZN+uSqUnOOjwWFTkqKIUSX7jtVh3hIOU88ZYFANLc44Q76ESFbybqbIcpnzajMyUgtft2OXRmXspYo136ckW4/QclBhtV3AdB04t89/1O/w1cDnyilFU=';
const LAWYER_GROUP_ID = 'C0e8bc4aae31a5547c427bd4b7992efd7';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { fullName, phone, message, type, slip } = data;
    
    // 1. Categorize Case
    const category = categorizeCase(message);
    
    // Determine free usage limit status
    let statusText = 'Private ⭐️';
    if (type === 'free') {
      const existingCount = getFreeCount(phone);
      const currentCount = existingCount + 1;
      statusText = `Free (ครั้งที่ ${currentCount}/2)`;
      if (currentCount > 2) {
        statusText = `Free (เกินโควต้า ครั้งที่ ${currentCount})`;
      }
    }
    
    // 2. Save to Google Sheet
    saveToSheet(category, [new Date(), fullName, phone, message, type]);
    
    // 3. Send Flex Message to Lawyer group
    sendToLawyerGroup(fullName, phone, message, statusText, category);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', category }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function categorizeCase(text) {
  if (text.includes('ฆ่า') || text.includes('ทำร้าย') || text.includes('ลักทรัพย์')) return 'คดีอาญา';
  if (text.includes('มรดก') || text.includes('พินัยกรรม')) return 'จัดการมรดก';
  if (text.includes('ที่ดิน') || text.includes('โฉนด')) return 'ที่ดิน';
  if (text.includes('รถชน') || text.includes('อุบัติเหตุ')) return 'คดี พ.ร.บ. และอุบัติเหตุ';
  if (text.includes('ยึด') || text.includes('บังคับคดี')) return 'คดียึดทรัพย์';
  if (text.includes('สัญญา') || text.includes('กู้ยืม')) return 'คดีผิดสัญญา';
  return 'คดีแพ่ง';
}

function getFreeCount(phone) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const categories = ['คดีอาญา', 'คดีแพ่ง', 'จัดการมรดก', 'ที่ดิน', 'คดี พ.ร.บ. และอุบัติเหตุ', 'คดียึดทรัพย์', 'คดีผิดสัญญา'];
  let count = 0;
  
  categories.forEach(cat => {
    const sheet = ss.getSheetByName(cat);
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      data.forEach(row => {
        if (row[2].toString() === phone.toString() && row[4] === 'free') {
          count++;
        }
      });
    }
  });
  return count;
}

function saveToSheet(sheetName, rowData) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['วันที่', 'ชื่อ-สกุล', 'เบอร์โทร', 'ข้อความปรึกษา', 'ประเภทบริการ']);
  }
  sheet.appendRow(rowData);
}

function sendToLawyerGroup(name, phone, message, statusText, category) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const flexData = {
    "type": "bubble",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [{ "type": "text", "text": "🔔 เคสปรึกษาใหม่", "weight": "bold", "color": "#1a237e" }]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        { "type": "text", "text": `ชื่อ: ${name}`, "size": "sm" },
        { "type": "text", "text": `เบอร์: ${phone}`, "size": "sm" },
        { "type": "text", "text": `สถานะ: ${statusText}`, "weight": "bold", "color": statusText.includes('Private') ? "#d32f2f" : "#4caf50" },
        { "type": "text", "text": `หมวด: ${category}`, "weight": "bold", "color": "#fbc02d" },
        { "type": "separator", "margin": "md" },
        { "type": "text", "text": message, "wrap": true, "margin": "md" }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "button",
          "action": {
            "type": "uri",
            "label": "ตอบคำถาม",
            "uri": `https://line.me/R/oaMessage/@440dtbxo/?${encodeURIComponent("สวัสดีครับ ผมทนาย...")}`
          },
          "style": "primary",
          "color": "#1a237e"
        }
      ]
    }
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
    },
    payload: JSON.stringify({
      to: LAWYER_GROUP_ID,
      messages: [{ type: 'flex', altText: 'เคสปรึกษาใหม่', contents: flexData }]
    })
  });
}

/**
 * Fetch history for a specific Line ID and format as Flex Message
 */
function getHistoryFlex(lineId) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const categories = ['คดีอาญา', 'คดีแพ่ง', 'จัดการมรดก', 'ที่ดิน', 'คดี พ.ร.บ. และอุบัติเหตุ', 'คดียึดทรัพย์', 'คดีผิดสัญญา'];
  let history = [];
  
  categories.forEach(cat => {
    const sheet = ss.getSheetByName(cat);
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      const userRows = data.filter(row => row[2].toString() === lineId.toString() || row[1].toString() === lineId.toString());
      history = history.concat(userRows);
    }
  });

  history.sort((a, b) => b[0] - a[0]);
  const items = history.slice(0, 5).map(row => ({
    "type": "box",
    "layout": "vertical",
    "contents": [
      { "type": "text", "text": `วันที่: ${Utilities.formatDate(row[0], "GMT+7", "dd/MM/yyyy")}`, "size": "xs", "color": "#aaaaaa" },
      { "type": "text", "text": row[3], "size": "sm", "wrap": true }
    ],
    "margin": "md"
  }));

  return {
    "type": "bubble",
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        { "type": "text", "text": "📜 ประวัติการปรึกษา", "weight": "bold", "size": "xl", "color": "#1a237e" },
        { "type": "separator", "margin": "lg" },
        ...items
      ]
    }
  };
}
