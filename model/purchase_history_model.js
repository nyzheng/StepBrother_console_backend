const { connection } = require('../model/connection_model');
const { format_date_time } = require('./tool_model'); // 格式化時間

// 全部歷史訂單資料
async function get_purchase_history() {
  try {
    const query = `
          SELECT ph.id, ud.id AS user_id, ph.recipient_name, ph.recipient_phone, ph.recipient_address, pb.brand_name, pdetail.product_name, pdetail.price, sc.quantity, (pdetail.price * sc.quantity) AS subtotal, ph.sum, ph.purchase_status, DATE_FORMAT(ph.create_time, '%Y-%m-%d %H:%i:%s') AS create_time
          FROM purchase_history ph
          JOIN shopping_car sc ON ph.product_id = sc.id
          JOIN product_detail pdetail ON sc.product_id = pdetail.id
          JOIN product_data pdata ON sc.product_id = pdata.id
          JOIN product_brand pb ON pdata.brand_id = pb.id
          JOIN user_data ud ON ph.user_id = ud.id
          ORDER BY ph.id ASC
      `;
    const [results] = await connection.query(query);

    const formatted_results = results.map((history) => {
      history.create_time = format_date_time(history.create_time);
      return history;
    });

    console.log('所有歷史訂單', formatted_results);
  } catch (error) {
    console.error('無法獲取所有歷史訂單:', error);
  }
}

// 使用user_id查找歷史訂單資料  (已完成訂單)
async function use_user_id_get_history(user_id) {
  try {
    // 檢查使用者存在性
    const check_user_query = `
      SELECT id
      FROM user_data
      WHERE id = ?
    `;
    const check_user_values = [user_id];
    const [user_results] = await connection.query(
      check_user_query,
      check_user_values
    );

    if (user_results.length === 0) {
      console.log('無此使用者');
      return false;
    }

    const query = `
      SELECT ph.id, ud.id AS user_id, ph.recipient_name, ph.recipient_phone, ph.recipient_address, pb.brand_name, pdetail.product_name, pdetail.price, ps.us_size, sc.id AS shopping_cart_id, ph.quantity, (pdetail.price * ph.quantity) AS subtotal, ph.sum, ph.purchase_status, DATE_FORMAT(ph.create_time, '%Y-%m-%d %H:%i:%s') AS create_time
      FROM purchase_history ph
      JOIN user_data ud ON ph.user_id = ud.id
      JOIN shopping_car sc ON ph.product_id = sc.id
      JOIN product_detail pdetail ON sc.product_id = pdetail.id
      JOIN product_data pdata ON sc.product_id = pdata.id
      JOIN product_brand pb ON pdata.brand_id = pb.id
      JOIN product_size ps ON sc.size_id = ps.id
      WHERE ph.user_id = ?
      ORDER BY ph.id ASC
    `;
    const [results] = await connection.query(query, [user_id]);

    const formatted_results = results.map((history) => {
      history.create_time = format_date_time(history.create_time);
      return history;
    });

    console.log(`使用者 ${user_id} 的歷史訂單`, formatted_results);
    return formatted_results;
  } catch (error) {
    console.error(`無法獲取使用者 ${user_id} 的歷史訂單:`, error);
    return false;
  }
}

// 全部歷史訂單資料(詳細)
async function get_detailed_purchase_history(user_id) {
  try {
    // 定義 SQL 查詢，獲取歷史訂單的詳細資訊
    const query = `
    SELECT ph.id, ud.id AS user_id, ud.name, ph.recipient_name, ph.recipient_phone, ph.recipient_address, pb.brand_name, pdetail.product_name, ps.us_size AS size, pdetail.price, sc.quantity, (pdetail.price * sc.quantity) AS subtotal, ph.sum, ph.purchase_status, DATE_FORMAT(ph.create_time, '%Y-%m-%d %H:%i:%s') AS create_time
    FROM purchase_history ph
    JOIN shopping_car sc ON ph.product_id = sc.id
    JOIN product_detail pdetail ON sc.product_id = pdetail.id
    JOIN product_data pdata ON sc.product_id = pdata.id
    JOIN product_brand pb ON pdata.brand_id = pb.id
    JOIN product_size ps ON sc.size_id = ps.id
    JOIN user_data ud ON ph.user_id = ud.id
    WHERE ud.id = ?
    ORDER BY ph.create_time ASC
  `;
    // 執行 SQL 查詢並獲取結果
    const [results] = await connection.query(query, [user_id]);

    // 儲存分組後的歷史訂單資料
    const grouped_data = [];
    let current_group = null;

    // 遍歷查詢結果進行分組處理
    results.forEach((item) => {
      const createTime = item.create_time;
      // 如果目前的分組不存在，或者與上一個分組的時間不同，則創建一個新分組
      if (!current_group || current_group.time !== createTime) {
        current_group = {
          id: item.id,
          time: createTime,
          user_id: item.user_id,
          name: item.name,
          recipient_name: item.recipient_name,
          recipient_phone: item.recipient_phone,
          recipient_address: item.recipient_address,
          purchases: [],
          sum: 0,
        };
        // 將新分組加入 grouped_data 陣列
        grouped_data.push(current_group);
      }

      // 將購買項目加入目前的分組中
      current_group.purchases.push({
        brand_name: item.brand_name,
        product_name: item.product_name,
        size: item.size,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        purchase_status: item.purchase_status,
      });

      // 計算目前分組的總金額
      current_group.sum += item.sum;
    });

    // 返回分組後的歷史訂單資料
    return grouped_data;
  } catch (error) {
    // 如果有錯誤發生，輸出錯誤訊息
    console.error('無法獲取所有歷史訂單:', error);
  }
}

// 將 PRRCHASE_HISTORY 總金額更新至 user_data.purchase_CA
async function update_user_CA(user_id, ph_id, sum) {
  try {
    // 更新使用者的 purchase_CA
    const update_query = `
          UPDATE user_data
          SET purchase_CA = purchase_CA + ?
          WHERE id = ?
      `;
    const update_values = [sum, user_id];
    await connection.query(update_query, update_values);

    console.log('使用者的累積消費總額更新成功');
    return true;
  } catch (error) {
    console.error('無法更新使用者的 purchase_CA:', error);
  }
}

// 更新指定 user_id & time 的歷史訂單的 purchase_status
// (顧客僅能提出取消"申請"，故預設為狀態2)1 = 準備中，2 = 審核中，3 = 已取消，4 = 已出貨
async function update_purchase_status(user_id, time) {
  try {
    // 先檢查使用者是否存在
    const check_user_query = `
          SELECT id
          FROM user_data
          WHERE id = ?
      `;
    const [user_results] = await connection.query(check_user_query, [user_id]);

    if (user_results.length === 0) {
      console.log(`使用者 ID ${user_id} 不存在`);
      return false; // 回傳 false 表示使用者不存在
    }

    // 檢查該筆時間的訂單是否存在
    const check_order_query = `
          SELECT id
          FROM purchase_history
          WHERE user_id = ? AND create_time = ?
      `;
    const [order_results] = await connection.query(check_order_query, [
      user_id,
      time,
    ]);

    if (order_results.length === 0) {
      console.log(`使用者 ID ${user_id} 在 ${time} 沒有訂單`);
      return false; // 回傳 false 表示該筆時間的訂單不存在
    }

    // 透過 SQL 查詢找到對應的歷史訂單並更新訂單狀態
    const update_query = `
          UPDATE purchase_history ph
          JOIN user_data ud ON ph.user_id = ud.id
          SET ph.purchase_status = ?
          WHERE ud.id = ? AND ph.create_time = ?
      `;
    await connection.query(update_query, [2, user_id, time]);

    // 回傳成功訊息或其他適當的回饋
    console.log('成功更新訂單狀態');
    return true;
  } catch (error) {
    // 如果有錯誤發生，回傳錯誤訊息
    console.error('無法更新訂單狀態:', error);
    throw error;
  }
}

// 更新使用者等級
async function update_user_grade(user_id) {
  try {
    // 查詢使用者的累積消費總額和等級
    const query = `
          SELECT purchase_CA, grade
          FROM user_data
          WHERE id = ?
      `;
    const [results] = await connection.query(query, [user_id]);
    const user = results[0];

    // 獲取目前的累積消費總額和等級
    const { purchase_CA, grade } = user;

    // 更新等級
    let new_grade = grade;
    if (purchase_CA > 10000) {
      new_grade = Math.min(3, grade + 2);
    } else if (purchase_CA > 5000) {
      new_grade = Math.min(3, grade + 1);
    }

    if (new_grade !== grade) {
      // 如果等級有更新，則執行 SQL 更新等級
      const update_query = `
              UPDATE user_data
              SET grade = ?
              WHERE id = ?
          `;
      const update_values = [new_grade, user_id];
      await connection.query(update_query, update_values);
      console.log('使用者等級更新成功');
      return true;
    } else {
      console.log('使用者等級未變更');
      return false;
    }
  } catch (error) {
    console.error('無法更新使用者等級:', error);
  }
}

module.exports = {
  get_purchase_history,
  use_user_id_get_history,
  update_user_CA,
  update_user_grade,
  update_purchase_status,
  get_detailed_purchase_history,
};
