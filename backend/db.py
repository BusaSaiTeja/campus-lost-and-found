def get_db():
    from app import mongo  # import here to avoid circular import
    return mongo.db