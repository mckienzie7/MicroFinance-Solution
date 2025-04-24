#!/usr/bin/python3
"""
initialize the models package
"""

from BackEnd.models.config import storage_t

if storage_t == "db":
    from BackEnd.models.engine.database import DBStorage
    storage = DBStorage()
elif storage_t == "file":
    from BackEnd.models.engine.file_storage import FileStorage
    storage = FileStorage()
elif storage_t == "mongo":
    from BackEnd.models.engine.mongostorage import MongoStorage
    storage = MongoStorage()
else:
    from BackEnd.models.engine.file_storage import FileStorage
    storage = FileStorage()

storage.reload()
