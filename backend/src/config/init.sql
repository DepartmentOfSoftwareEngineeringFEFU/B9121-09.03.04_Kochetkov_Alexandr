/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `fefu_drive` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `fefu_drive`;

CREATE TABLE IF NOT EXISTS `car` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `make` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `license_plate` varchar(255) DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `car_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `driver_application` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `licenseNumber` varchar(255) NOT NULL,
  `carNumber` varchar(255) NOT NULL,
  `carBrand` varchar(255) NOT NULL,
  `carModel` varchar(255) NOT NULL,
  `carColor` varchar(255) NOT NULL,
  `licensePhotoPath` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `driver_application_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `driver_info_change_request` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `licenseNumber` varchar(255) NOT NULL,
  `carNumber` varchar(255) NOT NULL,
  `carBrand` varchar(255) NOT NULL,
  `carModel` varchar(255) NOT NULL,
  `carColor` varchar(255) NOT NULL,
  `licensePhotoPath` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `driver_info_change_request_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `review` (
  `id` int NOT NULL AUTO_INCREMENT,
  `passengerId` int DEFAULT NULL,
  `tripId` int DEFAULT NULL,
  `text` text,
  `rating` int DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `passengerId` (`passengerId`),
  KEY `tripId` (`tripId`),
  CONSTRAINT `review_ibfk_1` FOREIGN KEY (`passengerId`) REFERENCES `user` (`id`),
  CONSTRAINT `review_ibfk_2` FOREIGN KEY (`tripId`) REFERENCES `trip` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `trip` (
  `id` int NOT NULL AUTO_INCREMENT,
  `driverId` int NOT NULL,
  `scheduledDate` datetime NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `actualArrivalTime` datetime DEFAULT NULL,
  `actualStartTime` datetime DEFAULT NULL,
  `carId` int DEFAULT NULL,
  `startAddress` varchar(255) DEFAULT NULL,
  `startLat` decimal(10,8) DEFAULT NULL,
  `startLng` decimal(11,8) DEFAULT NULL,
  `endAddress` varchar(255) DEFAULT NULL,
  `endLat` decimal(10,8) DEFAULT NULL,
  `endLng` decimal(11,8) DEFAULT NULL,
  `routePoints` json DEFAULT NULL,
  `estimatedDuration` int DEFAULT NULL,
  `availableSeats` int DEFAULT NULL,
  `description` text,
  `status` enum('created','active','completed','cancelled') DEFAULT 'created',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `driverId` (`driverId`),
  KEY `carId` (`carId`),
  CONSTRAINT `trip_ibfk_1` FOREIGN KEY (`driverId`) REFERENCES `user` (`id`),
  CONSTRAINT `trip_ibfk_2` FOREIGN KEY (`carId`) REFERENCES `car` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `trip_passengers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tripId` int NOT NULL,
  `userId` int NOT NULL,
  `status` enum('active','cancelled') DEFAULT 'active',
  `joinedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_trip_user` (`tripId`,`userId`),
  KEY `userId` (`userId`),
  CONSTRAINT `trip_passengers_ibfk_1` FOREIGN KEY (`tripId`) REFERENCES `trip` (`id`) ON DELETE CASCADE,
  CONSTRAINT `trip_passengers_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `trip_prediction` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tripId` int DEFAULT NULL,
  `predicted_time` int NOT NULL COMMENT 'Предполагаемое время в пути в минутах',
  `actual_time` int DEFAULT NULL COMMENT 'Фактическое время в пути в минутах',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `tripId` (`tripId`),
  CONSTRAINT `trip_prediction_ibfk_1` FOREIGN KEY (`tripId`) REFERENCES `trip` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `firstName` varchar(255) NOT NULL,
  `lastName` varchar(255) NOT NULL,
  `is_driver` tinyint(1) DEFAULT '0',
  `licenseNumber` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;