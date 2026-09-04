from fastapi import FastAPI
from schemes import router as schemes_router
import models
from database import Base, engine
#Comments added to make the code self explanatory and more readable

app = FastAPI()
 #FastAPI backend application is created and stored inside the python memeoryu under label 'app'

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return{"message" : "Backend functioning well"}

app.include_router(schemes_router)

# When a GET request is sent to the endpoint "/", the fucntion 'root' is called and it returns a JSON response with the message "Backend functioning well".