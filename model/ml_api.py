from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import numpy as np

app = FastAPI()
model = pickle.load(open('trip_time_model.pkl', 'rb'))

class PredictRequest(BaseModel):
    distance_km: float
    weekday: int
    hour: int

@app.post('/predict')
def predict(req: PredictRequest):
    features = np.array([[req.distance_km, req.weekday, req.hour]])
    prediction = model.predict(features)
    return {'predicted_time_min': float(prediction[0])}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)