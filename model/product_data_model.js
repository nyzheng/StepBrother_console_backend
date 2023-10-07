const { connection } = require('../model/connection_model')

//! product_brand ----------------------------------------------------------------

// 取得產品品牌資料
async function get_product_brand() {
    try {
        const query = 'SELECT * FROM product_brand'
        const [results] = await connection.query(query)
        console.log('品牌資料', results)
        return results // 回傳品牌資料
    } catch (error) {
        console.error('無法獲取品牌資料:', error)
        return [] // 回傳空陣列表示發生錯誤或沒有品牌資料
    }
}

// 新增品牌
async function create_product_brand(brand_name) {
    try {
        const brandExists = await check_brand_exists(brand_name)
        if (brandExists) {
            console.log('相同品牌已存在，無法新增')
            return false // 回傳 false 代表品牌已存在
        }

        const insert_query = `INSERT INTO product_brand (brand_name) VALUES (?)`
        await connection.query(insert_query, [brand_name])
        console.log('品牌已新增')
        get_product_brand()
        return true // 回傳 true 代表品牌新增成功
    } catch (error) {
        console.error('無法新增品牌:', error)
        return false // 回傳 false 代表品牌新增失敗
    }
}

// 檢查品牌是否已存在
async function check_brand_exists(brand_name) {
    try {
        const check_query = `
            SELECT COUNT(*) as count
            FROM product_brand
            WHERE brand_name = ?
        `
        const [checkResults] = await connection.query(check_query, [brand_name])
        const count = checkResults[0].count
        return count > 0
    } catch (error) {
        console.error('檢查品牌是否已存在時發生錯誤:', error)
        return true // 假設發生錯誤時，回傳 true，代表品牌已存在（避免錯誤狀況）
    }
}

// 修改品牌資料(用品牌資料的Id查詢，brand_name 為要修改的名字)
async function update_product_brand(id, brand_name) {
    try {
        const update_query = `UPDATE product_brand SET brand_name = ? WHERE id = ?`
        const update_values = [brand_name, id]
        await connection.query(update_query, update_values)
        console.log('資料更新成功')
        get_product_brand()
    } catch (error) {
        console.error('無法更新資料:', error)
    }
}

//! product_detali ----------------------------------------------------------------

// 建立產品細節資料
async function create_detail(product_name, price) {
    try {
        const query = 'INSERT INTO product_detail (product_name, price) VALUES (?, ?)'
        const values = [product_name, price]
        const [result] = await connection.query(query, values)
        if (result.affectedRows === 1) {
            console.log('細節資料已新增')
            get_product_detail()
            return true // 回傳 true 代表細節資料新增成功
        } else {
            console.log('細節資料新增失敗')
            return false // 回傳 false 代表細節資料新增失敗
        }
    } catch (error) {
        console.error('無法新增細節資料:', error)
        return false // 回傳 false 代表細節資料新增失敗
    }
}

// 取得產品細節資料
async function get_product_detail() {
    try {
        const query = 'SELECT * FROM product_detail'
        const [results] = await connection.query(query)
        console.log('細節資料', results)
        return results
    } catch (error) {
        console.error('無法獲取細節資料:', error)
    }
}

// 修改產品細節名稱
async function update_product_name(product_id, newProductName) {
    try {
        const update_query = `
    UPDATE product_detail
    SET product_name = ?
    WHERE id = ?
  `
        const update_values = [newProductName, product_id]

        // 執行 SQL 更新語句
        const [update_result] = await connection.query(update_query, update_values)

        if (update_result.affectedRows > 0) {
            console.log(`商品編號 ${product_id} 的商品名稱已更新為 "${newProductName}"`)
            return true
        } else {
            console.log(`找不到商品編號為 ${product_id} 的記錄，無法更新商品名稱`)
            return false
        }
    } catch (error) {
        console.error('更新商品名稱時發生錯誤:', error)
        return false
    }
}

//! product_size ----------------------------------------------------------------

// 建立產品尺寸資料
async function create_product_size(us_size) {
    try {
        const insert_query = `INSERT INTO product_size (us_size) VALUES (?);`
        const [insert_result] = await connection.query(insert_query, [us_size])

        if (insert_result.affectedRows > 0) {
            console.log(`成功新增 us_size: ${us_size}`)
            get_product_size()
            return true // 回傳 true 代表尺寸資料新增成功
        } else {
            console.log('新增失敗')
            return false // 回傳 false 代表尺寸資料新增失敗
        }
    } catch (error) {
        console.error('新增 us_size 時發生錯誤:', error)
        return false // 回傳 false 代表尺寸資料新增失敗
    }
}

// 取得產品尺寸資料
async function get_product_size() {
    try {
        const query = 'SELECT * FROM product_size'
        const [results] = await connection.query(query)
        console.log('尺寸資料', results)
        return results // 回傳尺寸資料
    } catch (error) {
        console.error('無法獲取尺寸資料:', error)
        return [] // 回傳空陣列表示發生錯誤或沒有尺寸資料
    }
}

//! product_stock ----------------------------------------------------------------

// 讀取全部商品的庫存量
async function get_product_stock_quantity() {
    try {
        const query = `
          SELECT pd.id AS product_id, pb.brand_name, pdd.product_name, ps.size_id, ps.stock_quantity
          FROM product_data pd
          JOIN product_brand pb ON pd.brand_id = pb.id
          JOIN product_detail pdd ON pd.detail_id = pdd.id
          JOIN product_stock ps ON pd.id = ps.product_data_id
      `

        const [results] = await connection.query(query)
        console.log(results)
        return results
    } catch (error) {
        console.error('無法讀取商品庫存量:', error)
        return []
    }
}

// 取得單筆商品全尺寸庫存量
async function get_single_product_stock_quantity(product_id) {
    try {
        const query = `
        SELECT pd.id AS product_id, pb.brand_name, pdd.product_name, ps.size_id, ps.stock_quantity
        FROM product_stock ps
        JOIN product_data pd ON ps.product_data_id = pd.id
        JOIN product_detail pdd ON pd.detail_id = pdd.id
        JOIN product_brand pb ON pd.brand_id = pb.id
        WHERE ps.product_data_id = ?
    `

        const [results] = await connection.query(query, [product_id])
        console.log(`取得商品 ID ${product_id} 的庫存量與產品資訊:`, results)
        return results
    } catch (error) {
        console.error('無法取得單筆商品庫存量:', error)
        return []
    }
}

// 取得單筆商品單尺寸庫存量
async function get_single_product_single_size_stock_quantity(product_id, size_id) {
    try {
        const query = `
        SELECT pd.id AS product_id, pb.brand_name, pdd.product_name, ps.size_id, ps.stock_quantity
        FROM product_stock ps
        JOIN product_data pd ON ps.product_data_id = pd.id
        JOIN product_detail pdd ON pd.detail_id = pdd.id
        JOIN product_brand pb ON pd.brand_id = pb.id
        WHERE ps.product_data_id = ? AND ps.size_id = ?
    `

        const [results] = await connection.query(query, [product_id, size_id])
        console.log(`取得商品 ID ${product_id} 在尺寸 ${size_id} 的庫存量與產品資訊:`, results)
        return results
    } catch (error) {
        console.error('無法取得單筆商品單尺寸庫存量:', error)
        return []
    }
}

// 取得單筆商品全尺寸庫存量JY
async function get_single_product_stock(product_id) {
    try {
        const query = `
            SELECT size_id, stock_quantity
            FROM product_stock
            WHERE product_data_id = ? AND stock_quantity > 0
        `

        const [stock_data] = await connection.query(query, [product_id])
        const result = stock_data.map((item) => {
            if (item.stock_quantity > 0) {
                return {
                    size: item.size_id,
                    stock: item.stock_quantity,
                };
            }
            return null;
        }).filter(Boolean).reverse(); // 過濾掉為 null 的項目
        console.log('成功取得商品單尺寸庫存量！')
        console.log(result)
        return result
    } catch (error) {
        console.error('無法取得商品單尺寸庫存量:', error)
        return []
    }
}



// 結帳後更新商品庫存資料 (- quantity = stock quantity)
async function update_product_stock(product_id, size_id, quantity) {
    try {
        const get_stock_query = `
            SELECT stock_quantity
            FROM product_stock
            WHERE product_data_id = ? AND size_id = ?
        `

        const [stock_results] = await connection.query(get_stock_query, [product_id, size_id])

        if (stock_results.length === 0) {
            const errorMessage = `找不到商品庫存資料 (商品ID: ${product_id} 尺寸ID: ${size_id})`
            console.error(errorMessage)
            return false
        }

        const current_stock = stock_results[0].stock_quantity

        if (current_stock < quantity) {
            const errorMessage = `商品庫存不足 (商品ID: ${product_id} 尺寸ID: ${size_id}，庫存數量: ${current_stock}，要求數量: ${quantity})`
            console.error(errorMessage)
            return false
        }

        const updated_stock = current_stock - quantity

        const update_stock_query = `
            UPDATE product_stock
            SET stock_quantity = ?
            WHERE product_data_id = ? AND size_id = ?
        `

        await connection.query(update_stock_query, [updated_stock, product_id, size_id])

        console.log(`商品 ID ${product_id} 尺寸 ${size_id} 的庫存數量已更新為 ${updated_stock}`)
        return true
    } catch (error) {
        console.error('無法更新商品庫存資料:', error)
        return false
    }
}
// update_product_stock(1,1,1)

// 新增庫存數量 (quantity 為 指定數字，帶多少庫存更新為多少)
async function create_product_stcok_quantity(product_id, size_id, quantity) {
    try {
        const update_stock_query = `
          UPDATE product_stock
          SET stock_quantity = ?
          WHERE product_data_id = ? AND size_id = ?
      `

        await connection.query(update_stock_query, [quantity, product_id, size_id])

        console.log(`商品 ID ${product_id} 尺寸 ${size_id} 的庫存數量已更新為 ${quantity}`)
        await get_single_product_single_size_stock_quantity(product_id, size_id)
        return true
    } catch (error) {
        console.error('無法新增庫存數量:', error)
        return false
    }
}
// create_product_stcok_quantity(1,1,10)

//! product_class ----------------------------------------------------------------

// 取得產品類別資料
async function get_product_class() {
    try {
        const query = 'SELECT * FROM product_class'
        const [results] = await connection.query(query)
        console.log('類別資料', results)
        return results // 回傳類別資料
    } catch (error) {
        console.error('無法獲取類別資料:', error)
        return [] // 回傳空陣列表示發生錯誤或沒有類別資料
    }
}

//! product_data ----------------------------------------------------------------

// 取得全部商品資料 － retuen 陣列
async function get_product_data() {
    try {
        const query = `
      SELECT pd.id, pb.brand_name, pdd.product_name, pdd.price, pc.class, pd.product_data_status
      FROM product_data pd
      JOIN product_brand pb ON pd.brand_id = pb.id
      JOIN product_detail pdd ON pd.detail_id = pdd.id
      JOIN product_class pc ON pd.class_id = pc.id
      WHERE pd.product_data_status = 1
    `
        const [results] = await connection.query(query)
        console.log('產品資料', results)
        return results
    } catch (error) {
        console.error('無法獲取產品資料:', error)
    }
}

// 使用類別 id 篩選產品 (man = 1 ， waman = 2 ， kids = 3)
async function use_class_id_get_product(id) {
    try {
        const query = `
          SELECT pd.id, pb.brand_name, pdd.product_name, pdd.price, pc.class, pd.product_data_status
          FROM product_data pd
          JOIN product_brand pb ON pd.brand_id = pb.id
          JOIN product_detail pdd ON pd.detail_id = pdd.id
          JOIN product_class pc ON pd.class_id = pc.id
          WHERE pd.class_id = ? AND pd.product_data_status = 1
      `
        const values = [id]
        const [results] = await connection.query(query, values)
        console.log(`類別 ID 為 ${id} 的產品資料`, results)
        return results
    } catch (error) {
        console.error('無法獲取產品資料:', error)
    }
}

// product id 篩選商品  (1~45筆資料)
async function use_product_id_get_product(id) {
    try {
        const query = `
      SELECT pd.id, pb.brand_name, pdd.product_name, pdd.price, pc.class, pd.product_data_status
      FROM product_data pd
      JOIN product_brand pb ON pd.brand_id = pb.id
      JOIN product_detail pdd ON pd.detail_id = pdd.id
      JOIN product_class pc ON pd.class_id = pc.id
      WHERE pd.id = ? AND pd.product_data_status = 1
    `
        const [results] = await connection.query(query, [id])

        // 如果查詢結果為空（即沒有找到對應的商品），返回 false
        if (results.length === 0) {
            console.log(`找不到 ID 為 ${id} 的商品資料`)
            return false
        }

        console.log(`ID 為 ${id} 的商品資料`, results)
        return results
    } catch (error) {
        console.error('無法獲取商品資料:', error)
        return false // 返回 false 表示處理出現錯誤
    }
}

module.exports = {
    get_product_brand,
    create_product_brand,
    check_brand_exists,
    update_product_brand,
    create_detail,
    get_product_detail,
    update_product_name,
    create_product_size,
    get_product_size,
    get_product_stock_quantity,
    get_single_product_stock_quantity,
    get_single_product_single_size_stock_quantity,
    update_product_stock,
    create_product_stcok_quantity,
    get_product_class,
    get_product_data,
    use_class_id_get_product,
    use_product_id_get_product,
    get_single_product_stock,
}
