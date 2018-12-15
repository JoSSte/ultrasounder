<?php

//Display errors
error_reporting(E_ALL);
if (!ini_get('display_errors')) {
    ini_set('display_errors', '1');
}

header("content-type: application/json");

define("DEFAULT_INTERVAL", 7200);
define("MAX_LEVEL", 70);
//DB connection
$db = new PDO("mysql:host:trausti.local.stumph.dk;dbname=sensorpi", "sensorread", "very1secret2password3", array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));

function readDB($default_interval = DEFAULT_INTERVAL) {
    global $db;

    $data = array();
    $qry = "SELECT (" . MAX_LEVEL . " - ROUND(AVG(sensorValue),0)) AS Value, Time FROM sensorpi.rawData GROUP BY UNIX_TIMESTAMP(time) DIV $default_interval ORDER BY time ASC";
    $res = $db->query($qry, PDO::FETCH_ASSOC);
    foreach ($res as $row) {
        $data[] = $row;
    }
    return $data;
}

/**
 * inspiration https://stackoverflow.com/questions/43851106/find-peaks-in-a-series
 * @return array
 */
function getRefills() {
    $refillData = array();
    $rawData = readDB();
    $data = normalizeData($rawData);


    for ($i = 1; $i < count($data) - 1; $i++) {
        $delta_prev = abs($data[$i]["Value"] - $data[$i - 1]["Value"]);
        $delta_next = abs($data[$i]["Value"] - $data[$i + 1]["Value"]);

        if ($data[$i]["Value"] > $data[$i + 1]["Value"] && $data[$i]["Value"] > $data[$i - 1]["Value"]
        //&& $data[$i]["Value"] > 55
        ) {
            array_push($refillData, $data[$i]);
        }
    }

    return $refillData;
}

/**
 * normalizes data to a value between 0 and 100 
 * @return array
 */
function normalizeData($data) {
    $normalizedData = array();
    $max = 0;
    $min = 100;

    //Find max & min
    foreach ($data as $value) {
        if ($value["Value"] > $max) {
            $max = $value["Value"];
        }
        if ($value["Value"] < $min) {
            $min = $value["Value"];
        }
    }
    foreach ($data as $entry) {
        $normalizedData[] = array("Value" => round(($entry["Value"] - $min) / ($max - $min) * 100), "Time" => $entry["Time"]);
    }

    return $normalizedData;
}

/**
 * TODO: implement smoothing function? https://www.allaboutcircuits.com/technical-articles/finding-maximums-in-noisy-data/
 */
function get_current_level() {
    global $db;

    $qry = "SELECT sensorvalue AS Value, time AS Time FROM sensorpi.rawData ORDER BY time DESC LIMIT 0,1";
    $res = $db->query($qry, PDO::FETCH_ASSOC);
    foreach ($res as $row) {
        echo "Current level: [" . $row["Value"] . "] @ " . $row["Time"];
    }
}

//function save_something() {
//
//    global $db;
//    if ($db->getAttribute(PDO::ATTR_DRIVER_NAME) == 'mysql') {
//        $stmt = $db->prepare('INSERT INTO sensorpi.rawData (sensorValue, time) VALUES (:val, :tm)', array(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true));
//
//        foreach ($data as $entry) {
//            $stmt->bindParam(":val", $entry[0]);
//            $stmt->bindParam(":tm", $entry[1]);
//            $stmt->execute();
//        }
//    } else {
//        die("my application only works with mysql; I should use \$stmt->fetchAll() instead");
//    }
//}

$jsonaction = filter_input(INPUT_GET, "jsonaction", FILTER_SANITIZE_STRING, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
switch ($jsonaction) {
    case "pilledata":
        $interval = filter_input(INPUT_GET, "interval", FILTER_VALIDATE_INT, array("options" => array("default" => DEFAULT_INTERVAL, "min_range" => 600))); // 10 minute minimum
        $data = normalizeData(readDB($interval));
        echo json_encode(array("data" => $data, "refills" => getRefills()));
        exit(0);
    case "piller":
        $interval = filter_input(INPUT_GET, "interval", FILTER_VALIDATE_INT, array("options" => array("default" => DEFAULT_INTERVAL, "min_range" => 600))); // 10 minute minimum
        $normalized = filter_var(filter_input(INPUT_GET, "normalized", FILTER_SANITIZE_STRING, array("options" => array("default" => "true"))), FILTER_VALIDATE_BOOLEAN);
        $data = readDB($interval);
        if ($normalized) {
            $data = normalizeData($data);
        }
        echo json_encode($data);
        exit(0);
    case "refills":
        echo json_encode(getRefills());
        exit(0);
    default:
        echo json_encode(array("error_message" => "Invalid action or no action requested"));
        http_response_code(400);
        exit(1);
}