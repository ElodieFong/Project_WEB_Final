-- Create database
CREATE DATABASE IF NOT EXISTS hotel;
USE hotel;

-- =====================
-- USERS
-- =====================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('visitor','receptionist') NOT NULL,
  phone VARCHAR(20)
);

-- =====================
-- ROOMS
-- =====================
CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_number INT NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- =====================
-- RESERVATIONS
-- =====================
CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  room_id INT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  amount DECIMAL(10,2),
  status ENUM('paid','cancelled','checked_in','checked_out') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- =====================
-- EXTRA SERVICES
-- =====================
CREATE TABLE IF NOT EXISTS extra_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  type ENUM('meal','laundry') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);