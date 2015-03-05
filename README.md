# highchart-export
A phantomjs way for building a highcharts export server.
> Use highcharts official phantomjs based algorithm to rewrite the node-highcharts-exporter.
> Can be more rapid export SVG, PNG, JPG, PDF, etc. The format of the official support.
> 采用highcharts官方提供的基于phantomjs的算法重写了node-highcharts-exporter。
> 可以更快速的导出svg,png,jpg,pdf等官方支持的格式。
## Installation

    npm install highcharts-exporter
    
## Quick Example
In your node app file:
``` javascript
// Assume this is executed inside the POST handler for a server
// running on http://localhost:3000/export
var nhe = require('highcharts-exporter');
nhe.exportChart(highchartsExportRequest, function(error, exportedChartInfo){
    if(error){
        console.log('Uh oh!',error.message);
        // Can send error message back to client
    } else{
        console.log('Exported chart. Here are the deets:', exportedChartInfo);
        // Can send exported chart back to client here. The chart's
        // path is in exportedChartInfo.filePath
    }
});
```
In your client-side Highcharts code:
``` javascript
new Highcharts.Chart({
    // some chart options
    exporting:{
        url: 'http://localhost:3000/export'
    }
    // more chart options
});
```
## Methods
* exportChart(exportRequest, callback)
> exportRequest is the request POSTed by Highcharts as described here. callback is a function with two parameters error and exportedChartInfo.
* config.set(configPropertyName, configPropertyValue) and config.get()
> Setter and getter for config object. The getter returns the entire config object.
>