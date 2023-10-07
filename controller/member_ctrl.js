const user_data = require('../model/user_model')
const automatic_mail = require('../model/mail_model')
const tool = require('../model/tool_model')

//登入 pass
async function login(req, res) {
    try {
        const account = req.body.account
        const password = req.body.password
        const login_result = await user_data.login(account, password)

        if (login_result) {
            const payload = { id: login_result.id, account: login_result.account }
            const token = tool.make_token(payload, '7d')
            tool.delete_single_user_status(login_result.id, 86400 * 7)
            req.header.Authorization = token
            res.json({ login_status: true })
        } else {
            res.json({ login_status: false })
        }
    } catch (error) {
        console.error('登入時發生錯誤：', error)
        res.status(500).json({ error: '伺服器錯誤，請稍後再試。' })
    }
}

// 登出  pass
async function logout(req, res) {
    const id_card = tool.verify_token(req.header.Authorization)
    try {
        if (id_card == null) {
            return res.json({ login_status: false })
        }
        const user_id = id_card.id
        await user_data.logout(user_id)
        // 刪除token
        delete req.header['Authorization']
        // 回傳登出狀態
        return res.json({ login_status: false })
    } catch (error) {
        console.error('登出時發生錯誤：', error)
        return res.status(500).json({ error: '伺服器錯誤，請稍後再試。' })
    }
}

// 註冊 pass
async function register(req, res) {
    try {
        const account = req.body.new_account
        const password = req.body.new_password
        const name = req.body.new_name
        const phone = req.body.new_phone_number
        const mail = req.body.new_email

        // 進行註冊
        let result = await user_data.register_user(account, password, name, phone, mail)

        // 判斷註冊結果並回傳相關用戶資訊
        if (result) {
            res.json({
                register_result: true,
                user_id: result.id,
                name: result.name,
                phone: result.phone,
                email: result.email,
            })
        } else {
            res.json({ register_result: false })
        }
    } catch (error) {
        console.error('註冊時發生錯誤：', error)
        res.status(500).json({ error: '伺服器錯誤，請稍後再試。' })
    }
}

// 忘記密碼
async function forget_password(req, res) {
    const user_index = req.body
    const accountExist = await user_data.use_account_get_user_data(user_index.account)

    try {
        if (!accountExist || accountExist.length === 0) {
            // 如果帳號不存在，或者不存在，返回兩個 false
            res.json({ account_exist: false, user_phone: false })
            return
        }

        // 帳號存在，檢查電話是否匹配
        if (accountExist[0].phone === user_index.phone) {
            automatic_mail.send_forget_password_mail(accountExist)
            res.json({ account_exist: true, user_phone: true })
        } else {
            // 電話不匹配，返回兩個 false
            res.json({ account_exist: false, user_phone: false })
        }
    } catch (error) {
        console.error('尋找時發生錯誤：', error)
        res.status(500).json({ error: '伺服器錯誤，請稍後再試。' })
    }
}

// 更改會員資料
async function update_user_data(req, res) {
    const id_card = tool.verify_token(req.header.Authorization)
    try {
        const user_id = id_card.id
        const password = req.body.change_password
        const phone = req.body.change_phone_number
        const mail = req.body.change_email

        // 進行更新會員資料
        const result = await user_data.update_user_data(user_id, password, phone, mail)

        // 判斷更新結果
        if (result) {
            res.json({ change_result: true })
        } else {
            res.json({ change_result: false })
        }
    } catch (error) {
        console.error('更改會員資料時發生錯誤：', error)
        res.status(500).json({ error: '伺服器錯誤，請稍後再試。' })
    }
}

//客服功能//!  -----------------------------------------------------------

module.exports = {
    login,
    logout,
    register,
    update_user_data,
    forget_password,
}
