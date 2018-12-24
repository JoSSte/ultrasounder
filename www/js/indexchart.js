function selectItemByValue(elmnt, value) {
    for (var i = 0; i < elmnt.options.length; i++) {
        if (elmnt.options[i].value === value) {
            elmnt.selectedIndex = i;
            break;
        }
    }
}


var pilleChart;
var urlPilleData = 'backend.php?jsonaction=pilledata&graphable=true';
var interval = 600;
//$("#interval").val(interval);
var warningLevel = 11;
var emptyLevel = 4;
window.chartColors = {
    red: 'rgb(255,  99, 132)',
    orange: 'rgb(255, 159,  64)',
    yellow: 'rgb(255, 205,  86)',
    green: 'rgb( 75, 192, 192)',
    blue: 'rgb( 54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    silver: 'rgb(230, 230, 230)',
    grey: 'rgb( 90, 90, 90)',
    black: 'rgb(  0,   0,   0)',
    graphite: 'rgb( 50,  50,  50)'
};

function updateChartData() {
    console.log("updating");
//      var intval = document.getElementById("interval").value;
//      interval = intval;
//      }if (interval !== intval) {
//        console.log("Updating interval from " + interval + " to " + intval);
//        interval = intval;
//      }
    var jsonData = $.ajax({
        url: urlPilleData,
        dataType: 'json'
    }).done(function (newData) {
        pilleChart.data.datasets[0].data = newData.data;
        pilleChart.data.datasets[1].data = newData.refills;
        pilleChart.config.data.labels = newData.labels;
        pilleChart.update();
    });

}

function drawLineChart() {

    var jsonData = $.ajax({
        url: urlPilleData,
        dataType: 'json'
    }).done(function (rawData) {
        // Create the chart.js data structure using 'labels' and 'data'
        var pilleData = {
            //labels: data.labels,
            datasets: [{
                    pointHoverBackgroundColor: window.chartColors.grey,
                    strokeColor: window.chartColors.grey,
                    borderColor: window.chartColors.graphite,
                    pointRadius: 0,
                    borderWidth: 1,
                    fill: false,
                    label: 'Pellet Level',
                    data: rawData.data

                },
                {
                    pointHoverBackgroundColor: window.chartColors.red,
                    strokeColor: window.chartColors.green,
                    borderColor: window.chartColors.red,
                    radius: 3,
                    borderWidth: 2,
                    showLine: false,
                    fill: false,
                    label: 'POI',
                    data: rawData.refills

                }
            ]
        };
        var options = {
            showLines: true,
            responsive: true,
            title: {
                display: true,
                text: 'Pellet Level (%)'
            },
            legend: {
                display: false
            },
            tooltips: {
                mode: 'index',
                intersect: true
            },
            annotation: {
                annotations: [
                    {
                        type: 'line',
                        mode: 'horizontal',
                        scaleID: 'y-axis-0',
                        value: warningLevel,
                        borderColor: window.chartColors.orange,
                        borderWidth: 1.5,
                        label: {
                            enabled: true,
                            content: 'Refill',
                            backgroundColor: window.chartColors.orange
                        }
                    },
                    {
                        type: 'line',
                        mode: 'horizontal',
                        scaleID: 'y-axis-0',
                        value: emptyLevel,
                        borderColor: window.chartColors.red,
                        borderWidth: 1.5,
                        label: {
                            enabled: true,
                            content: 'Empty',
                            backgroundColor: window.chartColors.red
                        }
                    }
                ]
            },
            /*
             zoom: {
             // Boolean to enable zooming
             enabled: true,
             
             // Enable drag-to-zoom behavior
             drag: true,
             
             // Zooming directions. Remove the appropriate direction to disable
             // Eg. 'y' would only allow zooming in the y direction
             mode: 'xy',
             rangeMin: {
             // Format of min zoom range depends on scale type
             x: null,
             y: null
             },
             rangeMax: {
             // Format of max zoom range depends on scale type
             x: 0,
             y: 100
             },
             // Function called once zooming is completed
             // Useful for dynamic data loading
             onZoom: function () {
             console.log('I was zoomed!!!');
             }
             },
             */
            scales: {
                yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            stepSize: 10,
                            suggestedMax: 100
                        }
                    }
                ],
                //Set X-Axis to date instead of labels
                xAxes: [{
                        type: 'time',
                        time: {
                            unit: 'day'
                        }
                    }
                ]
            }
        };
        var ctx = document.getElementById("pilleChart").getContext("2d");
        // Instantiate a new chart
        pilleChart = new Chart(ctx, {
            type: 'line',
            data: pilleData,
            options: options
        });
        analyseData(rawData.refills);
    });
}
function analyseData(data) {
    console.log(data);
    var lastPeak;
    var unit = "hours";
    var dateFormat = "MM-DD-YYYY";
    var currentEstRate = 0;
    var remainingTime = 0;
    for (var i = 0; i < data.length; i++) {
        if (data[i].type === "peak") {
            lastPeak = moment(data[i].x);
        } else if (data[i].type === "trough") {
            var trough = moment(data[i].x);
            var diff = trough.diff(lastPeak, unit);
            var currRate = Math.round((100 / diff) * 100) / 100;
            //TODO : calculate mean rate
            $("#useList").append("<tr><td>" + lastPeak.format(dateFormat) + "</td><td>" + trough.format(dateFormat) + "</td><td>" + diff + " " + unit + "</td><td colspan=3>" + currRate + "</td></tr>");
        } else if (data[i].type === "tail") {
            var tail = moment(data[i].x);
            var diff = tail.diff(lastPeak, unit);
            var highlight = "table-info";
            var currentLevel = data[i].y;
            if (currentLevel < warningLevel) {
                highlight = "table-warning";
            }
            currentEstRate = Math.round(((100 - currentLevel) / diff) * 100) / 100;
            remainingTime = Math.round(currentLevel / currentEstRate * 100) / 100;
            $("#useList").append("<tr class=\"" + highlight + "\"><td>" + lastPeak.format(dateFormat) + "</td><td>" + tail.format(dateFormat) + "</td><td>" + diff + " " + unit + "</td><td>" + currentEstRate + "</td></tr>");
            $("#pLvl").append(currentLevel);
            $("#remainder").append(remainingTime + " " + unit);
            //TODO: fiddle with the remaining time stuff
            if (currentLevel < warningLevel || moment().format(HH) > 22 && remainingTime < 12) {
                $('#pilleAlert').addClass('alert-danger').removeClass('alert-dark');
            }
        }

    }

}

drawLineChart();