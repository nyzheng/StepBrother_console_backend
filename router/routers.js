const express = require('express');
const routes = express.Router();
const page = require('../controller/page_ctrl');
const member = require('../controller/member_ctrl');
const shopping = require('../controller/shopping_car_ctrl');
const path = require('path');
// test
// routes.get('/', (req, res) => {
//   const filePath = path.join(__dirname, '../views/test.html');
//   res.sendFile(filePath);
// });
//網頁
routes.get('/stepbrothers', page.home_page);
routes.get('/stepbrothers/man', page.man_page);
routes.get('/stepbrothers/woman', page.woman_page);
routes.get('/stepbrothers/kids', page.kid_page);
routes.get('/stepbrothers/user', page.user_page);
routes.get('/stepbrothers/purchase_history', page.history_page);
routes.get('/stepbrothers/shopping_car', page.car_page);
routes.get('/stepbrothers/login_page', page.login_page);
routes.get('/stepbrothers/register_page', page.register_page);
routes.get('/stepbrothers/check_out', page.check_page);
routes.get('/stepbrothers/update_user_data_page', page.update_user_page);
routes.get('/stepbrothers/customer_service', page.service_page);
//產品模糊搜尋
routes.post('/stepbrothers/product_search', page.vague_search);

//會員功能
routes.post('/stepbrothers/login', member.login); //登入
routes.get('/stepbrothers/logout', member.logout); //登出
routes.post('/stepbrothers/register', member.register); //註冊
routes.put('/stepbrothers/submit_update_user_data', member.update_user_data); //更新會員資料
routes.get('/stepbrothers/customer_service', member.update_user_data); //客服回應
routes.post('/stepbrothers/submit_forget_password', member.forget_password); //忘記密碼
routes.put('/stepbrother/cancel_order', shopping.cancel_order); //取消訂單

// 購物功能
routes.post('/stepbrothers/:id/add', shopping.add_to_car); //新增加入購物車
routes.post(
  '/stepbrothers/update_shopping_car_quantity',
  shopping.update_quantity
); //異動購物車商品數量
routes.put('/stepbrothers/delete_car', shopping.delete_car_product); //移除購物車商品
routes.post('/stepbrothers/submit_shopping_car', shopping.buy_car_product); //下訂購物車商品

// 指定商品頁//動態路由
routes.get('/stepbrothers/:id', page.product_page);

// 路由輸出
module.exports = routes;
