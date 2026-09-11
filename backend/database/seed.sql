USE hotel;

INSERT INTO users (id, username, password, role, phone) VALUES
(1, 'Kosseny', '1234', 'visitor', '0000000000'),
(2, 'Julie', '1234', 'visitor', '1111111111'),
(3, 'Elodie', '1234', 'visitor', '2222222222'),
(4, 'receptionist', '1234', 'receptionist', '1111111111');

INSERT INTO rooms (id, room_number, price) VALUES
(1, 101, 150.00),
(2, 102, 200.00),
(3, 103, 300.00),
(4, 201, 500.00);