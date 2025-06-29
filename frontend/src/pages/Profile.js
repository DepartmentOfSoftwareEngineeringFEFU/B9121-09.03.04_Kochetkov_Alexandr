import React, { useState, useEffect } from 'react';
import {
	Container,
	Typography,
	Box,
	TextField,
	Button,
	Paper,
	CircularProgress,
	List,
	ListItem,
	ListItemText,
	Divider,
	Snackbar,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Grid,
	Card,
	CardContent,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { authService, tripsService, reviewService } from '../services/apiService';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';
import Rating from '@mui/material/Rating';

function cleanAddress(address) {
	if (!address) return '';
	return address
		.replace('Приморский край, Владивосток, ', '')
		.trim();
}

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);
const MotionCard = motion(Card);
const MotionTypography = motion(Typography);
const MotionButton = motion(Button);
const MotionDialog = motion(Dialog);
const MotionDialogContent = motion(DialogContent);

const getColorCode = (colorName) => {
	const colorMap = {
		'Белый': '#FFFFFF',
		'Черный': '#000000',
		'Серый': '#808080',
		'Серебристый': '#C0C0C0',
		'Красный': '#FF0000',
		'Синий': '#0000FF',
		'Голубой': '#00BFFF',
		'Зеленый': '#008000',
		'Желтый': '#FFFF00',
		'Оранжевый': '#FFA500',
		'Коричневый': '#A52A2A',
		'Бежевый': '#F5F5DC',
		'Фиолетовый': '#800080',
		'Розовый': '#FFC0CB',
		'Бордовый': '#800000',
		'Золотой': '#FFD700'
	};

	return colorMap[colorName] || '#CCCCCC';
};

const tripStatuses = {
	created: 'Создана',
	driver_found: 'Водитель найден',
	driver_on_the_way: 'Водитель в пути',
	completed: 'Завершена',
	
}

// Допустимые буквы для номеров автомобилей в РФ
const VALID_CAR_NUMBER_LETTERS = ['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'];

const Profile = () => {
	const { updateProfile, user } = useAuth();
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		licenseNumber: ''
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [trips, setTrips] = useState([]);
	const [cars, setCars] = useState([]);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		severity: 'success'
	});
	const [driverDialogOpen, setDriverDialogOpen] = useState(false);
	const [driverForm, setDriverForm] = useState({
		licenseNumber: '',
		carNumber: '',
		carBrand: '',
		carModel: '',
		carColor: '',
		licensePhoto: null
	});
	const [driverFormErrors, setDriverFormErrors] = useState({
		licenseNumber: '',
		carNumber: '',
		carBrand: '',
		carModel: '',
		carColor: '',
		licensePhoto: ''
	});
	const [applicationStatus, setApplicationStatus] = useState(null);
	const [isDriver, setIsDriver] = useState(false);
	const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
	const [passwordForm, setPasswordForm] = useState({
		oldPassword: '',
		newPassword: '',
		confirmPassword: ''
	});
	const [passwordErrors, setPasswordErrors] = useState({
		oldPassword: '',
		newPassword: '',
		confirmPassword: ''
	});
	const [driverInfoChangeDialogOpen, setDriverInfoChangeDialogOpen] = useState(false);
	const [driverInfoChangeForm, setDriverInfoChangeForm] = useState({
		licenseNumber: '',
		carNumber: '',
		carBrand: '',
		carModel: '',
		carColor: '',
		licensePhoto: null
	});
	const [driverInfoChangeErrors, setDriverInfoChangeErrors] = useState({});
	const [driverInfoChangeRequests, setDriverInfoChangeRequests] = useState([]);
	const [joinedTrips, setJoinedTrips] = useState([]);
	const [driverReviews, setDriverReviews] = useState([]);
	const [driverAvgRating, setDriverAvgRating] = useState(null);

	useEffect(() => {
		const fetchAllData = async () => {
			try {
				setLoading(true);
				const userResponse = await authService.getProfile();

				setFormData({
					firstName: userResponse.data.firstName,
					lastName: userResponse.data.lastName,
					email: userResponse.data.email,
					licenseNumber: userResponse.data.licenseNumber || ''
				});

				const isUserDriver = Boolean(userResponse.data.is_driver);
				setIsDriver(isUserDriver);

				const applicationResponse = await authService.getDriverApplicationStatus();
				setApplicationStatus(applicationResponse.data);

				if (isUserDriver) {
					try {
						const carsResponse = await authService.getUserCars();
						setCars(carsResponse.data);
					} catch (err) {
						console.error('Ошибка при загрузке автомобилей:', err);
						setCars([]);
					}
				}

				try {
					const tripsData = await tripsService.getMyTrips();
					setTrips(tripsData);
				} catch (err) {
					console.error('Ошибка при загрузке поездок:', err);
					setTrips([]);
				}

				try {
					const joined = await tripsService.getJoinedTrips();
					setJoinedTrips(joined);
				} catch (err) {
					console.error('Ошибка при загрузке завершённых поездок пассажира:', err);
					setJoinedTrips([]);
				}

				setError(null);
			} catch (err) {
				setError(err.response?.data?.message || 'Ошибка при загрузке данных');
				console.error('Ошибка при загрузке данных пользователя:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchAllData();
	}, []);

	useEffect(() => {
		if (isDriver) {
			loadDriverInfoChangeRequests();
			if (user?.id) {
				reviewService.getDriverReviews(user.id).then(reviews => {
					setDriverReviews(reviews);
					if (reviews.length > 0) {
						const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
						setDriverAvgRating(avg);
					} else {
						setDriverAvgRating(null);
					}
				}).catch(() => {
					setDriverReviews([]);
					setDriverAvgRating(null);
				});
			}
		}
	}, [isDriver, user?.id]);

	const loadDriverInfoChangeRequests = async () => {
		try {
			const requests = await authService.getDriverInfoChangeRequests();
			setDriverInfoChangeRequests(requests);
		} catch (error) {
			console.error('Ошибка при загрузке заявок:', error);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const updateData = {
				firstName: formData.firstName,
				lastName: formData.lastName
			};
			await updateProfile(updateData);
			setError(null);
			setSnackbar({
				open: true,
				message: 'Профиль успешно обновлен',
				severity: 'success'
			});
		} catch (err) {
			setError(err.response?.data?.message || 'Ошибка при обновлении профиля');
			setSnackbar({
				open: true,
				message: err.response?.data?.message || 'Ошибка при обновлении профиля',
				severity: 'error'
			});
		}
	};

	const validateLicenseNumber = (value) => {
		if (!value) return 'Номер водительского удостоверения обязателен';
		if (!/^\d{10}$/.test(value)) return 'Номер водительского удостоверения должен состоять из 10 цифр';
		return '';
	};

	const validateCarNumber = (value) => {
		if (!value) return 'Номер автомобиля обязателен';

		const regex = new RegExp(`^[${VALID_CAR_NUMBER_LETTERS.join('')}]\\d{3}[${VALID_CAR_NUMBER_LETTERS.join('')}]{2}$`);

		if (!regex.test(value)) {
			return 'Номер должен быть в формате: буква, 3 цифры, 2 буквы. Используйте только буквы А, В, Е, К, М, Н, О, Р, С, Т, У, Х';
		}

		return '';
	};

	const validateCarBrand = (value) => {
		if (!value) return 'Марка автомобиля обязательна';
		if (!/^[А-ЯA-Z]/.test(value)) return 'Марка должна начинаться с заглавной буквы';
		return '';
	};

	const validateCarModel = (value) => {
		if (!value) return 'Модель автомобиля обязательна';
		if (!/^[А-ЯA-Z]/.test(value)) return 'Модель должна начинаться с заглавной буквы';
		return '';
	};

	const validateCarColor = (value) => {
		if (!value) return 'Цвет автомобиля обязателен';
		if (!/^[А-ЯA-Z]/.test(value)) return 'Цвет должен начинаться с заглавной буквы';
		return '';
	};

	const handleDriverFormChange = (field, value) => {
		setDriverForm({
			...driverForm,
			[field]: value
		});

		let errorMessage = '';
		switch (field) {
			case 'licenseNumber':
				errorMessage = validateLicenseNumber(value);
				break;
			case 'carNumber':
				errorMessage = validateCarNumber(value);
				break;
			case 'carBrand':
				errorMessage = validateCarBrand(value);
				break;
			case 'carModel':
				errorMessage = validateCarModel(value);
				break;
			case 'carColor':
				errorMessage = validateCarColor(value);
				break;
			default:
				break;
		}

		setDriverFormErrors({
			...driverFormErrors,
			[field]: errorMessage
		});
	};

	const validateForm = () => {
		const errors = {
			licenseNumber: validateLicenseNumber(driverForm.licenseNumber),
			carNumber: validateCarNumber(driverForm.carNumber),
			carBrand: validateCarBrand(driverForm.carBrand),
			carModel: validateCarModel(driverForm.carModel),
			carColor: validateCarColor(driverForm.carColor)
		};

		setDriverFormErrors(errors);

		return !Object.values(errors).some(error => error !== '');
	};

	const handleDriverSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		try {
			const formData = new FormData();
			formData.append('licenseNumber', driverForm.licenseNumber);
			formData.append('carNumber', driverForm.carNumber);
			formData.append('carBrand', driverForm.carBrand);
			formData.append('carModel', driverForm.carModel);
			formData.append('carColor', driverForm.carColor);
			formData.append('licensePhoto', driverForm.licensePhoto);

			await authService.submitDriverApplication(formData);
			setDriverDialogOpen(false);
			setSnackbar({
				open: true,
				message: 'Заявка на водителя успешно отправлена',
				severity: 'success'
			});
			const response = await authService.getDriverApplicationStatus();
			setApplicationStatus(response.data);
		} catch (err) {
			setSnackbar({
				open: true,
				message: err.response?.data?.message || 'Ошибка при отправке заявки',
				severity: 'error'
			});
		}
	};

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setDriverForm(prev => ({
				...prev,
				licensePhoto: file
			}));
			setDriverFormErrors(prev => ({
				...prev,
				licensePhoto: ''
			}));
		}
	};

	const handleCloseSnackbar = () => {
		setSnackbar({ ...snackbar, open: false });
	};

	const handlePasswordChange = async (e) => {
		e.preventDefault();

		setPasswordErrors({
			oldPassword: '',
			newPassword: '',
			confirmPassword: ''
		});

		let hasErrors = false;
		const newErrors = {};

		if (passwordForm.newPassword.length < 6) {
			newErrors.newPassword = 'Пароль должен содержать минимум 6 символов';
			hasErrors = true;
		}

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			newErrors.confirmPassword = 'Пароли не совпадают';
			hasErrors = true;
		}

		if (passwordForm.newPassword === passwordForm.oldPassword) {
			newErrors.newPassword = 'Новый пароль должен отличаться от старого';
			hasErrors = true;
		}

		if (hasErrors) {
			setPasswordErrors(newErrors);
			return;
		}

		try {
			await authService.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
			setPasswordDialogOpen(false);
			setPasswordForm({
				oldPassword: '',
				newPassword: '',
				confirmPassword: ''
			});
			setSnackbar({
				open: true,
				message: 'Пароль успешно изменен',
				severity: 'success'
			});
		} catch (error) {
			if (error.response?.status === 401) {
				setPasswordErrors({
					...passwordErrors,
					oldPassword: 'Неверный текущий пароль'
				});
			} else {
				setSnackbar({
					open: true,
					message: error.response?.data?.message || 'Ошибка при изменении пароля',
					severity: 'error'
				});
			}
		}
	};

	const handleOpenDriverInfoChangeDialog = () => {

		const newFormData = {
			licenseNumber: formData.licenseNumber || '',
			carNumber: cars?.[0]?.license_plate || '',
			carBrand: cars?.[0]?.make || '',
			carModel: cars?.[0]?.model || '',
			carColor: cars?.[0]?.color || ''
		};

		setDriverInfoChangeForm(newFormData);
		setDriverInfoChangeDialogOpen(true);
	};

	const validateDriverInfoChangeForm = () => {
		const errors = {};

		if (!driverInfoChangeForm.licenseNumber) {
			errors.licenseNumber = 'Номер водительского удостоверения обязателен';
		} else if (!/^\d{10}$/.test(driverInfoChangeForm.licenseNumber)) {
			errors.licenseNumber = 'Номер водительского удостоверения должен состоять из 10 цифр';
		}

		if (!driverInfoChangeForm.carNumber) {
			errors.carNumber = 'Номер автомобиля обязателен';
		} else {
			const regex = new RegExp(`^[${VALID_CAR_NUMBER_LETTERS.join('')}]\\d{3}[${VALID_CAR_NUMBER_LETTERS.join('')}]{2}$`);
			if (!regex.test(driverInfoChangeForm.carNumber)) {
				errors.carNumber = 'Номер должен быть в формате: буква, 3 цифры, 2 буквы. Используйте только буквы А, В, Е, К, М, Н, О, Р, С, Т, У, Х';
			}
		}

		if (!driverInfoChangeForm.carBrand) {
			errors.carBrand = 'Марка автомобиля обязательна';
		} else if (!/^[А-ЯA-Z]/.test(driverInfoChangeForm.carBrand)) {
			errors.carBrand = 'Марка должна начинаться с заглавной буквы';
		}

		if (!driverInfoChangeForm.carModel) {
			errors.carModel = 'Модель автомобиля обязательна';
		} else if (!/^[А-ЯA-Z]/.test(driverInfoChangeForm.carModel)) {
			errors.carModel = 'Модель должна начинаться с заглавной буквы';
		}

		if (!driverInfoChangeForm.carColor) {
			errors.carColor = 'Цвет автомобиля обязателен';
		} else if (!/^[А-ЯA-Z]/.test(driverInfoChangeForm.carColor)) {
			errors.carColor = 'Цвет должен начинаться с заглавной буквы';
		}

		setDriverInfoChangeErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleDriverInfoChangeFile = (e) => {
		const file = e.target.files[0];
		if (file) {
			setDriverInfoChangeForm(prev => ({
				...prev,
				licensePhoto: file
			}));
			setDriverInfoChangeErrors(prev => ({
				...prev,
				licensePhoto: ''
			}));
		}
	};

	const handleDriverInfoChangeSubmit = async (e) => {
		e.preventDefault();

		if (!validateDriverInfoChangeForm()) {
			return;
		}

		try {
			const formData = new FormData();
			formData.append('licenseNumber', driverInfoChangeForm.licenseNumber);
			formData.append('carNumber', driverInfoChangeForm.carNumber);
			formData.append('carBrand', driverInfoChangeForm.carBrand);
			formData.append('carModel', driverInfoChangeForm.carModel);
			formData.append('carColor', driverInfoChangeForm.carColor);
			if (driverInfoChangeForm.licensePhoto) {
				formData.append('licensePhoto', driverInfoChangeForm.licensePhoto);
			}
			await authService.submitDriverInfoChange(formData);
			setDriverInfoChangeDialogOpen(false);
			setSnackbar({
				open: true,
				message: 'Заявка на изменение данных успешно отправлена',
				severity: 'success'
			});
			loadDriverInfoChangeRequests();
		} catch (error) {
			setSnackbar({
				open: true,
				message: error.response?.data?.message || 'Ошибка при отправке заявки',
				severity: 'error'
			});
		}
	};

	if (loading) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Container maxWidth="md">
			<Box mt={4}>
				<MotionTypography
					variant="h4"
					gutterBottom
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					Профиль
				</MotionTypography>

				<MotionPaper
					elevation={2}
					sx={{ p: 3, mb: 4 }}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
					<form onSubmit={handleSubmit}>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={6}>
								<TextField
									fullWidth
									label="Имя"
									value={formData.firstName}
									onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
									margin="normal"
									required
								/>
							</Grid>
							<Grid item xs={12} sm={6}>
								<TextField
									fullWidth
									label="Фамилия"
									value={formData.lastName}
									onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
									margin="normal"
									required
								/>
							</Grid>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label="Email"
									value={formData.email}
									disabled
									margin="normal"
								/>
							</Grid>
							{formData.licenseNumber !== "" && (
								<Grid item xs={12}>
									<TextField
										fullWidth
										label="Номер водительского удостоверения"
										value={formData.licenseNumber}
										disabled
										margin="normal"
									/>
								</Grid>
							)}
						</Grid>
						<Button
							type="button"
							variant="outlined"
							color="primary"
							sx={{ mt: 2, mr: 2 }}
							onClick={() => setPasswordDialogOpen(true)}
						>
							Изменить пароль
						</Button>
						<Button
							type="submit"
							variant="contained"
							color="primary"
							sx={{ mt: 2 }}
						>
							Сохранить изменения
						</Button>
					</form>
				</MotionPaper>

				{/* Блок с информацией водителя отображается только если пользователь - водитель */}
				{isDriver && (
					<MotionPaper
						elevation={2}
						sx={{ p: 3, mb: 4 }}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.3 }}
					>
						<MotionTypography
							variant="h6"
							gutterBottom
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5, delay: 0.4 }}
						>
							Информация водителя
						</MotionTypography>

						<Button
							variant="contained"
							color="primary"
							onClick={handleOpenDriverInfoChangeDialog}
							sx={{ mb: 2 }}
						>
							Изменить данные водителя
						</Button>

						{driverInfoChangeRequests.length > 0 && (
							<Box sx={{ mt: 2 }}>
								<Typography variant="subtitle1" gutterBottom>
									История заявок на изменение данных
								</Typography>
								<List>
									{driverInfoChangeRequests.map((request) => (
										<ListItem key={request.id}>
											<ListItemText
												primary={`Заявка от ${new Date(request.createdAt).toLocaleDateString()}`}
												secondary={
													<>
														<Typography component="span" variant="body2" color="textPrimary">
															Статус: {request.status === 'pending' ? 'На рассмотрении' :
																request.status === 'approved' ? 'Одобрена' : 'Отклонена'}
														</Typography>
														<br />
														<Typography component="span" variant="body2" color="textSecondary">
															Новые данные: {request.carBrand} {request.carModel}, {request.carColor}
														</Typography>
													</>
												}
											/>
										</ListItem>
									))}
								</List>
							</Box>
						)}

						{cars && cars.length > 0 ? (
							<>
								<MotionTypography
									variant="h6"
									gutterBottom
									sx={{ mt: 2 }}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ duration: 0.5, delay: 0.5 }}
								>
									Мои автомобили
								</MotionTypography>
								<Grid container spacing={2}>
									{cars.map((car, index) => (
										<Grid item xs={12} key={car?.car_id || index}>
											<MotionCard
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.5, delay: index * 0.1 }}
												whileHover={{ y: -5, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}
											>
												<CardContent>
													<MotionTypography
														variant="h6"
														gutterBottom
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
													>
														{car?.make || 'Не указано'} {car?.model || ''}
													</MotionTypography>
													<MotionTypography
														variant="body1"
														gutterBottom
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
													>
														<strong>Регистрационный номер:</strong> {car?.license_plate || car?.licence_plate || 'Не указан'}
													</MotionTypography>
													<MotionTypography
														variant="body1"
														gutterBottom
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
													>
														<strong>Цвет:</strong> {car?.color || 'Не указан'}
														{car?.color && (
															<MotionBox
																display="inline-block"
																width={20}
																height={20}
																bgcolor={getColorCode(car.color)}
																borderRadius="50%"
																border="1px solid #ccc"
																ml={1}
																verticalAlign="middle"
																sx={{ position: 'relative', top: '4px' }}
																initial={{ scale: 0 }}
																animate={{ scale: 1 }}
																transition={{
																	type: "spring",
																	stiffness: 400,
																	damping: 10,
																	delay: 0.5 + index * 0.1
																}}
																whileHover={{
																	scale: 1.2,
																	boxShadow: '0 0 8px rgba(0,0,0,0.3)'
																}}
															/>
														)}
													</MotionTypography>
												</CardContent>
											</MotionCard>
										</Grid>
									))}
								</Grid>
							</>
						) : (
							<Typography variant="body2" color="textSecondary">
								Автомобили не найдены
							</Typography>
						)}

						{/* Блок отзывов и рейтинга для водителя */}
						<MotionPaper elevation={2} sx={{ p: 3, mb: 4 }}>
							<Typography variant="h6" gutterBottom>Отзывы пассажиров</Typography>
							{driverAvgRating !== null ? (
								<Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 1, sm: 2 } }}>
									<Rating value={driverAvgRating} precision={0.1} readOnly size={window.innerWidth < 600 ? 'small' : 'large'} sx={{ fontSize: { xs: '1.5rem', sm: '2.5rem' } }} />
									<Typography variant="h6" sx={{ ml: { xs: 1, sm: 2 }, fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>{driverAvgRating.toFixed(1)} / 5.0</Typography>
									<Typography variant="body2" sx={{ ml: { xs: 1, sm: 2 }, color: '#888', fontSize: { xs: '0.95rem', sm: '1rem' } }}>({driverReviews.length} отзыв{driverReviews.length === 1 ? '' : driverReviews.length < 5 ? 'а' : 'ов'})</Typography>
								</Box>
							) : (
								<Typography variant="body2" color="textSecondary" sx={{ mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.95rem', sm: '1rem' } }}>Пока нет отзывов</Typography>
							)}
							<List sx={{ p: 0 }}>
								{driverReviews.map((review) => (
									<React.Fragment key={review.id}>
										<ListItem alignItems="flex-start" sx={{ px: { xs: 1, sm: 2 }, py: { xs: 0.5, sm: 1 } }}>
											<ListItemText
												primary={<>
													<Rating value={review.rating} readOnly size="small" sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }} />
													<span style={{ marginLeft: 8, fontWeight: 500, fontSize: window.innerWidth < 600 ? '1rem' : '1.1rem' }}>{review.firstName} {review.lastName}</span>
												</>}
												secondary={<>
													{review.text && <Typography variant="body2" sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}>{review.text}</Typography>}
													<Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>{new Date(review.createdAt).toLocaleDateString()}</Typography>
												</>}
											/>
										</ListItem>
										<Divider />
									</React.Fragment>
								))}
							</List>
						</MotionPaper>
					</MotionPaper>
				)}

				{/* Блок статуса водителя отображается только если пользователь НЕ водитель */}
				{!isDriver && (
					<MotionPaper
						elevation={2}
						sx={{ p: 3, mb: 4 }}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.3 }}
					>
						<MotionTypography
							variant="h6"
							gutterBottom
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5, delay: 0.4 }}
						>
							Статус водителя
						</MotionTypography>

						{applicationStatus && applicationStatus.status === 'pending' ? (
							<Typography color="info">
								Ваша заявка на водителя находится на рассмотрении
							</Typography>
						) : applicationStatus && applicationStatus.status === 'approved' ? (
							<Typography color="success">
								Вы являетесь водителем
							</Typography>
						) : applicationStatus && applicationStatus.status === 'rejected' ? (
							<Typography color="error">
								Ваша заявка на водителя была отклонена
							</Typography>
						) : (
							<Button
								variant="contained"
								color="primary"
								onClick={() => setDriverDialogOpen(true)}
							>
								Стать водителем
							</Button>
						)}
					</MotionPaper>
				)}

				{error && (
					<Typography color="error" variant="body1" gutterBottom>
						{error}
					</Typography>
				)}
				{isDriver && (<>
					<MotionTypography
						variant="h5"
						gutterBottom
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.5, delay: 0.6 }}
					>
						Мои поездки
					</MotionTypography>

					{trips && trips.length > 0 ? (
						<MotionPaper
							elevation={2}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.7 }}
						>
							<List>
								{trips.map((trip, index) => (
									<motion.div
										key={trip.id}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
									>
										<ListItem alignItems="flex-start">
											<ListItemText
												primary={
													<Typography variant="subtitle1">
														{cleanAddress(trip.startAddress)} → {cleanAddress(trip.endAddress)}
													</Typography>
												}
												secondary={
													<>
														<Typography component="span" variant="body2" color="textPrimary">
															{format(new Date(trip.scheduledDate), 'PPPp', { locale: ru })}
														</Typography>
														<br />
														<Typography component="span" variant="body2" color="textSecondary">
															{trip.driverId ? 'Вы водитель' : 'Вы пассажир'}
														</Typography>
														<br />
														<Typography component="span" variant="body2" color="textSecondary">
															Статус: {tripStatuses[trip.status]}
														</Typography>
													</>
												}
											/>
										</ListItem>
										{index < trips.length - 1 && <Divider />}
									</motion.div>
								))}
							</List>
						</MotionPaper>
					) : (
						<Typography variant="body1" color="textSecondary">
							У вас пока нет поездок
						</Typography>
					)}
				</>)}


				{/* Блок завершённых поездок пассажира */}
				{!isDriver && (
					<>
						<MotionTypography
							variant="h5"
							gutterBottom
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.5, delay: 0.8 }}
							sx={{ mt: 4 }}
						>
							Завершённые поездки, где вы были пассажиром
						</MotionTypography>
						{joinedTrips && joinedTrips.length > 0 ? (
							<MotionPaper
								elevation={2}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.9 }}
							>
								<List>
									{joinedTrips.map((trip, idx) => (
										<motion.div
											key={trip.id}
											initial={{ opacity: 0, x: -20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ duration: 0.5, delay: 1 + idx * 0.1 }}
										>
											<ListItem alignItems="flex-start">
												<ListItemText
													primary={
														<Typography variant="subtitle1">
															{(cleanAddress(trip.startAddress) || cleanAddress(trip.startLocation)) + ' → ' + (cleanAddress(trip.endAddress) || cleanAddress(trip.endLocation))}
														</Typography>
													}
													secondary={
														<>
															<Typography component="span" variant="body2" color="textPrimary">
																{format(new Date(trip.scheduledDate), 'PPPp', { locale: ru })}
															</Typography>
															<br />
															<Typography component="span" variant="body2" color="textSecondary">
																Водитель: {trip.driverFirstName} {trip.driverLastName}
															</Typography>
															<br />
															<Typography component="span" variant="body2" color="textSecondary">
																Цена: {trip.price} ₽
															</Typography>
															{trip.estimatedDuration && (
																<>
																	<br />
																	Примерное время в пути: {trip.estimatedDuration} мин.
																</>
															)}
															{trip.actual_time && (
																<>
																	<br />
																	Фактическое время в пути: {trip.actual_time} мин.
																</>
															)}
															<br />
															<Typography component="span" variant="body2" color="textSecondary">
																Статус: {tripStatuses[trip.status]}
															</Typography>
														</>
													}
												/>
											</ListItem>
											{idx < joinedTrips.length - 1 && <Divider />}
										</motion.div>
									))}
								</List>
							</MotionPaper>
						) : (
							<Typography variant="body1" color="textSecondary">
								У вас пока нет завершённых поездок, где вы были пассажиром
							</Typography>
						)}
					</>
				)}
			</Box>

			<MotionDialog
				open={driverDialogOpen}
				onClose={() => setDriverDialogOpen(false)}
				fullWidth
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.8 }}
				transition={{ duration: 0.3 }}
			>
				<DialogTitle>Подать заявку на водителя</DialogTitle>
				<DialogContent sx={{ minWidth: 500 }}>
					<form onSubmit={handleDriverSubmit}>
						<Grid container spacing={2}>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label="Серия и номер водительского удостоверения"
									value={driverForm.licenseNumber}
									onChange={(e) => handleDriverFormChange('licenseNumber', e.target.value)}
									error={!!driverFormErrors.licenseNumber}
									helperText={driverFormErrors.licenseNumber}
									required
									style={{ marginTop: 8 }}
								/>
							</Grid>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label="Номер автомобиля (без региона)"
									value={driverForm.carNumber}
									onChange={(e) => handleDriverFormChange('carNumber', e.target.value)}
									error={!!driverFormErrors.carNumber}
									helperText={driverFormErrors.carNumber}
									required
								/>
							</Grid>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label="Марка автомобиля"
									value={driverForm.carBrand}
									onChange={(e) => handleDriverFormChange('carBrand', e.target.value)}
									error={!!driverFormErrors.carBrand}
									helperText={driverFormErrors.carBrand}
									required
								/>
							</Grid>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label="Модель автомобиля"
									value={driverForm.carModel}
									onChange={(e) => handleDriverFormChange('carModel', e.target.value)}
									error={!!driverFormErrors.carModel}
									helperText={driverFormErrors.carModel}
									required
								/>
							</Grid>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label="Цвет автомобиля"
									value={driverForm.carColor}
									onChange={(e) => handleDriverFormChange('carColor', e.target.value)}
									error={!!driverFormErrors.carColor}
									helperText={driverFormErrors.carColor}
									required
								/>
							</Grid>
							<Grid item xs={12}>
								<Box>
									<Typography variant="body2" gutterBottom>
										Фотография водительского удостоверения <span style={{ color: 'red' }}>*</span>
									</Typography>
									<input
										type="file"
										accept="image/*"
										onChange={handleFileChange}
										required
										style={{ marginTop: 8 }}
									/>
									{driverFormErrors.licensePhoto && (
										<Typography color="error" variant="caption">
											{driverFormErrors.licensePhoto}
										</Typography>
									)}
								</Box>
							</Grid>
						</Grid>
						<Button type="submit" color="primary" fullWidth>
							Отправить заявку
						</Button>
					</form>
				</DialogContent>
			</MotionDialog>

			<MotionDialog
				open={passwordDialogOpen}
				onClose={() => setPasswordDialogOpen(false)}
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.8 }}
				transition={{ duration: 0.3 }}
			>
				<DialogTitle>Изменение пароля</DialogTitle>
				<form onSubmit={handlePasswordChange}>
					<MotionDialogContent
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.4 }}
					>
						<Grid container spacing={2}>
							<Grid item xs={12}>
								<motion.div
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.3, duration: 0.4 }}
								>
									<TextField
										fullWidth
										label="Текущий пароль"
										type="password"
										value={passwordForm.oldPassword}
										onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
										error={!!passwordErrors.oldPassword}
										helperText={passwordErrors.oldPassword}
										required
									/>
								</motion.div>
							</Grid>
							<Grid item xs={12}>
								<motion.div
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.4, duration: 0.4 }}
								>
									<TextField
										fullWidth
										label="Новый пароль"
										type="password"
										value={passwordForm.newPassword}
										onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
										error={!!passwordErrors.newPassword}
										helperText={passwordErrors.newPassword}
										required
									/>
								</motion.div>
							</Grid>
							<Grid item xs={12}>
								<motion.div
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.5, duration: 0.4 }}
								>
									<TextField
										fullWidth
										label="Подтвердите новый пароль"
										type="password"
										value={passwordForm.confirmPassword}
										onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
										error={!!passwordErrors.confirmPassword}
										helperText={passwordErrors.confirmPassword}
										required
									/>
								</motion.div>
							</Grid>
						</Grid>
					</MotionDialogContent>
					<DialogActions>
						<Button onClick={() => setPasswordDialogOpen(false)}>Отмена</Button>
						<MotionButton
							type="submit"
							variant="contained"
							color="primary"
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							Изменить пароль
						</MotionButton>
					</DialogActions>
				</form>
			</MotionDialog>

			<MotionDialog
				open={driverInfoChangeDialogOpen}
				onClose={() => setDriverInfoChangeDialogOpen(false)}
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.8 }}
				transition={{ duration: 0.3 }}
			>
				<DialogTitle>Изменение данных водителя</DialogTitle>
				<form onSubmit={handleDriverInfoChangeSubmit}>
					<MotionDialogContent
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2, duration: 0.4 }}
					>
						<Grid container spacing={2}>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label="Номер водительского удостоверения"
									value={driverInfoChangeForm.licenseNumber}
									onChange={(e) => setDriverInfoChangeForm({ ...driverInfoChangeForm, licenseNumber: e.target.value })}
									error={!!driverInfoChangeErrors.licenseNumber}
									helperText={driverInfoChangeErrors.licenseNumber}
									required
								/>
							</Grid>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label="Номер автомобиля"
									value={driverInfoChangeForm.carNumber}
									onChange={(e) => setDriverInfoChangeForm({ ...driverInfoChangeForm, carNumber: e.target.value })}
									error={!!driverInfoChangeErrors.carNumber}
									helperText={driverInfoChangeErrors.carNumber}
									required
								/>
							</Grid>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label="Марка автомобиля"
									value={driverInfoChangeForm.carBrand}
									onChange={(e) => setDriverInfoChangeForm({ ...driverInfoChangeForm, carBrand: e.target.value })}
									error={!!driverInfoChangeErrors.carBrand}
									helperText={driverInfoChangeErrors.carBrand}
									required
								/>
							</Grid>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label="Модель автомобиля"
									value={driverInfoChangeForm.carModel}
									onChange={(e) => setDriverInfoChangeForm({ ...driverInfoChangeForm, carModel: e.target.value })}
									error={!!driverInfoChangeErrors.carModel}
									helperText={driverInfoChangeErrors.carModel}
									required
								/>
							</Grid>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label="Цвет автомобиля"
									value={driverInfoChangeForm.carColor}
									onChange={(e) => setDriverInfoChangeForm({ ...driverInfoChangeForm, carColor: e.target.value })}
									error={!!driverInfoChangeErrors.carColor}
									helperText={driverInfoChangeErrors.carColor}
									required
								/>
							</Grid>
							<Grid item xs={12}>
								<Box>
									<Typography variant="body2" gutterBottom>
										Фотография водительского удостоверения <span style={{ color: 'red' }}>*</span>
									</Typography>
									<input
										type="file"
										accept="image/*"
										onChange={handleDriverInfoChangeFile}
										required
										style={{ marginTop: 8 }}
									/>
									{driverInfoChangeErrors.licensePhoto && (
										<Typography color="error" variant="caption">
											{driverInfoChangeErrors.licensePhoto}
										</Typography>
									)}
								</Box>
							</Grid>
						</Grid>
					</MotionDialogContent>
					<DialogActions>
						<Button onClick={() => setDriverInfoChangeDialogOpen(false)}>Отмена</Button>
						<Button type="submit" variant="contained" color="primary">
							Отправить заявку
						</Button>
					</DialogActions>
				</form>
			</MotionDialog>

			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity={snackbar.severity}
					sx={{ width: '100%' }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Container>
	);
};

export default Profile; 