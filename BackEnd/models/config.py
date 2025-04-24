import os
from dotenv import load_dotenv

load_dotenv()

# Storage configuration
storage_t = os.getenv("MFS_TYPE_STORAGE", "db")  # Default to "db" for consistency

# Database configuration
db_host = os.getenv("MFS_MYSQL_HOST", "localhost")
db_user = os.getenv("MFS_MYSQL_USER", "root")
db_pwd = os.getenv("MFS_MYSQL_PWD", "")
db_name = os.getenv("MFS_MYSQL_DB", "microfinance_db")
db_port = os.getenv("MFS_MYSQL_PORT", "3306")
