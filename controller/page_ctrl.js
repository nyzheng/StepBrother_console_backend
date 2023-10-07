const product_data = require('../model/product_data_model');
const user_data = require('../model/user_model');
const purchase_history = require('../model/purchase_history_model');
const shopping_car = require('../model/shopping_cart_model');
const service = require('../model/service_question_model');
const tool = require('../model/tool_model');

// 首頁 pass
async function home_page(req, res) {
  try {
    // 獲取所有商品的資料
    const all_product = await product_data.get_product_data();
    res.json(all_product);
  } catch (error) {
    console.error('處理首頁請求時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

//男鞋 pass
async function man_page(req, res) {
  try {
    const man = await product_data.use_class_id_get_product(1);
    res.json(man);
  } catch (error) {
    console.error('處理類別商品列表請求時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

//女鞋 pass
async function woman_page(req, res) {
  try {
    const woman = await product_data.use_class_id_get_product(2);
    res.json(woman);
  } catch (error) {
    console.error('處理類別商品列表請求時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

//童鞋 pass
async function kid_page(req, res) {
  try {
    const kid = await product_data.use_class_id_get_product(3);
    res.json(kid);
  } catch (error) {
    console.error('處理類別商品列表請求時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

//單品介紹 pass
async function product_page(req, res) {
  try {
    const id = req.params.id;
    const product = await product_data.use_product_id_get_product(id);
    const size_stock = await product_data.get_single_product_stock(id);
    const product_result = product[0];
    const only =
      await product_data.get_single_product_single_size_stock_quantity(id, 7);
    console.log(only);
    const result = { ...product_result, size_stock };
    if (product && product.length > 0) {
      // 回傳找到的商品詳細資訊
      res.json(result);
    } else {
      // 若未找到相應的商品，回傳404錯誤
      res.status(404).json({ error: '找不到該商品。' });
    }
  } catch (error) {
    console.error('處理商品詳細資訊請求時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

// 會員中心  pass //
async function user_page(req, res) {
  const id_card = tool.verify_token(req.header.Authorization);
  console.log('目前使用憑證為：' + id_card);
  try {
    if (id_card) {
      const user = await user_data.use_id_get_user_data(id_card.id);
      res.json(user[0]);
    } else {
      res.json({ login_status: false });
    }
  } catch (error) {
    console.error('處理用戶個人頁面請求時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

//訂單記錄 pass
async function history_page(req, res) {
  const id_card = tool.verify_token(req.header.Authorization);
  try {
    if (id_card) {
      const history = await purchase_history.get_detailed_purchase_history(
        id_card.id
      );
      console.log(history.reverse());
      res.json(history.reverse());
    } else {
      res.json({ login_status: false });
    }
  } catch (error) {
    console.error('處理用戶購買紀錄頁面請求時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

//購物車 pass
async function car_page(req, res) {
  const id_card = tool.verify_token(req.header.Authorization);
  try {
    if (id_card) {
      const user = await user_data.use_id_get_user_data(id_card.id);
      const grade = user[0].grade;
      const shopping_cart = await shopping_car.get_user_data_from_shopping_cart(
        id_card.id
      );
      const shopping_cart_sum =
        await shopping_car.product_total_in_shopping_cart(id_card.id);
      const result = { grade, shopping_cart, shopping_cart_sum };
      console.log(result);
      res.json(result);
    } else {
      res.json({ login_state: false });
    }
  } catch (error) {
    console.error('處理用戶購物車頁面請求時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

// 登入頁 pass
function login_page(req, res) {
  const id_card = tool.verify_token(req.header.Authorization);
  try {
    if (id_card) {
      // 已登入，回傳登入狀態為true
      res.json({ login_status: true });
    } else {
      // 未登入，回傳登入狀態為false
      res.json({ login_status: false });
    }
  } catch (error) {
    console.error('處理用戶登入狀態頁面請求時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

//註冊頁 pass
function register_page(req, res) {
  const id_card = tool.verify_token(req.header.Authorization);
  try {
    if (id_card) {
      //已登入，回傳登入狀態為true
      res.json({ login_status: true });
    } else {
      // 未登入，回傳登入狀態為false
      res.json({ login_status: false });
    }
  } catch (error) {
    console.error('處理用戶註冊頁面請求時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

//結帳頁(未結帳) pass
async function check_page(req, res) {
  const id_card = tool.verify_token(req.header.Authorization);
  try {
    if (id_card) {
      // 已登入，使用用戶帳號來獲取用戶資料
      const user = await user_data.use_account_get_user_data(id_card.account);

      // 用ID來獲取購物車內容
      const shopping_cart = await shopping_car.get_user_data_from_shopping_cart(
        id_card.id
      );
      // 用ID來獲取購物車總計
      const shopping_cart_sum =
        await shopping_car.product_total_in_shopping_cart(id_card.id);

      // 從用戶資料中獲取等級、姓名、電話和郵件等資訊
      const user_grade = user[0].grade;
      const user_name = user[0].name;
      const user_phone = user[0].phone;
      const user_mail = user[0].mail;

      // 組合回傳結果
      const result = {
        user_grade,
        user_name,
        user_phone,
        user_mail,
        shopping_cart,
        shopping_cart_sum,
      };
      console.log(result);

      // 回傳結果
      res.json(result);
    } else {
      // 未登入，回傳登入狀態為false
      res.json([{ login_status: false }]);
    }
  } catch (error) {
    console.error('處理用戶資料檢查頁面請求時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

// 修改會員資料頁 pass
async function update_user_page(req, res) {
  const id_card = tool.verify_token(req.header.Authorization);
  try {
    if (id_card) {
      // 已登入，使用用戶帳號來獲取用戶資料
      const user = await user_data.use_account_get_user_data(id_card.account);

      // 組合回傳結果
      const result = {
        user_name: user[0].name,
        user_account: user[0].account,
        user_password: user[0].password,
        user_phone_number: user[0].phone,
        user_email: user[0].mail,
      };

      // 回傳結果
      res.json(result);
    } else {
      // 未登入，回傳登入狀態為false
      res.json({ login_status: false });
    }
  } catch (error) {
    console.error('處理用戶資料更新頁面請求時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

//聯繫客服頁 pass
async function service_page(req, res) {
  const id_card = tool.verify_token(req.header.Authorization);
  try {
    if (id_card) {
      const service_question = await service.get_customer_service_QA();
      //已登入，回傳登入狀態為true
      res.json({ login_status: true, service_question });
    } else {
      // 未登入，回傳登入狀態為false
      res.json([{ login_status: false }]);
    }
  } catch (error) {
    console.error('聯繫客服頁面請求時發生錯誤：', error);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試。' });
  }
}

// 產品模糊搜尋(品牌或品名)
async function vague_search(req, res) {
  const index = req.body.index;
  const vague_result = await tool.vague_search_database(index);
  try {
    if (!vague_result) {
      res.json(false);
    } else {
      res.json(vague_result);
    }
  } catch (error) {
    console.error('處理請求時發生錯誤：', error);
    res.status(500).json({ error: '獲取購產品資料時發生錯誤' });
  }
}

module.exports = {
  home_page,
  man_page,
  woman_page,
  kid_page,
  product_page,
  user_page,
  history_page,
  car_page,
  login_page,
  register_page,
  check_page,
  update_user_page,
  service_page,
  vague_search,
};
