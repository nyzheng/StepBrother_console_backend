const { connection } = require('../model/connection_model');

// 讀取全部客服QA
async function get_customer_service_QA() {
  try {
    const query = `
      SELECT *  FROM customer_service_qa
      WHERE exist_status = 1
    `;
    const [results] = await connection.query(query);
    console.log('客服問題', results);
    return results;
  } catch (error) {
    console.error('無法讀取客服問題:', error);
  }
}
// get_customer_service_QA()

// 新增客服問題
async function create_customer_service_QA(question, answer) {
  try {
    const query = `
      INSERT INTO customer_service_QA (question,answer)
      VALUES (?,?)
    `;
    const [results] = await connection.query(query, [question, answer]);
    console.log('新增 QA 成功');
    await get_customer_service_QA();
    return results;
  } catch (error) {
    console.error('無法新增客服問題與答案:', error);
  }
}
// create_customer_service_QA(
//   '如果以上沒有你的問題，請與我們聯繫',
//   '業者mail: bowateamb@gmail.com，phone: 0905-725-550。'
// )

// 修改客服問題
async function use_id_update_customer_service_QA(
  QA_id,
  new_question,
  new_answer
) {
  try {
    const updateQuery = `
          UPDATE customer_service_QA
          SET question = ?, answer = ?
          WHERE id = ?
      `;
    const [results] = await connection.query(updateQuery, [
      new_question,
      new_answer,
      QA_id,
    ]);

    if (results.affectedRows > 0) {
      console.log(`已成功修改問題 (ID: ${QA_id}) 的內容`);
      return true; // 修改成功
    }

    console.error(`找不到問題 (ID: ${QA_id}) 或更新失敗`);
    return false; // 修改失败
  } catch (error) {
    console.error('無法修改客服問題:', error);
    return false; // 修改失败
  }
}

module.exports = {
  get_customer_service_QA,
  create_customer_service_QA,
  use_id_update_customer_service_QA,
};
