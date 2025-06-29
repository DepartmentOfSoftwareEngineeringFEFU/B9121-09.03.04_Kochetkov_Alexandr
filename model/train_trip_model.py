import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import pickle

df = pd.read_csv('synthetic_trips.csv')

X = df[['distance_km', 'weekday', 'hour']]
y = df['actual_time_min']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

print('R2 на тесте:', model.score(X_test, y_test))

with open('trip_time_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print('Модель сохранена в trip_time_model.pkl')