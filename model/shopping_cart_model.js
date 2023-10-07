const { connection } = require('../model/connection_model');
const purchase_history = require('../model/purchase_history_model');
const tool = require('../model/tool_model');
const product = require('../model/product_data_model');

// 取得全部購物車資料 (shopping_status 為 1 的所有人)
async function get_shoping_car() {
  try {
    const query = `
            SELECT sc.id, sc.user_id, ud.account, pb.brand_name, pdd.product_name, pc.class, pdd.price, ps.us_size, sc.quantity, sc.subtotal, sc.final_price, sc.shopping_status, sc.check_out_status
            FROM shopping_car sc
            JOIN user_data ud ON sc.user_id = ud.id
            JOIN product_data pd ON sc.product_id = pd.id
            JOIN product_brand pb ON pd.brand_id = pb.id
            JOIN product_detail pdd ON pd.detail_id = pdd.id
            JOIN product_size ps ON sc.size_id = ps.id
            JOIN product_class pc ON pd.class_id = pc.id -- 新增 product_class 的連接
            WHERE sc.shopping_status = 1 -- 只顯示 shopping_status 為 1 的資料
            ORDER BY sc.id ASC
        `;
    const [results] = await connection.query(query);

    if (results.length === 0) {
      console.log('目前無人添加商品');
    } else {
      console.log('所有購物車資料', results);
    }

    return results; // 增加 return 以便其他地方使用購物車資料
  } catch (error) {
    console.error('無法獲取購物車資料:', error);
    return []; // 錯誤時回傳空陣列
  }
}

// 將商品加入購物車
async function create_shopping_cart(user_id, product_id, size_id, quantity) {
  try {
    // 檢查使用者存在性
    const is_user_exist = await tool.check_user_existence(user_id);

    if (!is_user_exist) {
      console.error('無此使用者，新增失敗');
      return false;
    }

    const get_price_query = `
            SELECT pdd.price
            FROM product_data pd
            JOIN product_detail pdd ON pd.detail_id = pdd.id
            WHERE pd.id = ?
        `;
    const get_price_values = [product_id];
    const [price_results] = await connection.query(
      get_price_query,
      get_price_values
    );

    if (price_results.length === 0) {
      console.error('找不到產品價格');
      return false;
    }

    const price = price_results[0].price;
    const subtotal = price * quantity;

    // 取得使用者等級並計算折扣後價格
    const user_grade = await tool.get_user_grade(user_id);
    let discount_rate = 1; // 預設不打折

    if (user_grade === 2) {
      // 使用者等級為 2，打 95 折
      discount_rate = 0.95;
    } else if (user_grade === 3) {
      // 使用者等級為 3，打 9 折
      discount_rate = 0.9;
    }

    const final_price = subtotal * discount_rate;

    // 檢查購物車是否已有相同商品
    const check_car_query = `
            SELECT id, quantity, shopping_status
            FROM shopping_car
            WHERE user_id = ? AND product_id = ? AND size_id = ? AND shopping_status = 1
        `;
    const check_car_values = [user_id, product_id, size_id];
    const [car_results] = await connection.query(
      check_car_query,
      check_car_values
    );

    if (car_results.length > 0) {
      const existing_quantity = car_results[0].quantity;
      const new_quantity = existing_quantity + quantity;
      const new_subtotal = price * new_quantity;
      const new_final_price = new_subtotal * discount_rate;

      // 直接更新購物車數量和價格
      const update_query = `
                UPDATE shopping_car
                SET quantity = ?,
                    subtotal = ?,
                    final_price = ?
                WHERE user_id = ? AND product_id = ? AND size_id = ? AND shopping_status = 1
            `;
      const update_values = [
        new_quantity,
        new_subtotal,
        new_final_price,
        user_id,
        product_id,
        size_id,
      ];

      await connection.query(update_query, update_values);
      console.log('購物車資料已更新');
      await get_user_data_from_shopping_cart(user_id);
      return true;
    }

    // 購物車沒有相同商品或 shopping_status 不為 1，新增資料
    const insert_query = `
            INSERT INTO shopping_car (user_id, product_id, size_id, quantity, price, subtotal, final_price)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
    const insert_values = [
      user_id,
      product_id,
      size_id,
      quantity,
      price,
      subtotal,
      final_price,
    ];

    await connection.query(insert_query, insert_values);
    console.log('購物車資料已新增');
    await get_user_data_from_shopping_cart(user_id);
    return true;
  } catch (error) {
    console.error('無法新增購物車資料:', error);
    // 添加失敗的日誌訊息
    console.log('購物車資料新增失敗');
    return false;
  }
}
// create_shopping_cart(9,1,1,5)

// 異動購物車數量
async function change_the_number_of_shopping_carts(
  user_id,
  shopping_cart_id,
  new_quantity
) {
  try {
    const select_query = `
            SELECT sc.quantity, sc.price
            FROM shopping_car sc
            JOIN product_data pd ON sc.product_id = pd.id
            JOIN product_detail pdd ON pd.detail_id = pdd.id
            WHERE sc.id = ? AND sc.user_id = ? AND sc.shopping_status = 1
        `;

    const select_values = [shopping_cart_id, user_id];
    const [select_results] = await connection.query(
      select_query,
      select_values
    );

    if (select_results.length === 0) {
      console.error(
        '找不到符合指定的購物車項目，或該項目的 shopping_status 不為 1'
      );
      return false;
    }

    if (new_quantity < 0) {
      console.error('商品數量不能小於0，更新失敗');
      return false;
    }

    const price = select_results[0].price;
    const subtotal = price * new_quantity;

    // 取得使用者等級並計算折扣後價格
    const user_grade = await tool.get_user_grade(user_id);
    let discount_rate = 1; // 預設不打折

    if (user_grade === 2) {
      // 使用者等級為 2，打 95 折
      discount_rate = 0.95;
    } else if (user_grade === 3) {
      // 使用者等級為 3，打 9 折
      discount_rate = 0.9;
    }

    const final_price = subtotal * discount_rate;
    const shopping_status = new_quantity === 0 ? 0 : 1;

    const update_query = `
            UPDATE shopping_car
            SET quantity = ?,
                subtotal = ?,
                final_price = ?,
                shopping_status = ?
            WHERE id = ? AND user_id = ?
        `;

    const update_values = [
      new_quantity,
      subtotal,
      final_price,
      shopping_status,
      shopping_cart_id,
      user_id,
    ];
    await connection.query(update_query, update_values);

    console.log('購物車數量已更新');

    if (new_quantity === 0) {
      await delete_shopping_data_by_user_id(user_id, shopping_cart_id);
      console.log('購物車商品數量為0，將 shopping_status 改為 0');
    }

    await get_user_data_from_shopping_cart(user_id);
    return true;
  } catch (error) {
    console.error('無法更新購物車資料:', error);
    // 添加失敗的日誌訊息
    console.log('購物車資料更新失敗');
    return false;
  }
}

//! 尋找使用者已加入購物車的商品  --------------------------------

// 使用 user_id 篩選該使用者已加入購物車的商品
async function get_user_data_from_shopping_cart(user_id) {
  try {
    // 使用使用者 ID 查詢購物車資料
    const query = `
      SELECT 
        sc.id, 
        ud.id AS user_id, 
        ud.account, 
        sc.product_id, 
        pb.brand_name, 
        pdd.product_name, 
        pc.class,
        ps.us_size, 
        pdd.price, 
        sc.quantity, 
        sc.subtotal,
        sc.final_price,
        sc.shopping_status, 
        sc.check_out_status
      FROM shopping_car sc
      JOIN user_data ud ON sc.user_id = ud.id
      JOIN product_data pd ON sc.product_id = pd.id
      JOIN product_brand pb ON pd.brand_id = pb.id
      JOIN product_detail pdd ON pd.detail_id = pdd.id
      JOIN product_size ps ON sc.size_id = ps.id
      JOIN product_class pc ON pd.class_id = pc.id
      WHERE sc.user_id = ? AND sc.shopping_status = 1
      ORDER BY sc.id ASC
    `;
    const [results] = await connection.query(query, [user_id]);

    if (results.length == 0) {
      console.log(`使用者 id ${user_id} 的購物車內沒有商品`);
      return false;
    }

    console.log(`使用者 id ${user_id} 的購物車資料`, results);
    product_total_in_shopping_cart(user_id);
    return results;
  } catch (error) {
    console.error('無法獲取使用者的購物車資料:', error);
    throw error;
  }
}
// get_user_data_from_shopping_cart(8)

// 使用 user_id 取得購物車 id
async function get_user_shopping_cart_id(user_id) {
  try {
    const all_car = await get_user_data_from_shopping_cart(user_id);
    if (!all_car) return false;

    const car_ids = all_car.map((cart) => cart.id);
    return car_ids;
  } catch (error) {
    console.error('獲取使用者購物車 ID 時發生錯誤:', error);
    throw error;
  }
}

// 計算該使用者購物車中商品總額，並自動抓取使用者等級
async function product_total_in_shopping_cart(user_id) {
  try {
    // 查詢該使用者的購物車中商品總額
    const query_total = `
            SELECT SUM(subtotal) AS total
            FROM shopping_car
            WHERE user_id = ? AND shopping_status = 1
        `;
    const [results_total] = await connection.query(query_total, [user_id]);

    if (results_total.length === 0) {
      console.log('使用者的購物車資料為空');
      return 0; // 若無購物車資料，回傳 0 元
    }

    const total = results_total[0].total || 0; // 若 total 為 null，則設定為 0

    // 查詢該使用者的等級
    const user_grade = await tool.get_user_grade(user_id);

    // 計算所有購物車項目的 final_price 總和，以及所有 subtotal 總和
    const query_cart_totals = `
            SELECT SUM(final_price) AS final_total, SUM(subtotal) AS original_total
            FROM shopping_car
            WHERE user_id = ? AND shopping_status = 1
        `;
    const [results_cart_totals] = await connection.query(query_cart_totals, [
      user_id,
    ]);
    const final_total = parseFloat(results_cart_totals[0].final_total) || 0;
    const original_total =
      parseFloat(results_cart_totals[0].original_total) || 0;

    // 輸出計算結果
    console.log(
      `使用者 id ${user_id} 等級 ${user_grade} 購物車中的最終金額為: ${final_total} 元 (原始金額: ${original_total} 元)`
    );
    return { final_total, original_total };
  } catch (error) {
    console.error('無法計算購物車中的最終金額:', error);
    return 0; // 錯誤時回傳 0 元
  }
}

// 使用user_id 篩選已完成的訂單
async function user_completed_order_list(user_id) {
  try {
    const query = `
            SELECT sc.id AS shopping_cart_id, ud.id AS user_id, ud.account, sc.product_id, pb.brand_name, pdd.product_name, ps.us_size, pdd.price,  sc.quantity, sc.subtotal, sc.final_price, sc.shopping_status, sc.check_out_status
            FROM shopping_car sc
            JOIN user_data ud ON sc.user_id = ud.id
            JOIN product_data pd ON sc.product_id = pd.id
            JOIN product_brand pb ON pd.brand_id = pb.id
            JOIN product_detail pdd ON pd.detail_id = pdd.id
            JOIN product_size ps ON sc.size_id = ps.id
            WHERE sc.user_id = ? AND sc.check_out_status = 1
            ORDER BY sc.id ASC
        `;
    const [results] = await connection.query(query, [user_id]);
    console.log(`使用者 id ${user_id} 的已完成訂單列表`, results);
  } catch (error) {
    console.error('無法獲取使用者的已完成訂單列表:', error);
  }
}

// 刪除購物車資料 (軟刪除，將shopping_status 改為 0)
async function delete_shopping_data_by_user_id(user_id, shopping_cart_id) {
  try {
    // 檢查購物車是否屬於指定的使用者
    const check_car_query = `
            SELECT id, user_id
            FROM shopping_car
            WHERE id = ? AND user_id = ? AND shopping_status = 1
        `;
    const check_car_values = [shopping_cart_id, user_id];
    const [car_results] = await connection.query(
      check_car_query,
      check_car_values
    );

    if (car_results.length === 0) {
      console.error(
        '找不到符合指定的購物車項目，或該項目的 shopping_status 不為 1'
      );
      return false;
    }

    // 更新指定的購物車項目的 shopping_status 為 0
    const update_query = `
            UPDATE shopping_car
            SET shopping_status = 0
            WHERE id = ?
        `;
    await connection.query(update_query, [shopping_cart_id]);
    console.log(
      `已將購物車第 ${shopping_cart_id} 筆購物車資料的 shopping_status 改為 0`
    );

    await get_user_data_from_shopping_cart(user_id);
    return true;
  } catch (error) {
    console.error('更新購物車資料時發生錯誤:', error);
    return false;
  }
}

//! 結帳過程 ----------------------------------------------------

// 結帳功能
async function checkout_shopping_cart(
  user_id,
  recipient_name,
  recipient_phone,
  recipient_address,
  shopping_cart_ids
) {
  const conn = await connection.getConnection();
  try {
    // 開始事務
    await conn.beginTransaction();
    const ids_array = Array.isArray(shopping_cart_ids)
      ? shopping_cart_ids
      : [shopping_cart_ids];

    for (const shopping_cart_id of ids_array) {
      // 取得購物車資料
      const get_shopping_cart_query = `
                SELECT sc.quantity, sc.price, sc.final_price, (sc.price * sc.quantity) AS subtotal, sc.product_id, sc.size_id
                FROM shopping_car sc
                WHERE sc.user_id = ? AND sc.id = ? AND sc.shopping_status = 1
            `;
      const [shopping_cart_results] = await connection.query(
        get_shopping_cart_query,
        [user_id, shopping_cart_id]
      );

      if (shopping_cart_results.length === 0) {
        console.error(
          `找不到購物車 ID 為 ${shopping_cart_id} 的資料或購物車狀態不正確`
        );
        continue; // 跳過處理此購物車，繼續處理下一筆
      }

      const shopping_cart = shopping_cart_results[0];
      const { quantity, price, subtotal, final_price, product_id, size_id } =
        shopping_cart;

      // 檢查商品庫存是否足夠
      const available_stock =
        await product.get_single_product_single_size_stock_quantity(
          product_id,
          size_id
        );
      if (
        available_stock.length === 0 ||
        available_stock[0].stock_quantity < quantity
      ) {
        console.error(
          `商品庫存不足 (商品ID: ${product_id} 尺寸ID: ${size_id})`
        );
        return false; // 結帳失敗
      }

      // 將購物車資料寫入歷史訂單
      const insert_purchase_history_query = `
                INSERT INTO purchase_history (user_id, recipient_name, recipient_phone, recipient_address, product_id, quantity, sum, subtotal)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
      const sum = final_price; // 使用 final_price 作為 sum

      const [insert_result] = await connection.query(
        insert_purchase_history_query,
        [
          user_id,
          recipient_name,
          recipient_phone,
          recipient_address,
          shopping_cart_id,
          quantity,
          sum,
          shopping_cart.subtotal, // 使用计算得到的 subtotal 值
        ]
      );

      // 取得插入的購物車歷史訂單的ID
      const ph_id = insert_result.insertId;

      console.log(
        `結帳成功，已成功寫入歷史訂單 (購物車 ID: ${shopping_cart_id})`
      );

      // 修改購物車狀態
      await change_shopping_cart_status(user_id, shopping_cart_id);

      // // 更新使用者的 purchase_CA，傳入 ph_id 參數
      // await purchase_history.update_user_CA(user_id, ph_id, sum);

      // // 更新使用者等級
      // await purchase_history.update_user_grade(user_id);

      // 更新商品库存
      const update_stock_success = await product.update_product_stock(
        product_id,
        size_id,
        quantity
      );

      // 检查库存更新是否成功
      if (!update_stock_success) {
        console.error(
          `更新商品庫存失敗，結帳失敗 (購物車 ID: ${shopping_cart_id})`
        );
        return false; // 结账失败
      }
    }

    // 提交事務
    await conn.commit();

    // 寫入成功
    return true;
  } catch (error) {
    // 如果有錯誤發生，輸出錯誤訊息，回滾事務
    console.error('寫入歷史訂單時發生錯誤:', error);
    await conn.rollback();
    return false;
  } finally {
    // 無論成功或失敗，最終都要釋放連線
    conn.release();
  }
}
// create_purchase_history_array(9, '20230810_test', '0973506316', '一路', [13])

// 改購物車的 shopping_status 的狀態
async function change_shopping_cart_status(user_id, shopping_cart_id) {
  try {
    const update_query = `
      UPDATE shopping_car
      SET shopping_status = 0, check_out_status = 1
      WHERE id = ? AND user_id = ?
    `;
    const update_values = [shopping_cart_id, user_id];

    await connection.query(update_query, update_values);
    console.log('購物車狀態更新成功');
    return;
  } catch (error) {
    console.error('無法更新購物車狀態:', error);
  }
}

module.exports = {
  get_shoping_car,
  create_shopping_cart,
  change_the_number_of_shopping_carts,
  get_user_data_from_shopping_cart,
  product_total_in_shopping_cart,
  user_completed_order_list,
  delete_shopping_data_by_user_id,
  get_user_shopping_cart_id,
  checkout_shopping_cart,
  change_shopping_cart_status,
};
