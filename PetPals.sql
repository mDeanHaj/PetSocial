-- MySQL dump 10.13  Distrib 8.0.34, for Win64 (x86_64)
--
-- Host: i0rgccmrx3at3wv3.cbetxkdyhwsb.us-east-1.rds.amazonaws.com    Database: rcei7skv3btl266x
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `images`
--

DROP TABLE IF EXISTS `images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `images` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `profile_id` int DEFAULT NULL,
  `image_url` varchar(255) NOT NULL,
  PRIMARY KEY (`image_id`),
  KEY `profile_id` (`profile_id`),
  CONSTRAINT `images_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profile` (`profile_id`)
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `images`
--

LOCK TABLES `images` WRITE;
/*!40000 ALTER TABLE `images` DISABLE KEYS */;
INSERT INTO `images` VALUES (1,1,'https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?'),(2,2,'https://images.unsplash.com/photo-1596854331442-3cf47265cefb?'),(3,3,'https://images.unsplash.com/photo-1527154300610-c1a126502eac?'),(4,4,'https://images.unsplash.com/photo-1645288059073-af3e9eb62a29?'),(5,5,'https://images.unsplash.com/photo-1655065127332-ae390f338bb4?'),(6,6,'https://images.unsplash.com/photo-1551730459-92db2a308d6a?'),(40,30,'https://cdn.pixabay.com/photo/2016/02/19/15/46/dog-1210559_960_720.jpg'),(41,61,'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Parrot.jpg/2560px-Parrot.jpg'),(48,68,'https://images.unsplash.com/photo-1602253739230-b0a32206f8d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MzAyMTd8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MDI0MDQ1NDV8&ixlib=rb-4.0.3&q=80&w=400'),(49,69,'https://images.unsplash.com/photo-1604434414547-3448fb96eba2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MzAyMTd8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MDI0MDQ2Mzh8&ixlib=rb-4.0.3&q=80&w=400'),(50,70,'https://images.unsplash.com/photo-1627110914806-708eb65b082f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1MzAyMTd8MHwxfHJhbmRvbXx8fHx8fHx8fDE3MDI0MDQ3MjN8&ixlib=rb-4.0.3&q=80&w=400');
/*!40000 ALTER TABLE `images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location`
--

DROP TABLE IF EXISTS `location`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location` (
  `location_id` int NOT NULL AUTO_INCREMENT,
  `profile_id` int DEFAULT NULL,
  `zipcode` varchar(10) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`location_id`),
  KEY `profile_id` (`profile_id`),
  CONSTRAINT `location_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `profile` (`profile_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location`
--

LOCK TABLES `location` WRITE;
/*!40000 ALTER TABLE `location` DISABLE KEYS */;
INSERT INTO `location` VALUES (1,41,'92841','Garden Grove','CA'),(2,59,'92704','Santa Ana','CA'),(4,61,'92704','Santa Ana','CA'),(6,1,'92614','Irvine','CA'),(7,2,'92614','Irvine','CA'),(8,3,'92704','Santa Ana','CA'),(9,4,'92704','Santa Ana','CA'),(10,5,'92653','Laguna Hills','CA'),(11,6,'92653','Laguna Hills','CA'),(12,30,'92656','Aliso Viejo','CA'),(18,68,'90888','Long Beach','CA'),(19,69,'78945','La Grange','TX'),(20,70,'92833','Fullerton','CA');
/*!40000 ALTER TABLE `location` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profile`
--

DROP TABLE IF EXISTS `profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profile` (
  `profile_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `species` varchar(50) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `gender` enum('male','female','unknown') DEFAULT NULL,
  `bio` text,
  PRIMARY KEY (`profile_id`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profile`
--

LOCK TABLES `profile` WRITE;
/*!40000 ALTER TABLE `profile` DISABLE KEYS */;
INSERT INTO `profile` VALUES (1,'Mike','dog',10,'male','I am a Dog.'),(2,'Vanilla','cat',12,'female','I am a cat'),(3,'Nemo','fish',2,'male','I am a fish'),(4,'Oreo','hamster',7,'female','I am a Hamster'),(5,'Cupcake','guinea pig',858,'male','I am a little Piggie'),(6,'Spike','Dog',23,'male','I am a nice doggy'),(30,'Floppy','Dog',16,'male','My first dog'),(61,'Pepe','Bird',45,'male','This was my parrot'),(68,'Sea Bisquit','Horse',20,'male','I run fast.'),(69,'Squirtle','Turtle',105,'male','I could of been a contender. '),(70,'wascally wabbit','Rabbit',15,'male','What\'s up doc?');
/*!40000 ALTER TABLE `profile` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-12-12 10:22:43

