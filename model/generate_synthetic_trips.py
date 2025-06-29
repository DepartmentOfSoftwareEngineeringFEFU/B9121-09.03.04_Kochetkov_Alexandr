"""Генерация синтетических данных для обучения модели."""

import pandas as pd
import numpy as np

np.random.seed(42)
N = 3000

start_lat = np.random.uniform(43.0, 43.2, N)
start_lng = np.random.uniform(131.8, 132.0, N)
end_lat = np.random.uniform(43.0, 43.2, N)
end_lng = np.random.uniform(131.8, 132.0, N)

distance_km = np.sqrt(
    (start_lat - end_lat)**2 + (start_lng - end_lng)**2
) * 111

weekday = np.random.randint(0, 7, N)  # 0=Пн, 6=Вс
hour = np.random.randint(6, 22, N)    # 6:00 - 21:00

speed = 30 - 5 * ((hour >= 17) & (hour <= 19))  # пробки вечером

actual_time_min = (distance_km / speed * 60) + np.random.normal(5, 3, N)

df = pd.DataFrame({
    'start_lat': start_lat,
    'start_lng': start_lng,
    'end_lat': end_lat,
    'end_lng': end_lng,
    'distance_km': distance_km,
    'weekday': weekday,
    'hour': hour,
    'actual_time_min': actual_time_min
})

df.to_csv('synthetic_trips.csv', index=False)
print('Синтетические данные сохранены в synthetic_trips.csv')
