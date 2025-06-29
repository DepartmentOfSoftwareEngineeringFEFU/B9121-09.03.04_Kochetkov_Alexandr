import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import { tripsService } from "../services/apiService";
import { authService } from "../services/apiService";
import Autocomplete from '@mui/material/Autocomplete';
import { getAddressSuggestions } from '../services/yandexSuggestService';
import { v4 as uuidv4 } from 'uuid';

const CreateTrip = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const mapRef = useRef();
  const ymapsRef = useRef();
  const [mapInitialized, setMapInitialized] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isRouteBuilding, setIsRouteBuilding] = useState(false);
  const maxDistance = 200; // максимальное расстояние в км от Владивостока
  const [fromOptions, setFromOptions] = useState([]);
  const [toOptions, setToOptions] = useState([]);
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [sessionToken] = useState(uuidv4());

  const formik = useFormik({
    initialValues: {
      from: "",
      to: "",
      date: "",
      time: "",
      seats: 1,
      price: 0,
      description: "",
      carId: "",
      startLat: null,
      startLng: null,
      endLat: null,
      endLng: null,
    },
    validationSchema: Yup.object({
      from: Yup.string().required("Укажите место отправления"),
      to: Yup.string().required("Укажите место назначения"),
      date: Yup.string()
        .required("Укажите дату поездки")
        .test(
          "is-future-date",
          "Дата не может быть в прошлом",
          function (value) {
            if (!value) return false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const selectedDate = new Date(value);
            selectedDate.setHours(0, 0, 0, 0);

            return selectedDate >= today;
          }
        )
        .test(
          "is-future-datetime",
          "Дата и время не могут быть в прошлом",
          function (value) {
            const { time } = this.parent;
            if (!value || !time) return true;

            const [hours, minutes] = time.split(":");
            const selectedDateTime = new Date(value);
            selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            return selectedDateTime > new Date();
          }
        ),
      time: Yup.string()
        .required("Укажите время поездки")
        .test(
          "is-future-time",
          "Время не может быть в прошлом",
          function (value) {
            const { date } = this.parent;
            if (!value || !date) return true;

            const now = new Date();
            const selectedDate = new Date(date);
            const [hours, minutes] = value.split(":");
            selectedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            if (
              selectedDate.getDate() > now.getDate() ||
              selectedDate.getMonth() > now.getMonth() ||
              selectedDate.getFullYear() > now.getFullYear()
            ) {
              return true;
            }

            return selectedDate > now;
          }
        ),
      seats: Yup.number()
        .min(1, "Минимум 1 место")
        .max(10, "Максимум 10 мест")
        .required("Укажите количество мест"),
      price: Yup.number()
        .min(1, "Цена должна быть больше 0")
        .required("Укажите цену")
        .typeError("Введите корректную цену"),
      description: Yup.string(),
      carId: Yup.string().required("Выберите автомобиль"),
      startLat: Yup.number().nullable(),
      startLng: Yup.number().nullable(),
      endLat: Yup.number().nullable(),
      endLng: Yup.number().nullable(),
    }),
    onSubmit: async (values) => {
      try {
        const scheduledDateTime = new Date(`${values.date}T${values.time}`);
        if (scheduledDateTime <= new Date()) {
          toast.error("Невозможно создать поездку в прошлом");
          return;
        }

        if (!route) {
          toast.error("Пожалуйста, постройте маршрут на карте");
          return;
        }

        if (!estimatedTime) {
          toast.error("Пожалуйста, дождитесь расчета времени маршрута");
          return;
        }

        setLoading(true);

        const tripData = {
          startAddress: values.from.trim(),
          endAddress: values.to.trim(),
          scheduledDate: scheduledDateTime.toISOString(),
          price: Math.max(0, parseFloat(values.price) || 0),
          availableSeats: Math.max(1, parseInt(values.seats) || 1),
          description: values.description ? values.description.trim() : null,
          carId: parseInt(values.carId),
          startLat: values.startLat ? parseFloat(values.startLat) : null,
          startLng: values.startLng ? parseFloat(values.startLng) : null,
          endLat: values.endLat ? parseFloat(values.endLat) : null,
          endLng: values.endLng ? parseFloat(values.endLng) : null,
          estimatedDuration: estimatedTime ? parseInt(estimatedTime) : null,
        };

        if (!tripData.startAddress || !tripData.endAddress || !tripData.carId) {
          toast.error("Пожалуйста, заполните все обязательные поля");
          return;
        }

        const response = await tripsService.createNewTrip(tripData);
        if (response.data) {
          toast.success("Поездка успешно создана");
          navigate("/trips");
        }
      } catch (error) {
        console.error("Error creating trip:", error);
        if (error.response) {
          console.error("Server response:", error.response.data);
          const errorMessage =
            error.response.data.message || "Ошибка при создании поездки";
          if (error.response.data.details) {
            console.error("Validation details:", error.response.data.details);
            Object.values(error.response.data.details)
              .filter((msg) => msg)
              .forEach((msg) => toast.error(msg));
          } else {
            toast.error(errorMessage);
          }
        } else {
          toast.error(
            "Ошибка при создании поездки. Пожалуйста, проверьте введенные данные."
          );
        }
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await authService.getUserCars();
        setCars(response.data);
        if (response.data.length === 1) {
          formik.setFieldValue("carId", response.data[0].id);
        }
      } catch (error) {
        console.error("Error fetching cars:", error);
      }
    };
    fetchCars();
  }, [formik]);

  const buildRoute = useCallback(async () => {
    if (
      !ymapsRef.current ||
      !mapInitialized ||
      !formik.values.from ||
      !formik.values.to ||
      isRouteBuilding
    ) {
      return;
    }

    try {
      setIsRouteBuilding(true);

      const boundedBy = [
        [42.0, 130.0], // юго-западная точка
        [48.0, 139.0], // северо-восточная точка
      ];

      const startGeocode = await ymapsRef.current.geocode(formik.values.from, {
        boundedBy: boundedBy,
        strictBounds: true,
        results: 1,
      });

      if (!startGeocode.geoObjects.get(0)) {
        toast.error(
          "Адрес отправления должен быть в пределах Приморского края"
        );
        setIsRouteBuilding(false);
        return;
      }

      const startCoords = startGeocode.geoObjects
        .get(0)
        .geometry.getCoordinates();

      const endGeocode = await ymapsRef.current.geocode(formik.values.to, {
        boundedBy: boundedBy,
        strictBounds: true,
        results: 1,
      });

      if (!endGeocode.geoObjects.get(0)) {
        toast.error("Адрес назначения должен быть в пределах Приморского края");
        setIsRouteBuilding(false);
        return;
      }

      const endCoords = endGeocode.geoObjects.get(0).geometry.getCoordinates();

      const vladivostok = [43.1155, 131.8855];

      const isWithinRadius = (coords) => {
        const lat1 = (vladivostok[0] * Math.PI) / 180;
        const lat2 = (coords[0] * Math.PI) / 180;
        const dLat = ((coords[0] - vladivostok[0]) * Math.PI) / 180;
        const dLon = ((coords[1] - vladivostok[1]) * Math.PI) / 180;

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = 6371 * c; // радиус Земли * c = расстояние в км

        return distance <= maxDistance;
      };

      if (!isWithinRadius(startCoords) || !isWithinRadius(endCoords)) {
        toast.error("Маршрут должен быть в пределах 200 км от Владивостока");
        setIsRouteBuilding(false);
        return;
      }

      formik.setFieldValue("startLat", startCoords[0]);
      formik.setFieldValue("startLng", startCoords[1]);
      formik.setFieldValue("endLat", endCoords[0]);
      formik.setFieldValue("endLng", endCoords[1]);

      const multiRoute = new ymapsRef.current.multiRouter.MultiRoute(
        {
          referencePoints: [startCoords, endCoords],
          params: {
            routingMode: "auto",
            boundedBy: boundedBy,
          },
        },
        {
          boundsAutoApply: true,
          wayPointStartIconColor: "#000000",
          wayPointFinishIconColor: "#000000",
        }
      );

      if (route) {
        mapRef.current.geoObjects.remove(route);
      }

      mapRef.current.geoObjects.add(multiRoute);
      setRoute(multiRoute);

      let isFirstSuccess = true;
      multiRoute.model.events.add("requestsuccess", () => {
        const activeRoute = multiRoute.getActiveRoute();
        if (activeRoute) {
          const time = activeRoute.properties.get("duration");
          const distance = activeRoute.properties.get("distance");
          if (distance.value / 1000 > maxDistance) {
            toast.error(
              "Маршрут слишком длинный. Максимальное расстояние - 200 км"
            );
            mapRef.current.geoObjects.remove(multiRoute);
            setRoute(null);
            setIsRouteBuilding(false);
            return;
          }
          setEstimatedTime(Math.round(time.value / 60));
          if (isFirstSuccess) {
            toast.success("Маршрут построен успешно");
            isFirstSuccess = false;
          }
        }
        setIsRouteBuilding(false);
      });

      multiRoute.model.events.add("requestfail", () => {
        toast.error("Не удалось построить маршрут");
        setIsRouteBuilding(false);
      });
    } catch (error) {
      console.error("Error building route:", error);
      toast.error(
        "Ошибка при построении маршрута. Пожалуйста, проверьте введенные адреса."
      );
      setIsRouteBuilding(false);
    }
  }, [formik, mapInitialized, route, isRouteBuilding, maxDistance]);

  useEffect(() => {
    const handleMapStateChange = () => {
      if (mapRef.current) {
        mapRef.current.container.fitToViewport();
      }
    };

    if (showMap) {
      window.addEventListener("resize", handleMapStateChange);
    }

    return () => {
      window.removeEventListener("resize", handleMapStateChange);
    };
  }, [showMap]);

  useEffect(() => {
    if (mapRef.current && mapInitialized) {
      const checkMapState = setInterval(() => {
        if (mapRef.current) {
          const container = mapRef.current.container;
          if (container && container.getElement()) {
            const element = container.getElement();
            if (element.offsetWidth === 0 || element.offsetHeight === 0) {
              container.fitToViewport();
            }
          }
        }
      }, 1000);

      return () => {
        clearInterval(checkMapState);
      };
    }
  }, [mapInitialized]);

  const initMap = () => {
    if (!mapRef.current) {
      try {
        const mapElement = document.getElementById("map");
        if (!mapElement) {
          console.error("Map element not found");
          return;
        }

        if (mapElement.offsetWidth === 0 || mapElement.offsetHeight === 0) {
          console.error("Map element has zero dimensions");
          return;
        }

        requestAnimationFrame(() => {
          try {
            mapRef.current = new window.ymaps.Map("map", {
              center: [43.1155, 131.8855],
              zoom: 11,
              controls: ["zoomControl", "fullscreenControl"],
            });
            ymapsRef.current = window.ymaps;
            mapRef.current.controls.add("trafficControl");

            mapRef.current.events.add("sizechange", () => {
              setTimeout(() => {
                if (mapRef.current) {
                  mapRef.current.container.fitToViewport();
                }
              }, 100);
            });

            setTimeout(() => {
              if (mapRef.current) {
                const container = mapRef.current.container;
                if (container && container.getElement()) {
                  const element = container.getElement();
                  if (element.offsetWidth === 0 || element.offsetHeight === 0) {
                    container.fitToViewport();
                  }
                }
              }
              setMapInitialized(true);
            }, 100);
          } catch (error) {
            console.error("Error creating map instance:", error);
          }
        });
      } catch (error) {
        console.error("Error in map initialization:", error);
      }
    }
  };

  const checkMapReady = () => {
    return new Promise((resolve) => {
      const check = () => {
        if (mapRef.current && ymapsRef.current && mapInitialized) {
          resolve(true);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  const handleShowRoute = async () => {
    try {
      if (!showMap) {
        setShowMap(true);
        if (!window.ymaps) {
          const script = document.createElement("script");
          script.src = `https://api-maps.yandex.ru/2.1/?apikey=652d789a-d025-41e0-9f16-1c9b54dbd719&lang=ru_RU&load=package.standard,package.route,package.traffic`;
          script.async = true;
          script.onload = async () => {
            try {
              if (window.ymaps) {
                window.ymaps.ready(async () => {
                  try {
                    initMap();
                    await checkMapReady();
                    await buildRoute();
                  } catch (error) {
                    console.error("Error in map initialization:", error);
                  }
                });
              }
            } catch (error) {
              console.error("Error in ymaps ready callback:", error);
              toast.error("Ошибка при загрузке карты");
            }
          };
          script.onerror = (error) => {
            console.error("Error loading Yandex Maps:", error);
            toast.error("Ошибка при загрузке Яндекс.Карт");
          };
          document.head.appendChild(script);
        } else {
          try {
            window.ymaps.ready(async () => {
              try {
                if (!mapRef.current) {
                  initMap();
                  await checkMapReady();
                  await buildRoute();
                } else {
                  await buildRoute();
                }
              } catch (error) {
                console.error("Error in map initialization:", error);
              }
            });
          } catch (error) {
            console.error("Error in ymaps ready callback:", error);
            toast.error("Ошибка при загрузке карты");
          }
        }
      } else {
        try {
          await buildRoute();
        } catch (error) {
          console.error("Error building route:", error);
          toast.error("Ошибка при построении маршрута");
        }
      }
    } catch (error) {
      console.error("General error in handleShowRoute:", error);
      toast.error("Произошла ошибка при обработке запроса");
    }
  };

  useEffect(() => {
    const loadYandexMaps = () => {
      if (window.ymaps) {
        window.ymaps.ready(initMap);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=652d789a-d025-41e0-9f16-1c9b54dbd719&lang=ru_RU&load=package.standard,package.route,package.traffic`;
      script.async = true;
      script.onload = () => {
        if (window.ymaps) {
          window.ymaps.ready(initMap);
        }
      };
      script.onerror = (error) => {
        console.error("Error loading Yandex Maps:", error);
      };
      document.head.appendChild(script);
    };

    loadYandexMaps();

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (fromInput.length > 2) {
        const results = await getAddressSuggestions(fromInput, sessionToken);
        setFromOptions(results.map(r => r.address.formatted_address));
      } else {
        setFromOptions([]);
      }
    };
    fetchSuggestions();
  }, [fromInput, sessionToken]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (toInput.length > 2) {
        const results = await getAddressSuggestions(toInput, sessionToken);
        setToOptions(results.map(r => r.address.formatted_address));
      } else {
        setToOptions([]);
      }
    };
    fetchSuggestions();
  }, [toInput, sessionToken]);

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Создать поездку
      </Typography>
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={fromOptions}
              inputValue={fromInput}
              onInputChange={(_, value) => setFromInput(value)}
              value={formik.values.from}
              onChange={(_, value) => formik.setFieldValue('from', value || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  name="from"
                  label="Откуда"
                  error={formik.touched.from && Boolean(formik.errors.from)}
                  helperText={formik.touched.from && formik.errors.from}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={toOptions}
              inputValue={toInput}
              onInputChange={(_, value) => setToInput(value)}
              value={formik.values.to}
              onChange={(_, value) => formik.setFieldValue('to', value || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  name="to"
                  label="Куда"
                  error={formik.touched.to && Boolean(formik.errors.to)}
                  helperText={formik.touched.to && formik.errors.to}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleShowRoute}
              disabled={
                !formik.values.from || !formik.values.to || isRouteBuilding
              }
              sx={{ mb: 2 }}
            >
              {isRouteBuilding ? (
                <CircularProgress size={24} color="inherit" />
              ) : showMap ? (
                "Отобразить маршрут"
              ) : (
                "Показать карту"
              )}
            </Button>
            {showMap && (
              <Box
                sx={{
                  height: "400px",
                  width: "100%",
                  position: "relative",
                  overflow: "hidden",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  minHeight: "400px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  id="map"
                  style={{
                    height: "100%",
                    width: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    minHeight: "400px",
                    flex: 1,
                  }}
                />
              </Box>
            )}
            {estimatedTime && (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Примерное время в пути: {estimatedTime} минут
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Дата"
              name="date"
              value={formik.values.date}
              onChange={formik.handleChange}
              error={formik.touched.date && Boolean(formik.errors.date)}
              helperText={formik.touched.date && formik.errors.date}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: new Date().toISOString().split("T")[0],
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="time"
              label="Время"
              name="time"
              value={formik.values.time}
              onChange={formik.handleChange}
              error={formik.touched.time && Boolean(formik.errors.time)}
              helperText={formik.touched.time && formik.errors.time}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Количество мест"
              name="seats"
              value={formik.values.seats}
              onChange={formik.handleChange}
              error={formik.touched.seats && Boolean(formik.errors.seats)}
              helperText={formik.touched.seats && formik.errors.seats}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Цена"
              name="price"
              value={formik.values.price}
              onChange={formik.handleChange}
              error={formik.touched.price && Boolean(formik.errors.price)}
              helperText={formik.touched.price && formik.errors.price}
            />
          </Grid>
          <Grid item xs={12}>
            {cars.length === 1 ? (
              <TextField
                label="Автомобиль"
                value={`${cars[0].make} ${cars[0].model} (${cars[0].license_plate})`}
                fullWidth
                disabled
              />
            ) : (
              <FormControl fullWidth>
                <InputLabel>Автомобиль</InputLabel>
                <Select
                  name="carId"
                  value={formik.values.carId}
                  onChange={formik.handleChange}
                  error={formik.touched.carId && Boolean(formik.errors.carId)}
                >
                  {cars.map((car) => (
                    <MenuItem key={car.id} value={car.id}>
                      {car.make} {car.model} ({car.license_plate})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Описание"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              placeholder={`Например:
Выезд из Владивостока (ул. Ленина, 1) в 8:00
Остановка в Артеме (ТЦ "Гавань") в 8:30
Остановка в Уссурийске (ТЦ "Чайка") в 9:30
Прибытие в Находку (ул. Портовая, 5) в 11:00
Возможны остановки по пути для перекуса`}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : "Создать поездку"}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default CreateTrip;
