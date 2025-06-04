class Config:
    SECRET_KEY = 'test'
    SQLALCHEMY_DATABASE_URI = 'mysql://test:test@127.0.0.1/gravitytest'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CONFIGURAION DE LA API DE OPENAI
    OPENAI_API_KEY = 'open-ai-apikey'
