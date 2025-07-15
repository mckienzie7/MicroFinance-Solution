DROP DATABASE IF EXISTS MicroFinance_db;
SHOW DATABASES;

CREATE DATABASE IF NOT EXISTS MicroFinance_db;
CREATE USER IF NOT EXISTS 'MFAdmin'@'localhost';
ALTER USER 'MFAdmin'@'localhost' IDENTIFIED BY '12qwaszx@Q';
GRANT ALL ON MicroFinance_db.* TO 'MFAdmin'@'localhost';
GRANT SELECT ON performance_schema.* TO 'MFAdmin'@'%';
FLUSH PRIVILEGES;
