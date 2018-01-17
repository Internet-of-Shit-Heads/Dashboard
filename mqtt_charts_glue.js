var client;
var reconnectTimeout = 2000;
topic = "IoT/#";
sensor_dict = {};

// Create a client instance
client = new Paho.MQTT.Client("localhost", 1884, "clientId");

// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({
  onSuccess: onConnect,
  userName: "IoT_client",
  password: "leafy_switch_soup"
});


// called when the client connects
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  console.log("onConnect");
  client.subscribe(topic);
  console.log("Subscribed to topic " + topic)
  document.getElementById('topic').value = topic
}

function mqttSend() {
  console.log("Send");
  message = new Paho.MQTT.Message(document.getElementById('message').value);
  message.destinationName = document.getElementById('out_topic').value;
  client.send(message);
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  if (responseObject.errorCode !== 0) {
    console.log("onConnectionLost:"+responseObject.errorMessage);
    document.getElementById('status').value = "Connection Lost:"+responseObject.errorMessage;
  }
}

function refreshCharts() {
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(drawChart);

  // <div id="curve_chart" style="width: 400px; height: 200px"></div>


  function drawChart() {
    for (sensor in sensor_dict){
      console.log(sensor)
      var chart_div = document.getElementById(sensor + "_chart");

      // create chart if new sensor value
      if (chart_div === null) {
        var chart_div = document.createElement("div");
        chart_div.style.width = "400px";
        chart_div.style.height = "200px";
        chart_div.id = sensor + "_chart";
        chart_div.classList.add('chart');
      }

      // create data table
      var data = new google.visualization.DataTable();
      data.addColumn('date', 'Time of Day');
      data.addColumn('number', sensor);

      data.addRows(sensor_dict[sensor]);

      var options = {
        title: sensor,
        curveType: 'function',
        legend: { position: 'bottom' },
        hAxis: {
          gridlines: {
            count: -1,
            units: {
              days: {format: ['MMM dd']},
              hours: {format: ['HH:mm', 'ha']},
            }
          },
          minorGridlines: {
            units: {
              hours: {format: ['hh:mm:ss a', 'ha']},
              minutes: {format: ['HH:mm a Z', ':mm']}
            }
          }
        }
      };

      var chart = new google.visualization.LineChart(chart_div);

      document.getElementById("charts").appendChild(chart_div);

      chart.draw(data, options);
    }
  }
}

// called when a message arrives
function onMessageArrived(message) {
  console.log("onMessageArrived:"+message.payloadString);
  var rec_topic = message.topic.slice("IoT/".length);
  var rec_message = message.payloadString;
  var log = document.getElementById('last_messages_log');

  log.value = log.value; + rec_topic + '\t' + rec_message + '\n';

  //TODO check for topics
  //TODO sanity checks? (e.g. true/false)
  var number_value = Number(rec_message);
  if (!isNaN(number_value)) {
    //add value to our dictionary
    if (typeof(sensor_dict[rec_topic]) === "undefined") {
      // sensor_dict[message.topic] = [['Date', rec_topic]];
      sensor_dict[rec_topic] = [];
      // sensor_dict[message.topic] = new google.visualization.DataTable();
      // sensor_dict[message.topic].addColumn('date', 'Date');
      // sensor_dict[message.topic].addColumn('number', rec_topic);
    }
    sensor_dict[rec_topic].push([new Date(), number_value]);

    console.log(rec_topic + " is now: " + sensor_dict[rec_topic])

    refreshCharts();
  }

}