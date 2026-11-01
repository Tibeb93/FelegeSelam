-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: aemade_selam
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` (`settingKey`, `settingValue`, `createdAt`, `updatedAt`) VALUES ('about_contact','{\"aboutAm\":\"አዕማደ ሰላም ሰንበት ትምህርት ቤት በፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል (ፍኖተ ሰላም፣ ምዕራብ ጎጃም) ስር የሚገኝ መንፈሳዊ ተቋም ሲሆን ወጣቶችንና ምዕመናንን በሃይማኖትና በምግባር ለማነጽ ይሠራል።\",\"aboutEn\":\"Aemade Selam Sunday School is a spiritual institution under Felegeselam Kidus Giyorgis Cathedral in Finote Selam, West Gojjam, dedicated to edifying youth and parishioners in Orthodox faith and virtuous deeds.\",\"missionAm\":\"ሕፃናትንና ወጣቶችን በኦርቶዶክሳዊት ተዋሕዶ እምነት ማነጽና ለቤተክርስቲያንና ለአገር የሚጠቅሙ ዜጎች ማድረግ።\",\"missionEn\":\"Nurturing children and youth in Orthodox Tewahedo faith and shaping productive citizens for Church and society.\",\"visionAm\":\"በሃይማኖት የጸና፣ በምግባር ያበራና በትምህርት የበለጸገ መንፈሳዊ ትውልድ ማየት።\",\"visionEn\":\"To see a spiritual generation steadfast in faith, radiant in virtuous deeds, and enriched in divine knowledge.\",\"phone\":\"\",\"alternatePhone\":\"\",\"email\":\"\",\"address\":\"ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም\",\"mapLink\":\"\",\"socialLinks\":{\"telegram\":\"\",\"youtube\":\"\",\"facebook\":\"\",\"tiktok\":\"\"},\"footerCopyrightAm\":\"© ፳፻፲፰ አዕማደ ሰላም ሰንበት ትምህርት ቤት። መብቱ በሕግ የተጠበቀ ነው።\",\"footerCopyrightEn\":\"© 2026 Aemade Selam Sunday School. All rights reserved.\"}','2026-10-27 09:36:23.705','2026-10-27 09:36:23.705'),('contact_details','{\"phone\":\"\",\"alternatePhone\":\"\",\"email\":\"\",\"address\":\"ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም\",\"poBox\":\"\"}','2026-10-17 17:56:57.387','2026-10-27 09:36:23.698'),('general','{\"churchNameAm\":\"የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን\",\"schoolNameAm\":\"አዕማደ ሰላም ሰንበት ትምህርት ቤት\",\"mottoAm\":\"በሃይማኖትና በምግባር የጸና ትውልድ እናፈራለን\",\"contactPhone\":\"+251911000000\",\"contactEmail\":\"contact@aemade.org\"}','2026-10-17 17:56:55.841','2026-10-17 17:56:55.841'),('home_content','{\"heroTitleAm\":\"አዕማደ ሰላም ሰንበት ትምህርት ቤት \",\"heroTitleEn\":\"Welcome to the Sunday School of Felegeselam Kidus Giyorgis Cathedral\",\"heroSubtitleAm\":\"በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተክርስቲያን እምነትና ሥርዓትን የሚማሩበትና መንፈሳዊ ሕይወትዎን የሚያዳብሩበት መድረክ\",\"heroSubtitleEn\":\"A platform to learn the faith and order of the Ethiopian Orthodox Tewahedo Church and cultivate spiritual growth\",\"welcomeMessageAm\":\"እንኳን ደህና መጡ! በፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል አዕማደ ሰላም ሰንበት ትምህርት ቤት ተማሪዎችና ምዕመናን አገልግሎት።\",\"welcomeMessageEn\":\"Welcome to the Sunday School of Felegeselam Kidus Giyorgis Cathedral in Finote Selam, West Gojjam.\",\"primaryCtaTextAm\":\"የአባላት ምዝገባ\",\"primaryCtaTextEn\":\"Member Registration\",\"primaryCtaLink\":\"/register\",\"secondaryCtaTextAm\":\"ትምህርቶችን ይመልከቱ\",\"secondaryCtaTextEn\":\"Explore Courses\",\"secondaryCtaLink\":\"/courses\",\"sections\":[{\"id\":\"sinksar\",\"enabled\":true,\"titleAm\":\"የዕለቱ ስንክሳር\",\"titleEn\":\"Today\'s Synaxarium\",\"order\":1},{\"id\":\"news\",\"enabled\":true,\"titleAm\":\"ዜናዎችና ማስታወቂያዎች\",\"titleEn\":\"News & Announcements\",\"order\":2},{\"id\":\"courses\",\"enabled\":true,\"titleAm\":\"የሚሰጡ ትምህርቶች\",\"titleEn\":\"Featured Courses\",\"order\":3},{\"id\":\"mezmur\",\"enabled\":true,\"titleAm\":\"የምስጋና መዝሙራት\",\"titleEn\":\"Spiritual Hymns\",\"order\":4},{\"id\":\"contact\",\"enabled\":true,\"titleAm\":\"አድራሻና ግንኙነት\",\"titleEn\":\"Contact Us\",\"order\":5}],\"announcement\":{\"enabled\":false,\"textAm\":\"የዘንድሮው የትምህርት ዘመን ምዝገባ ተጀምሯል!\",\"textEn\":\"Registration for the new academic year is now open!\",\"type\":\"info\",\"link\":\"/register\"}}','2026-10-27 09:26:30.545','2026-10-27 17:31:27.926'),('identity.church','{\"nameAm\":\"ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል\",\"nameEn\":\"Felegeselam Kidus Giyorgis Cathedral\"}','2026-10-27 09:36:23.677','2026-10-30 06:38:47.216'),('identity.location','{\"townAm\":\"ፍኖተ ሰላም\",\"townEn\":\"Finote Selam\",\"zoneAm\":\"ምዕራብ ጎጃም ዞን\",\"zoneEn\":\"West Gojjam Zone\",\"regionCountryAm\":\"አማራ ክልል፣ ኢትዮጵያ\",\"regionCountryEn\":\"Amhara Region, Ethiopia\",\"combinedAm\":\"ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል፣ ፍኖተ ሰላም፣ ምዕራብ ጎጃም\",\"combinedEn\":\"Felegeselam Kidus Giyorgis Cathedral, Finote Selam, West Gojjam\",\"latitude\":\"\",\"longitude\":\"\"}','2026-10-27 09:36:23.683','2026-10-30 06:38:47.201'),('identity.school','{\"nameAm\":\"አዕማደ ሰላም ሰንበት ት/ቤት\",\"nameEn\":\"Aemade Selam Sunday School\",\"shortNameAm\":\"አዕማደ ሰላም\",\"shortNameEn\":\"አዕማደ ሰላም\",\"taglineAm\":\"በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ\",\"taglineEn\":\"Firm in Faith, Shining in Good Deeds\",\"logoUrl\":\"/uploads/branding/logo.png\",\"faviconUrl\":\"/favicon.ico\"}','2026-10-27 09:36:23.671','2026-10-30 06:38:47.217'),('localization','{\"defaultLanguage\":\"am\",\"supportedLanguages\":[\"am\",\"en\"],\"timezone\":\"Africa/Addis_Ababa\",\"calendar\":\"ethiopian\"}','2026-10-17 17:56:57.394','2026-10-27 09:36:23.710'),('school_profile','{\"nameAm\":\"አዕማደ ሰላም ሰንበት ት/ቤት\",\"nameEn\":\"Aemade Selam Sunday School\",\"logoUrl\":\"/uploads/branding/logo.png\",\"parish\":\"ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል\",\"mottoAm\":\"በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ\",\"mottoEn\":\"Firm in Faith, Shining in Good Deeds\"}','2026-10-17 17:56:57.376','2026-10-30 06:38:47.217'),('site_identity','{\"nameAm\":\"አዕማደ ሰላም ሰንበት ት/ቤት\",\"nameEn\":\"Aemade Selam Sunday School\",\"shortName\":\"አዕማደ ሰላም\",\"taglineAm\":\"በሃይማኖት ጽኑ፥ በመልካም ምግባር አብሩ\",\"taglineEn\":\"Firm in Faith, Shining in Good Deeds\",\"churchName\":\"ፈለገ ሰላም ቅዱስ ጊዮርጊስ ካቴድራል\",\"churchNameEn\":\"Felegeselam Kidus Giyorgis Cathedral\",\"townAm\":\"ፍኖተ ሰላም\",\"townEn\":\"Finote Selam\",\"zoneAm\":\"ምዕራብ ጎጃም ዞን\",\"zoneEn\":\"West Gojjam Zone\",\"regionCountryAm\":\"አማራ ክልል፣ ኢትዮጵያ\",\"regionCountryEn\":\"Amhara Region, Ethiopia\",\"logoUrl\":\"/uploads/branding/logo.png\",\"faviconUrl\":\"/favicon.ico\"}','2026-10-27 06:52:08.725','2026-10-30 06:38:47.199'),('system_config','{\"allowSelfRegistration\":true,\"requireAdminApproval\":true,\"maintenanceMode\":false}','2026-10-17 17:56:57.399','2026-10-27 09:36:23.716');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `cms_pages`
--

LOCK TABLES `cms_pages` WRITE;
/*!40000 ALTER TABLE `cms_pages` DISABLE KEYS */;
INSERT INTO `cms_pages` (`id`, `slug`, `titleAm`, `titleEn`, `status`, `publishAt`, `seo`, `isSystem`, `version`, `createdBy`, `updatedBy`, `createdAt`, `updatedAt`) VALUES ('84dcf23e-e12a-42b4-8753-eae940f5a1f0','test-cms','የሙከራ ተለዋዋጭ ገጽ (CMS Test Page)','CMS Dynamic Test Page','published',NULL,'{\"titleAm\":\"የሙከራ ገጽ - አዕማደ ሰላም\",\"titleEn\":\"CMS Test Page - Aemade Selam\",\"descAm\":\"ሙሉ በሙሉ ከመረጃ ቋት የተገነባ ተለዋዋጭ ገጽ\",\"descEn\":\"Fully dynamic page built entirely from database rows\"}',0,1,NULL,NULL,'2026-10-27 19:49:41.751','2026-10-27 19:49:41.751');
/*!40000 ALTER TABLE `cms_pages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping data for table `cms_menus`
--

LOCK TABLES `cms_menus` WRITE;
/*!40000 ALTER TABLE `cms_menus` DISABLE KEYS */;
INSERT INTO `cms_menus` (`id`, `location`, `items`, `createdAt`, `updatedAt`) VALUES ('511937ab-d85a-4b7e-8ea4-569a041b23f9','header','[{\"id\":\"1\",\"labelAm\":\"መነሻ\",\"labelEn\":\"Home\",\"target\":{\"type\":\"page\",\"url\":\"/\"},\"visible\":true,\"audience\":\"everyone\"},{\"id\":\"2\",\"labelAm\":\"ስለ እኛ\",\"labelEn\":\"About\",\"target\":{\"type\":\"page\",\"url\":\"/about\"},\"visible\":true,\"audience\":\"everyone\"},{\"id\":\"3\",\"labelAm\":\"ዜና\",\"labelEn\":\"News\",\"target\":{\"type\":\"page\",\"url\":\"/news\"},\"visible\":true,\"audience\":\"everyone\"},{\"id\":\"4\",\"labelAm\":\"መዝሙር\",\"labelEn\":\"Mezmur\",\"target\":{\"type\":\"page\",\"url\":\"/mezmur\"},\"visible\":true,\"audience\":\"everyone\"},{\"id\":\"5\",\"labelAm\":\"ትምህርት\",\"labelEn\":\"Courses\",\"target\":{\"type\":\"page\",\"url\":\"/courses\"},\"visible\":true,\"audience\":\"everyone\"},{\"id\":\"6\",\"labelAm\":\"ቀን መቁጠሪያ\",\"labelEn\":\"Calendar\",\"target\":{\"type\":\"page\",\"url\":\"/calendar\"},\"visible\":true,\"audience\":\"everyone\"},{\"id\":\"7\",\"labelAm\":\"አድራሻ\",\"labelEn\":\"Contact\",\"target\":{\"type\":\"page\",\"url\":\"/contact\"},\"visible\":true,\"audience\":\"everyone\"},{\"id\":\"8\",\"labelAm\":\"የሙከራ ገጽ\",\"labelEn\":\"CMS Test\",\"target\":{\"type\":\"page\",\"url\":\"/test-cms\"},\"visible\":true,\"audience\":\"everyone\"}]','2026-10-27 19:49:41.811','2026-10-27 19:49:41.811');
/*!40000 ALTER TABLE `cms_menus` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-01 21:59:37
