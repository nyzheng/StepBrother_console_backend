const nodemailer = require('nodemailer');
const user_data = require('./user_model');

//寄件時間生成
function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear().toString().padStart(4, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const date = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  return `${year}/${month}/${date}-${hours}:${minutes}`;
}

// 等級切換工具
function user_grade_chang(user_data) {
  const grade_num = user_data.grade;
  if (grade_num === 1) return '一般會員';
  if (grade_num === 2) return '銀牌會員';
  if (grade_num === 3) return '黃金會員';
}

//忘記密碼
function send_forget_password_mail(user_data) {
  // 設定郵件傳送器
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'bowateamb@gmail.com',
      pass: 'svtlcocwznmmtjjn',
    },
  });

  // 郵件內容
  const mailOptions = {
    from: 'bowateamb@gmail.com',
    to: user_data[0].mail,
    subject: `舊密碼通知${getCurrentDateTime()}`,
    text: `您的舊密碼是: ${user_data[0].password}`,
  };

  // 發送郵件
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('郵件發送失敗:', error);
    } else {
      console.log('郵件已成功發送:', info.response);
    }
  });
}

///結單信件內容
// 生成郵件內容的函式 收件人
function generate_recipient_info(recipientData) {
  return `
          <div id="recipient-info">
            <h2>收件人資訊：</h2>
            <p>姓名：${recipientData.recipient_name}</p>
            <p>電話：${recipientData.recipient_phone}</p>
            <p>地址：${recipientData.recipient_address}</p>
          </div>
        `;
}

// 生成郵件內容的函式 訂購人
function generate_order_information(ordering_person_data) {
  const grade = user_grade_chang(ordering_person_data);
  return `
          <div id="recipient-info">
            <h2>訂購人資訊</h2>
            <p>會員等級：${grade}</p>
            <p>姓名：${ordering_person_data.name}</p>
            <p>電話：${ordering_person_data.phone}</p>
            <p>電子郵件：${ordering_person_data.mail}</p>
          </div>
        `;
}

// 定義生成購物清單的函式
function generate_table(carData) {
  let tableContent = `
        <table class="table" style="border-collapse: collapse; border: 2px solid #ddd; width: 80vw;">
          <thead>
            <tr>
              <th style="padding: 8px; font-size: 14px; border-bottom: 1px solid #ddd; text-align: center; background-color: #f2f2f2;">訂單編號</th>
              <th style="padding: 8px; font-size: 14px; border-bottom: 1px solid #ddd; text-align: center; background-color: #f2f2f2;">品牌</th>
              <th style="padding: 8px; font-size: 14px; border-bottom: 1px solid #ddd; text-align: center; background-color: #f2f2f2;">商品名稱</th>
              <th style="padding: 8px; font-size: 14px; border-bottom: 1px solid #ddd; text-align: center; background-color: #f2f2f2;">數量</th>
              <th style="padding: 8px; font-size: 14px; border-bottom: 1px solid #ddd; text-align: center; background-color: #f2f2f2;">尺寸</th>
              <th style="padding: 8px; font-size: 14px; border-bottom: 1px solid #ddd; text-align: center; background-color: #f2f2f2;">價格</th>
            </tr>
          </thead>
          <tbody>
      `;

  carData.forEach((item) => {
    tableContent += `
          <tr>
            <td style="padding: 8px; font-size: 14px; border-bottom: 1px solid #ddd; text-align: center;">${item.id}</td>
            <td style="padding: 8px; font-size: 14px; border-bottom: 1px solid #ddd; text-align: center;">${item.brand_name}</td>
            <td style="padding: 8px; font-size: 14px; border-bottom: 1px solid #ddd; text-align: center;">${item.product_name}</td>
            <td style="padding: 8px; font-size: 14px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; font-size: 14px; border-bottom: 1px solid #ddd; text-align: center;">${item.us_size}</td>
            <td style="padding: 8px; font-size: 14px; border-bottom: 1px solid #ddd; text-align: center;">${item.price}</td>
          </tr>
        `;
  });

  tableContent += `
            </tbody>
          </table>
        `;

  return tableContent;
}

// 加總  //!折扣未完成
function calculate_total_amount(carData) {
  console.log(carData);
  let totalAmount = 0;
  let discount_price = 0;
  carData.forEach((item) => {
    totalAmount += item.subtotal;
  });
  carData.forEach((item) => {
    discount_price += item.final_price;
  });
  const discount = totalAmount - discount_price;
  return {
    totalAmount: totalAmount,
    discount: discount,
    discount_price: discount_price,
  };
}

// 對像
// 寄給客戶的郵件
function generate_mail_options(recipientData, tableContent, totalAmount) {
  const recipientInfo = generate_recipient_info(recipientData);
  return {
    from: 'bowateamb@gmail.com', // 寄件人信箱
    to: recipientData.mail, // 收件人信箱
    subject: '您於StepBrothers購買的商品', // 郵件主題
    html: `
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Your shopping</title>
          <link
            href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <style>
            /* 共用的樣式 */
            .shopping-list {
              font-family: 'Exo 2', sans-serif;
              color: #007bff;
              text-align: center;
            }
  
            #table_box {
              display: flex;
              align-items: center;
              width: 100vw;
            }
  
            /* 表格樣式 */
            .table {
              border-collapse: collapse;
              border: 2px solid #ddd;
              width: 90vw;
            }
  
            .table th,
            .table td {
              padding: 8px;
              font-size: 14px;
              border-bottom: 1px solid #ddd;
              text-align: center;
            }
  
            .table th {
              background-color: #f2f2f2;
            }
  
            /* 收件人資訊樣式 */
            #recipient_box {
              width: 100vw;
              display: flex;
              justify-content: center;
            }
  
            #recipient-info {
              margin-top: 20px;
              border: black solid 2px;
              width: 400px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              border-radius: 5px;
            }
  
            #recipient-info h2,
            p {
              margin: 10px;
            }
          </style>
  
          <h1 class="shopping-list">Step Brother</h1>
          <div id="table_box">
            ${tableContent}
          </div>
          <h3 style="text-align: center; margin-top: 20px;">總金額：${totalAmount.totalAmount}元</h3>
          <h3 style="text-align: center; margin-top: 10px;">折扣金額：${totalAmount.discount}元</h3>
          <h3 style="text-align: center; margin-top: 10px;">折扣後總金額：${totalAmount.discount_price}元</h3>
          <div id="recipient_box">
            ${recipientInfo}
          </div>
        </body>
      `,
  };
}

// 寄給業主郵件
function industry_generateMailOptions(
  recipientData,
  ordering_person_data,
  carData
) {
  const recipientInfo = generate_recipient_info(recipientData);
  const orderInfo = generate_order_information(ordering_person_data);
  const tableContent = generate_table(carData);
  const totalAmount = calculate_total_amount(carData);
  const ordertime = getCurrentDateTime();
  console.log(ordertime);
  return {
    from: 'bowateamb@gmail.com', // 寄件人信箱
    to: 'bowateamb@gmail.com', // 收件人信箱
    subject: `訂單詳情 - ${ordering_person_data.name}`, // 郵件主題
    html: `
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>訂單詳情 - ${ordering_person_data.name}</title>
          <link
            href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <style>
            /* 共用的樣式 */
            .shopping-list {
              font-family: 'Exo 2', sans-serif;
              color: #007bff;
              text-align: center;
            }
  
            #table_box {
              display: flex;
              align-items: center;
              width: 100vw;
            }
  
            /* 表格樣式 */
            .table {
              border-collapse: collapse;
              border: 2px solid #ddd;
              width: 90vw;
            }
  
            .table th,
            .table td {
              padding: 8px;
              font-size: 14px;
              border-bottom: 1px solid #ddd;
              text-align: center;
            }
  
            .table th {
              background-color: #f2f2f2;
            }
  
            /* 收件人資訊樣式 */
            #recipient_box {
              width: 100vw;
              display: flex;
              justify-content: center;
            }
  
            #recipient-info {
              margin-top: 20px;
              border: black solid 2px;
              width: 400px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              border-radius: 5px;
            }
  
            #recipient-info h2,
            p {
              margin: 10px;
            }
          </style>
  
          <h1 class="shopping-list">來自${ordering_person_data.name}訂單 - ${ordertime}</h1>
          <div id="recipient_box">
            ${recipientInfo}
          </div>
          <div id="order_box">
            ${orderInfo}
          </div>
          <div id="table_box">
            ${tableContent}
          </div>
          <h3 style="text-align: center; margin-top: 20px;">總金額：${totalAmount.totalAmount}元</h3>
          <h3 style="text-align: center; margin-top: 10px;">折扣金額：${totalAmount.discount}元</h3>
          <h3 style="text-align: center; margin-top: 10px;">折扣後總金額：${totalAmount.discount_price}元</h3>
        </body>
      `,
  };
}

// 使用 nodemailer 發送郵件

function send_shopping_mail(carData, recipientData, ordering_person_data) {
  return new Promise((resolve, reject) => {
    const tableContent = generate_table(carData);
    const totalAmount = calculate_total_amount(carData);
    const mail_options = generate_mail_options(
      recipientData,
      tableContent,
      totalAmount
    );
    const industry_mailOptions = industry_generateMailOptions(
      recipientData,
      ordering_person_data,
      carData
    );

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'bowateamb@gmail.com',
        pass: 'svtlcocwznmmtjjn',
      },
    });

    transporter.sendMail(mail_options, (error, info) => {
      if (error) {
        console.error('買家郵件發送失敗:', error);
        reject(false);
      } else {
        console.log('買家郵件已成功發送:', info.response);
        resolve(true);
      }
    });
    transporter.sendMail(industry_mailOptions, (error, info) => {
      if (error) {
        console.error('業主郵件發送失敗:', error);
        reject(false);
      } else {
        console.log('業主郵件已成功發送:', info.response);
        resolve(true);
      }
    });
  });
}

module.exports = {
  send_shopping_mail,
  send_forget_password_mail,
};
