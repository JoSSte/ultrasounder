function selectItemByValue(elmnt, value) {
      for (var i = 0; i < elmnt.options.length; i++) {
        if (elmnt.options[i].value === value) {
          elmnt.selectedIndex = i;
          break;
        }
      }
    }

    var data = [];
    var labels = [];
    var pilleChart;
    var interval = 7200;
    $("#interval").val(interval);
    var warningLevel = 9;
    var emptyLevel = 5;
    window.chartColors = {
      red: 'rgb(255,  99, 132)',
      orange: 'rgb(255, 159,  64)',
      yellow: 'rgb(255, 205,  86)',
      green: 'rgb( 75, 192, 192)',
      blue: 'rgb( 54, 162, 235)',
      purple: 'rgb(153, 102, 255)',
      grey: 'rgb(231, 233, 237)',
      black: 'rgb(  0,   0,   0)',
      graphite: 'rgb( 50,  50,  50)'
    };

    function splitData(jsonData) {
      // Split timestamp and data into separate arrays
      labels = [],
      data = [];
      jsonData.forEach(function (packet) {
        labels.push(new Date(packet.Time));
        data.push(parseFloat(packet.Value));
      });
    }

    function updateChartData() {
//      var intval = document.getElementById("interval").value;
//      interval = intval;
//      }if (interval !== intval) {
//        console.log("Updating interval from " + interval + " to " + intval);
//        interval = intval;
//      }
      var jsonData = $.ajax({
          url: 'backend.php?jsonaction=piller&interval=' + interval,
          dataType: 'json'
        }).done(function (newData) {
          splitData(newData);
          pilleChart.data.datasets[0].data = data;
          pilleChart.config.data.labels = labels;
          pilleChart.update();
        });

    }

    function drawLineChart() {

      var jsonData = $.ajax({
          url: 'backend.php?jsonaction=piller&interval=' + interval,
          dataType: 'json'
        }).done(function (rawData) {
          splitData(rawData);

          // Create the chart.js data structure using 'labels' and 'data'
          var pilleData = {
            labels: labels,
            datasets: [{
                fillColor: "rgba(151,187,205,0.2)",
                strokeColor: window.chartColors.blue,
                borderColor: window.chartColors.graphite,
                radius: 2,
                borderWidth: 1,
                fill: false,
                label: 'Pilleniveau',
                data: data

              }
            ]
          };
          var options = {
            showLines: true,
            responsive: true,
            title: {
              display: true,
              text: 'Pilleniveau i beholder'
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
                x: null,
                y: null
              },
              // Function called once zooming is completed
              // Useful for dynamic data loading
              onZoom: /*function () {
                console.log('I was zoomed!!!');
              }*/ null
            },
            scales: {
              yAxes: [{
                  ticks: {
                    beginAtZero: true
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
        });
    }

    drawLineChart();