<?php
//Display errors
error_reporting(E_ALL);
if (!ini_get('display_errors')) {
    ini_set('display_errors', '1');
}
//Path to CSV
$csvfile = "/var/www/sensors/data/distances.csv";
//DB connection
$db = new PDO("mysql:host:trausti.local.stumph.dk;dbname=sensorpi", "sensorread", "very1secret2password3", array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION));

if (sizeof($_GET) > 0) {
    if (isset($_GET["jsonaction"])) {
        $jsonaction = filter_input(INPUT_GET, "jsonaction", FILTER_SANITIZE_STRING, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        switch ($jsonaction) {
            case "piller":
                header("content-type: application/json");
                echo json_encode(read_db());
                exit(0);
            default:
                echo json_encode("invalid action");
                exit(0);
        }
    }
}
?><!DOCTYPE html>
<html>
    <head>
        <link rel="icon" type="image/png" href="/pellets.png" />
        <title>Sensor page</title>
    </head>
    <body>
        <h1>Sensor page</h1>


        <a href="<?= $_SERVER["PHP_SELF"] ?>?action=latest">Latest</a>
        <br>
        <a href="<?= $_SERVER["PHP_SELF"] ?>?action=dump">Dump Data</a>
        <br>
        <a href="/chart.html">Chart</a>
        <pre>
<?php
if (sizeof($_GET) > 0) {
    if (isset($_GET["action"])) {
        $action = filter_input(INPUT_GET, "action", FILTER_SANITIZE_STRING, FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        switch ($action) {
            case "dumpcsv":
                dump_data("csv");
                break;
            case "dump":
                dump_data("db");
                break;
            case "latest":
                get_current_level();
                break;
            case "save":
            case "fetch":

                echo "\n\nDISABLED\n\n";
                break;
            /*                        case "fetch":
              fetch_data();
              break; */
            default:
                echo "invalid action:" . $action;
                break;
        }
    }
} else {
    get_current_level();
}

function dump_data($type = "db") {
    if ($type == "csv") {
        $data = read_csv();
    } elseif ($type == "db") {
        $data = read_db();
    }

    if (count($data) > 0):
        echo "<table><thead><tr><th>" . implode('</th><th>', array_keys(current($data))) . "</th></tr></thead><tbody>";
        foreach ($data as $row): array_map('htmlentities', $row);
            echo "<tr><td>" . implode('</td><td>', $row) . "</td></tr>\n";
        endforeach;
        echo "</tbody></table>";
        echo "" . count($data) . " entries";

    endif;
}

function read_csv() {
    global $csvfile;
    //$data = str_getcsv(file_get_contents($f));
    $data = array_map('str_getcsv', file($csvfile));
    //header("content-type: text/plain");
    //var_dump($data);

    return $data;
}

function read_db() {
    global $db;

    $data = array();
    //$qry = "SELECT * FROM sensorpi.summary";
    $qry = "SELECT (75-round(avg(sensorValue),0)) as Value, Time FROM sensorpi.rawData GROUP BY UNIX_TIMESTAMP(time) DIV 10800 ORDER BY time asc";
    $res = $db->query($qry, PDO::FETCH_ASSOC);
    foreach ($res as $row) {
        $data[] = $row;
    }
    return $data;
}

function get_current_level() {
    global $db;

    //$qry = "SELECT * FROM sensorpi.summary order by Time Desc limit 0,1";
    $qry = " select sensorvalue as Value, time as Time from sensorpi.rawData order by time desc limit 0,1";
    $res = $db->query($qry, PDO::FETCH_ASSOC);
    foreach ($res as $row) {
        echo "Current level: [" . $row["Value"] . "] @ " . $row["Time"];
    }
}

function save_csv() {
    $data = read_csv();
    global $db;
    if ($db->getAttribute(PDO::ATTR_DRIVER_NAME) == 'mysql') {
        $stmt = $db->prepare('INSERT INTO sensorpi.rawData (sensorValue, time) VALUES (:val, :tm)', array(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY => true));

        foreach ($data as $entry) {
            $stmt->bindParam(":val", $entry[0]);
            $stmt->bindParam(":tm", $entry[1]);
            $stmt->execute();
        }
    } else {
        die("my application only works with mysql; I should use \$stmt->fetchAll() instead");
    }
}

function fetch_data() {
    global $csvfile;
    $connection = ssh2_connect("10.18.10.117", 22);
    ssh2_auth_password($connection, "sensorpi", "zaq12wsx");


    ssh2_scp_recv($connection, "/home/pi/src/ultrasounder/output/distances.csv", $csvfile);
    echo "File Fetched\n";
}
?>
        </pre>


    </body>
</html>
