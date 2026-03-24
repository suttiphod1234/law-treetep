/**
 * Google Apps Script Backend for Trithep Law Office
 * - Handles data storage in Google Sheets
 * - Categorizes cases automatically
 * - Integrates with Line Messaging API
 */

const SHEET_ID = '17Nxa7YJah28ySjCmVtq8XJf_hoLqhUlT2I9wNTUw2S4';
const LINE_ACCESS_TOKEN = 'ZDo/w/TP1R90TnVb6A3ZB4482+2ikAD2/imlwhvXTti9kezS35nRIfxZN+uSqUnOOjwWFTkqKIUSX7jtVh3hIOU88ZYFANLc44Q76ESFbybqbIcpnzajMyUgtft2OXRmXspYo136ckW4/QclBhtV3AdB04t89/1O/w1cDnyilFU=';
const LAWYER_GROUP_ID = 'C0e8bc4aae31a5547c427bd4b7992efd7';

const CHANNEL_ID = '2009590576';
const CHANNEL_SECRET = '8a3a1adb11b3c0d689950b4582d928d5';
const REDIRECT_URI = 'https://suttiphod1234.github.io/law-treetep/';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // 1. Check if it's a Line Webhook Event
    if (data.events && data.events.length > 0) {
      return handleLineWebhook(data);
    }
    
    // 2. Form submission from Frontend
    const { fullName, phone, message, type, slip, code } = data;
    
    // 3. Exchange OAuth Code for LINE userId
    let userId = '';
    if (code) {
      userId = getLineUserIdFromCode(code);
    }
    
    // 4. Categorize Case
    const category = categorizeCase(message);
    
    // 5. Determine free usage limit status
    let statusText = 'Private ⭐️';
    if (type === 'free') {
      const existingCount = getFreeCount(phone);
      const currentCount = existingCount + 1;
      statusText = `Free (ครั้งที่ ${currentCount}/2)`;
      if (currentCount > 2) {
        statusText = `Free (เกินโควต้า ครั้งที่ ${currentCount})`;
      }
    }
    
    // 6. Save to Google Sheet (Include userId)
    saveToSheet(category, [new Date(), fullName, phone, message, type, userId]);
    
    // 7. Send Flex Message to Lawyer group
    sendToLawyerGroup(fullName, phone, message, statusText, category);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', category, userId }))
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
    sheet.appendRow(['วันที่', 'ชื่อ-สกุล', 'เบอร์โทร', 'ข้อความปรึกษา', 'ประเภทบริการ', 'LINE User ID']);
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
            "label": "เข้าไปตอบใน LINE OA",
            "uri": "https://chat.line.biz/"
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

// --- LINE Login & Webhook Functions ---

function getLineUserIdFromCode(code) {
  try {
    const tokenUrl = 'https://api.line.me/oauth2/v2.1/token';
    const payload = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      client_id: CHANNEL_ID,
      client_secret: CHANNEL_SECRET
    };
    
    const options = {
      method: 'post',
      payload: payload
    };
    
    const tokenResponse = UrlFetchApp.fetch(tokenUrl, options);
    const tokenData = JSON.parse(tokenResponse.getContentText());
    
    if (tokenData.id_token) {
        const verifyUrl = 'https://api.line.me/oauth2/v2.1/verify';
        const verifyOptions = {
            method: 'post',
            payload: {
                id_token: tokenData.id_token,
                client_id: CHANNEL_ID
            }
        };
        const verifyResponse = UrlFetchApp.fetch(verifyUrl, verifyOptions);
        const userInfo = JSON.parse(verifyResponse.getContentText());
        return userInfo.sub;
    }
  } catch (e) {
    console.error("Error exchanging code: " + e.toString());
  }
  return '';
}

function handleLineWebhook(webhookData) {
  try {
    const event = webhookData.events[0];
    if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId;
        const replyToken = event.replyToken;
        
        const userInfo = checkUserStatusByLineId(userId);
        
        if (userInfo && userInfo.isFreeUsed && !userInfo.isPrivate) {
            const replyText = "โควต้าปรึกษาฟรี 1 ครั้งของคุณหมดแล้วครับ ⚖️\n\nโอนชำระค่าบริการ 500 บาท เพื่อพูดคุยและปรึกษากับทนายส่วนตัวอย่างต่อเนื่องได้เลยครับ 👇\n\nอัปโหลดสลิปได้ที่: " + REDIRECT_URI;
            
            UrlFetchApp.fetch('https://api.line.me/v2/bot/message/reply', {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN
                },
                payload: JSON.stringify({
                    replyToken: replyToken,
                    messages: [{ type: 'text', text: replyText }]
                })
            });
        }
    }
  } catch (e) {
      console.error(e);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
}

function checkUserStatusByLineId(userId) {
  if (!userId) return null;
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const categories = ['คดีอาญา', 'คดีแพ่ง', 'จัดการมรดก', 'ที่ดิน', 'คดี พ.ร.บ. และอุบัติเหตุ', 'คดียึดทรัพย์', 'คดีผิดสัญญา'];
  
  let isFreeUsed = false;
  let isPrivate = false;
  
  categories.forEach(cat => {
    const sheet = ss.getSheetByName(cat);
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      data.forEach(row => {
        if (row[5] === userId) {
            if (row[4] === 'free') isFreeUsed = true;
            if (row[4] === 'private') isPrivate = true;
        }
      });
    }
  });
  
  if (isFreeUsed || isPrivate) {
      return { isFreeUsed, isPrivate };
  }
  return null;
}
