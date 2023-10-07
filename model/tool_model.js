const { connection } = require('../model/connection_model');
const jwt = require('jsonwebtoken'); //JWT模組

//! token -----------------------------

// 創建token
function make_token(payload, expiresIn) {
  // expiresIn表示Token的有效期，可以是數字（秒數）或字符串（例如："1d", "2h", "7d"等）
  return jwt.sign(payload, 'Bowa-Team-B', { expiresIn });
}

// 驗證 token
function verify_token(token) {
  try {
    const decodedToken = jwt.verify(token, 'Bowa-Team-B');
    return decodedToken;
  } catch (err) {
    console.log('驗證失敗或Token已過期');
    return null;
  }
}

//! time -----------------------------

// 格式化時間
function format_date_time(dateTime) {
  // 函式用於將日期時間格式化為指定格式
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const formatted_date_time = new Date(dateTime).toLocaleString(
    'zh-TW',
    options
  );
  // 使用指定的區域語言 'zh-TW' 和選項格式化日期時間
  return formatted_date_time;
}

// 格式化時間(無時分秒)
function format_birthday_time(dateTime) {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };
  const formatted_date_time = new Date(dateTime).toLocaleString(
    'zh-TW',
    options
  );
  // 使用指定的區域語言 'zh-TW' 和選項格式化日期時間
  return formatted_date_time;
}

//! SQL table  -----------------------------

// 取得指定資料表的資料
async function get_table(table_name) {
  try {
    const query = `SELECT * FROM ${table_name}`;
    const [results] = await connection.query(query);

    if (
      results.length > 0 &&
      'create_time' in results[0] &&
      'update_time' in results[0]
    ) {
      const formatted_results = results.map((row) => {
        row.create_time = format_date_time(row.create_time);
        row.update_time = format_date_time(row.update_time);
        return row;
      });

      console.log(`讀取 ${table_name} 資料表的資料`, formatted_results);
      return formatted_results;
    } else {
      console.log(`讀取 ${table_name} 資料表的資料`, results);
      return results;
    }
  } catch (error) {
    console.error(`無法讀取 ${table_name} 資料表的資料:`, error);
  }
}

// 刪除指定table
async function drop_table(table_name) {
  try {
    const dropQuery = `DROP TABLE IF EXISTS \`${table_name}\`;`;
    await connection.query(dropQuery);
    console.log(`資料表 ${table_name} 已成功刪除`);
  } catch (error) {
    console.error(`刪除資料表 ${table_name} 時發生錯誤:`, error);
    throw error;
  }
}

//! search -----------------------------

//? 
// 產品模糊搜尋 (品牌名或產品名)
async function vague_search_database(product_keyword) {
  try {
    const query = `
      SELECT pd.id, pb.brand_name, pdd.product_name, pdd.price, pc.class, pd.product_data_status
      FROM product_data pd
      JOIN product_brand pb ON pd.brand_id = pb.id
      JOIN product_detail pdd ON pd.detail_id = pdd.id
      JOIN product_class pc ON pd.class_id = pc.id
      WHERE (pb.brand_name LIKE ? OR pdd.product_name LIKE ?) AND pd.product_data_status = 1
    `;

    const [results] = await connection.query(query, [
      `%${product_keyword}%`,
      `%${product_keyword}%`,
    ]);

    if (results.length === 0) {
      console.log('尚未搜尋到符合的產品資料');
      return false;
    }

    console.log('成功取得符合搜尋的產品資料！');
    console.log(results);
    return results;
  } catch (error) {
    console.error('無法進行模糊搜尋:', error);
    return false;
  }
}


// 訂單區間搜尋
// 1 = 準備中，2 = 審核中，3 = 已取消，4 = 已出貨
async function get_orders_in_interval(start_date, end_date, purchase_status) {
  try {
    const start_date_time = new Date(start_date + ' 00:00:00');
    const end_date_time = new Date(end_date + ' 23:59:59');

    let status_condition = '';
    if (purchase_status !== undefined) {
      status_condition = 'AND purchase_status = ?';
    }

    const query = `
            SELECT id, user_id, recipient_name, recipient_phone, recipient_address, product_id, quantity, subtotal, sum, purchase_status, create_time
            FROM purchase_history
            WHERE create_time BETWEEN ? AND ?
            ${status_condition}
        `;

    const query_params =
      purchase_status !== undefined
        ? [start_date_time, end_date_time, purchase_status]
        : [start_date_time, end_date_time];

    const [results] = await connection.query(query, query_params);

    console.log(`區間 ${start_date} 至 ${end_date} 的訂單資料：`);
    console.log(results);
    return results;
  } catch (error) {
    console.error('取得訂單資料失敗：', error);
    return [];
  }
}

//! user  -----------------------------

// 取得該使用者的等級
async function get_user_grade(user_id) {
  try {
    // 查詢使用者等級
    const query_grade = `
            SELECT grade
            FROM user_data
            WHERE id = ?
        `;
    const [results_grade] = await connection.query(query_grade, [user_id]);

    if (results_grade.length === 0) {
      console.log(`找不到使用者 id ${user_id} 的等級`);
      return false;
    }

    const user_grade = results_grade[0].grade || 1; // 若 user_grade 為 null，則預設為 1

    // 定義等級對應的折扣
    const discount_map = {
      1: '不打折',
      2: '打 9.5 折',
      3: '打 9 折',
    };

    console.log(
      `使用者 id ${user_id} 的等級為: ${user_grade}，${discount_map[user_grade]}。`
    );

    return user_grade;
  } catch (error) {
    console.error(`無法取得使用者 id ${user_id} 的等級:`, error);
    return false; // 錯誤時回傳 false
  }
}

// 檢查使用者是否存在
async function check_user_existence(user_id) {
  try {
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
      console.error('無此使用者，新增失敗');
      return false;
    }

    return true; // 使用者存在
  } catch (error) {
    console.error('檢查使用者存在性時發生錯誤:', error);
    return false;
  }
}

// 清除所有使用者登入狀態 (將所有使用者 login_status 改成 0)
async function delete_all_user_status() {
  try {
    const update_query = 'UPDATE user_data SET login_status = 0;';
    await connection.query(update_query);
    console.log('所有使用者的登入狀態已清除，login_status 被設為 0');
    return true;
  } catch (error) {
    console.error('清除使用者登入狀態時發生錯誤:', error);
    return false;
  }
}

// 時間到清除單一使用者登入狀態(將單一使用者 login_status 改成 0)
// 刪除單一使用者的登入狀態，將其在指定時間後改為未登入狀態
async function delete_single_user_status(id, time_in_seconds) {
  try {
    console.log(`使用者 ${id} 的登入狀態在 ${time_in_seconds} 秒後改成 0`);

    // 建立一個等待函式，讓後續的程式暫停指定秒數
    const sleep = (seconds) =>
      new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    // 等待指定時間
    await sleep(time_in_seconds);

    // 執行更新查詢，將指定使用者的登入狀態改為未登入
    const update_query = `UPDATE user_data SET login_status = 0 WHERE id = ?;`;
    await connection.query(update_query, [id]);
    console.log(`使用者 ${id} 的登入狀態已設定為 0`);
    return true; // 回傳 true 表示更新成功
  } catch (error) {
    // 如果有錯誤，捕獲錯誤並顯示錯誤訊息
    console.error(`修改使用者 ${id} 登入狀態時發生錯誤:`, error);
    return false; // 回傳 false 表示更新失敗
  }
}

module.exports = {
  make_token,
  verify_token,
  format_date_time,
  format_birthday_time,
  get_table,
  get_user_grade,
  check_user_existence,
  drop_table,
  delete_all_user_status,
  delete_single_user_status,
  vague_search_database,
  get_orders_in_interval,
};
