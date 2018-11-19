DROP TABLE IF EXISTS `rawData`;
CREATE TABLE `rawData` (
  `sensorvalue` int(11) DEFAULT NULL,
  `time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE VIEW `summary` AS 
select round(avg(`rawData`.`sensorvalue`),0) AS `Value`,`rawData`.`time` AS `Time` 
from `rawData` 
group by (unix_timestamp(`rawData`.`time`) DIV 7200) 
order by `rawData`.`time`;
