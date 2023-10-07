const automatic_mail = require('../model/mail_model');
const user_data = require('../model/user_model');
const shopping = require('../model/shopping_cart_model');
const tool = require('../model/tool_model');
const history = require('../model/purchase_history_model');

//新增至購物車 pass
async function add_to_car(req, res) {
  const id_card = tool.verify_token(req.header.Authorization);
  if (id_card === null) {
    return res.json({ login_state: false });
  }
  try {
    const user = id_card.id;
    const product = req.params.id;
    const size = req.body.product_size;
    const quantity = req.body.quantity;

    // 在資料庫中創建購物車項目
    const result = await shopping.create_shopping_cart(
      user,
      product,
      size,
      quantity
    );

    // 判斷結果
    if (!result) {
      res.json({ add_to_cart: false });
    } else {
      res.json({ add_to_cart: true });
    }
  } catch (error) {
    console.error('新增至購物車時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

// 指定購物車商品數量異動
async function update_quantity(req, res) {
  const id_card = tool.verify_token(req.header.Authorization);
  try {
    const user = id_card.id;
    const product = req.body.shopping_car_id;
    const quantity = req.body.quantity;

    // 在資料庫中異動購物車項目
    const new_quantity = await shopping.change_the_number_of_shopping_carts(
      user,
      product,
      quantity
    );

    // 判斷結果
    if (!new_quantity) {
      res.json({ update_cart: false });
    } else {
      const now_user_data = await user_data.use_id_get_user_data(user);
      const grade = now_user_data[0].grade;
      const shopping_cart = await shopping.get_user_data_from_shopping_cart(
        user
      );
      //折扣後金額
      const shopping_cart_sum = await shopping.product_total_in_shopping_cart(
        user
      );

      res.json({ grade, shopping_cart, shopping_cart_sum });
    }
  } catch (error) {
    console.error('異動購物車時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

//指定刪除購物車商品
async function delete_car_product(req, res) {
  const id_card = tool.verify_token(req.header.Authorization);
  try {
    const user_id = id_card.id;
    const car_id = req.body.shopping_car_id;

    // 在資料庫中根據用戶ID和購物車ID刪除商品資料
    const delete_result = await shopping.delete_shopping_data_by_user_id(
      user_id,
      car_id
    );
    console.log('刪除結果：', delete_result);
    const user = await user_data.use_id_get_user_data(user_id);
    const grade = user[0].grade;
    const shopping_cart = await shopping.get_user_data_from_shopping_cart(
      id_card.id
    );
    const shopping_cart_sum = await shopping.product_total_in_shopping_cart(
      user_id
    );
    const result = { grade, shopping_cart, shopping_cart_sum };
    console.log(result);
    // 判斷結果
    if (!delete_result) {
      res.json({ delete_product: false });
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('刪除購物車商品時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

//取消訂單
async function cancel_order(req, res) {
  const id_card = tool.verify_token(req.header.Authorization);
  try {
    if (id_card == null) {
      return res.json({ login_status: false });
    }
    const user_id = id_card.id;
    const time = req.body.time;
    const order_switch = await history.update_purchase_status(user_id, time);
    return res.json({ cancel_result: true });
  } catch (error) {
    console.error('取消時發生錯誤：', error);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

//送出訂單購買 pass
async function buy_car_product(req, res) {
  const id_card = tool.verify_token(req.header.Authorization);
  try {
    if (id_card == null) {
      return res.json({ login_status: false });
    }
    const user_id = id_card.id;
    const recipientData = req.body;
    const name = req.body.recipient_name;
    const phone = req.body.recipient_phone;
    const address = req.body.recipient_address;

    //獲取該帳號資料
    const ordering_person_data = await user_data.use_id_get_user_data(user_id);

    // 獲取購物車ID
    const shopping_car_id = await shopping.get_user_shopping_cart_id(user_id);
    if (!shopping_car_id) {
      res.json({ order_result: false });
      return;
    }

    // 從購物車中獲取商品資料
    const carData = await shopping.get_user_data_from_shopping_cart(user_id);

    // 在資料庫中創建購買紀錄
    const record_result = await shopping.checkout_shopping_cart(
      user_id,
      name,
      phone,
      address,
      shopping_car_id
    );
    console.log(record_result);
    // 判斷結果並回應
    if (!record_result) {
      res.json({ order_result: false });
    } else {
      // 成功創建購買紀錄後，發送購物車資料至信箱
      const discount_price = shopping.product_total_in_shopping_cart(user_id);
      const mailResult = automatic_mail.send_shopping_mail(
        carData,
        recipientData,
        ordering_person_data[0],
        discount_price.shopping_cart_sum
      );
      res.json({ order_result: true });
    }
  } catch (error) {
    console.error('購物車商品結帳時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

// bowateamb@gmail.com
// teamb0701

module.exports = {
  add_to_car,
  update_quantity,
  delete_car_product,
  buy_car_product,
  cancel_order,
};
