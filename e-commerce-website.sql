CREATE DATABASE `e-commerce-website`;
SHOW DATABASES;
SHOW TABLES;
DROP TABLE `history_chat`;
SELECT * FROM `product_data`;
USE `e-commerce-website`;

UPDATE `user_data` SET `purchase_CA` = 0 WHERE id = 1;

CREATE TABLE `user_data` (
    `id` INT AUTO_INCREMENT, -- 使用者 ID
    `account` VARCHAR(50) NOT NULL, -- 帳號
    `password` VARCHAR(50) NOT NULL, -- 密碼
    `name` VARCHAR(50) NOT NULL, -- 姓名
    `phone` VARCHAR(20) NOT NULL, -- 電話號碼
    `mail` VARCHAR(50) NOT NULL, -- 電子郵件
    `grade` INT DEFAULT 1, -- 會員等級，預設為 1
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP, -- 建立時間，預設為當前時間
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新時間，預設為當前時間
    `purchase_CA` INT DEFAULT 0, -- 累積消費金額，預設為 0
    `login_status` INT DEFAULT 0, -- 登入狀態，預設為 0
    PRIMARY KEY (`id`)
);

-- 建立產品品牌資料表 
CREATE TABLE `product_brand` (
    `id` INT AUTO_INCREMENT,
    `brand_name` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE `product_detail` (
    `id` INT AUTO_INCREMENT,
    `product_name` VARCHAR(255) NOT NULL,
    `price` INT NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE `product_size` (
    `id` INT AUTO_INCREMENT,
    `us_size` INT NOT NULL,
    PRIMARY KEY (`id`)
);

CREATE TABLE `product_class` (
    `id` INT AUTO_INCREMENT,
    `class` VARCHAR(255),
    PRIMARY KEY (`id`)
);

CREATE TABLE `product_data` (
    `id` INT AUTO_INCREMENT,
    `brand_id` INT,
    `detail_id` INT,
    `class_id` INT,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`brand_id`) REFERENCES `product_brand` (`id`),
    FOREIGN KEY (`detail_id`) REFERENCES `product_detail` (`id`),
    FOREIGN KEY (`class_id`) REFERENCES `product_class` (`id`)
);

CREATE TABLE `shopping_car` (
	`id` INT AUTO_INCREMENT,
    `user_id` INT,
    `product_id` INT,
    `size_id` INT,
    `quantity` INT NOT NULL,
    `price` INT, -- 新增的價格欄位
    `final_price` INT,
    `subtotal` INT,
    `shopping_status` INT DEFAULT 1,
    `check_out_status` INT DEFAULT 0,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `user_data` (`id`),
    FOREIGN KEY (`product_id`) REFERENCES `product_data` (`id`),
    FOREIGN KEY (`size_id`) REFERENCES `product_size` (`id`)
);

CREATE TABLE `purchase_history` (
	`id` INT AUTO_INCREMENT,
    `user_id` INT,
    `recipient_name` VARCHAR(255) NOT NULL,
    `recipient_phone` VARCHAR(255) NOT NULL,
    `recipient_address` VARCHAR(255),
    `product_id` INT,
    `quantity` INT NOT NULL,
    `subtotal` INT,
    `sum` INT,
    `purchase_status` INT DEFAULT 1,
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `user_data` (`id`),
    FOREIGN KEY (`product_id`) REFERENCES `shopping_car` (`id`)
);

-- 客服問題
CREATE TABLE `customer_service_question`(
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `question` VARCHAR(255)
);


-- 歷史對話
CREATE TABLE `history_chat`(
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT,
    `name` VARCHAR(50),
    `message` VARCHAR(1000),
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `user_data` (`id`)
    );
    
UPDATE user_data
SET purchase_CA = 0
WHERE id = 4;

ALTER TABLE shopping_car
ADD final_price INT DEFAULT 0 AFTER price;

