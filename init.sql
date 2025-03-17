-- init.sql
DROP DATABASE IF EXISTS MicroFinance_db;
CREATE DATABASE IF NOT EXISTS MicroFinance_db;
CREATE USER IF NOT EXISTS 'MFAdmin'@'%' IDENTIFIED BY '12qwaszxQdockerQ';
GRANT ALL PRIVILEGES ON MicroFinance_db.* TO 'MFAdmin'@'%';
GRANT SELECT ON performance_schema.* TO 'MFAdmin'@'%';
FLUSH PRIVILEGES;
