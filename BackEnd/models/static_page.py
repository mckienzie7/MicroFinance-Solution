#!/usr/bin/python3
"""
StaticPage model
"""
from models.base_model import BaseModel, Base
from sqlalchemy import Column, String, Text


class StaticPage(BaseModel, Base):
    """
    Representation of a static page
    """
    __tablename__ = 'static_pages'
    name = Column(String(128), nullable=False, unique=True)
    content = Column(Text, nullable=False)

    def __init__(self, *args, **kwargs):
        """initializes static page"""
        super().__init__(*args, **kwargs)
