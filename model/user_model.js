const { connection } = require('../model/connection_model');
const { format_date_time } = require('./tool_model'); // 格式化時間

// 註冊 (帳號、電話、郵件不能重複)
async function register_user(account, password, name, phone, mail) {
  try {
    // 檢查帳號是否已存在
    const account_check_query = `
          SELECT COUNT(*) AS count
          FROM user_data
          WHERE account = ?
      `;
    const [account_check_results] = await connection.query(
      account_check_query,
      [account]
    );
    const account_count = account_check_results[0].count;

    if (account_count > 0) {
      console.log('帳號已存在，註冊失敗');
      return false;
    }

    // 檢查電話是否已存在
    const phone_check_query = `
          SELECT COUNT(*) AS count
          FROM user_data
          WHERE phone = ?
      `;
    const [phone_check_results] = await connection.query(phone_check_query, [
      phone,
    ]);
    const phone_count = phone_check_results[0].count;

    if (phone_count > 0) {
      console.log('電話已存在，註冊失敗');
      return false;
    }

    // 檢查電子郵件是否已存在
    const mail_check_query = `
          SELECT COUNT(*) AS count
          FROM user_data
          WHERE mail = ?
      `;
    const [mail_check_results] = await connection.query(mail_check_query, [
      mail,
    ]);
    const mail_count = mail_check_results[0].count;

    if (mail_count > 0) {
      console.log('電子郵件已存在，註冊失敗');
      return false;
    }

    // 執行註冊
    const insert_query = `
          INSERT INTO user_data (account, password, name, phone, mail)
          VALUES (?, ?, ?, ?, ?)
      `;
    const insert_values = [account, password, name, phone, mail];

    await connection.query(insert_query, insert_values);
    console.log('註冊成功');
    await use_account_get_user_data(account)
    return true;
  } catch (error) {
    console.error('註冊時發生錯誤:', error);
    return false;
  }
}
// register_user('20230810-2','20230810-2','20230810-2','20230810-2','20230810-2')

// 取得所有使用者資料(retuen 陣列)
async function get_user_data() {
  try {
    const [results] = await connection.query('SELECT * FROM `user_data`');

    const formatted_results = results.map((user_data) => {
      user_data.create_time = format_date_time(user_data.create_time);
      user_data.update_time = format_date_time(user_data.update_time);
      return user_data;
    });
    console.log('使用者資料', formatted_results);
    return formatted_results; // 回傳格式化後的結果
    // 如果前端不需要格式化時間則 return results
  } catch (error) {
    console.error('無法獲取使用者資料:', error);
    throw error; // 拋出錯誤以供呼叫者處理
  }
}

// 使用 user_id 尋找使用者資料
async function use_id_get_user_data(id) {
  try {
    const query = `SELECT * FROM user_data WHERE id = ?`;
    const values = [id];

    const [results] = await connection.query(query, values);
    const formatted_results = results.map((user_data) => {
      user_data.create_time = format_date_time(user_data.create_time);
      user_data.update_time = format_date_time(user_data.update_time);
      return user_data;
    });
    console.log('使用者資料', formatted_results);
    return formatted_results; // 回傳格式化後的結果
    // 如果前端不需要格式化時間則 return results
  } catch (error) {
    console.error('無法獲取使用者資料:', error);
    throw error; // 拋出錯誤以供呼叫者處理
  }
}

// 使用 user_account 尋找使用者資料
async function use_account_get_user_data(account) {
  try {
    const query = `SELECT * FROM user_data WHERE account = ?`;
    const values = [account];

    const [results] = await connection.query(query, values);

    if (results && results.length > 0) {
      const formatted_results = results.map((user_data) => {
        user_data.create_time = format_date_time(user_data.create_time);
        user_data.update_time = format_date_time(user_data.update_time);
        return user_data;
      });
      console.log('使用者資料', formatted_results);
      return formatted_results;
    } else {
      // 如果找不到，返回一個空數組
      return [];
    }
  } catch (error) {
    console.error('無法獲取使用者資料:', error);
    return [];
  }
}

// 修改會員資料 (用 user_id 找，電話、電郵其一不能跟別人相同***********)
async function update_user_data(user_id, password, phone, mail) {
  try {
    // 檢查電話或郵件是否已經被其他會員使用
    const check_query = `
          SELECT id
          FROM user_data
          WHERE (phone = ? OR mail = ?) AND id <> ?
      `;
    const check_values = [phone, mail, user_id];
    const [checkResults] = await connection.query(check_query, check_values);

    if (checkResults.length > 0) {
      console.log('電話或郵件已被其他會員使用，無法更新資料');
      return false;
    }

    const update_query = `
          UPDATE user_data
          SET password = ?, phone = ?, mail = ?, update_time = NOW()
          WHERE id = ?
      `;
    const update_values = [password, phone, mail, user_id];

    await connection.query(update_query, update_values);
    console.log('資料更新成功');
    use_id_get_user_data(user_id);
    return true;
  } catch (error) {
    console.error('無法更新資料:', error);
    return false;
  }
}

// 登入 (將 login_status 改成 1)
async function login(user_account, password) {
  try {
    const [results] = await connection.query(
      'SELECT * FROM `user_data` WHERE `account` = ? AND `password` = ?;',
      [user_account, password]
    );

    if (results.length === 0) {
      console.log('帳號或密碼錯誤');
      return null;
    }

    const user = results[0];
    user.create_time = format_date_time(user.create_time);
    user.update_time = format_date_time(user.update_time);

    if (user.login_status === 1) {
      console.log('該使用者已登入');
      return false;
    }

    // 修改 login_status 為 1
    const update_result = await connection.query(
      'UPDATE `user_data` SET `login_status` = 1 WHERE `id` = ?;',
      [user.id]
    );

    console.log('登入成功');
    return user;
  } catch (error) {
    console.error('登入時發生錯誤:', error);
    throw error;
  }
}

// 使用 user_id 登出 (將 login_status 改成 0)
async function logout(user_id) {
  try {
    // 檢查使用者是否存在
    const [results] = await connection.query(
      'SELECT * FROM `user_data` WHERE `id` = ?;',
      [user_id]
    );

    if (results.length === 0) {
      console.log('使用者不存在');
      return false;
    }

    const user = results[0];
    if (user.login_status === 0) {
      console.log('該使用者已登出');
      return false;
    }

    // 修改 login_status 為 0
    const update_result = await connection.query(
      'UPDATE `user_data` SET `login_status` = 0 WHERE `id` = ?;',
      [user_id]
    );

    console.log('登出成功');
    return true;
  } catch (error) {
    console.error('登出時發生錯誤:', error);
    throw error;
  }
}

// 使用 user_account 登出
async function use_account_logout(user_account) {
  try {
    // 修改 login_status 為 0
    const update_result = await connection.query(
      'UPDATE `user_data` SET `login_status` = 0 WHERE `account` = ?;',
      [user_account]
    );

    if (update_result.affectedRows === 0) {
      console.log('找不到使用者或該使用者已登出');
      return false;
    }

    console.log(`${user_account} 已登出`);
    return true;
  } catch (error) {
    console.error('使用帳號登出時發生錯誤:', error);
    throw error;
  }
}

module.exports = {
  register_user,
  get_user_data,
  use_id_get_user_data,
  use_account_get_user_data,
  update_user_data,
  login,
  logout,
  use_account_logout,
};
