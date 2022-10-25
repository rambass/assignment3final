function visual() {

    //height and width of chart
    width = 1080;
    height = 500;

    //creating svg
    var svg = d3.select("#horizontalbarchart")
        .append("svg")
        .attr("width", width).attr("height", height)
        .attr("transform", "translate(0,0)");

    //defining margins
    margin = { top: 20, right: 30, bottom: 30, left: 40 },
        width = width - margin.left - margin.right,
        height = height - margin.top - margin.bottom;

    //US AQI Colors Distribution Data
    let data = [{ name: 'Good', min: 0, max: 50, color: '#9cd84e' },
    { name: 'Moderate', min: 51, max: 100, color: '#facf39' },
    { name: 'Unhealthy for Sensitive Groups', min: 101, max: 150, color: '#f99049' },
    { name: 'Unhealthy', min: 151, max: 200, color: '#f65e5f' },
    { name: 'Very Unhealthy', min: 201, max: 300, color: '#a070b6' },
    { name: 'Hazardous', min: 301, max: 350, color: '#a06a7b' }]

    //Appending group to svg
    var chart = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // define the line 
    var valueline = d3.line()
        .x(function (d) { return x(d.date); })
        .y(function (d) { return y(d["US_AQI"]); })
        .curve(d3.curveLinear);

    //define the area
    var area = d3.area()
        .x(function (d) { return x(d.date); })
        .y0(function (d) { return y(+d["US_AQI"] - 10); })
        .y1(function (d) { return y(+d["US_AQI"] + 10); });

    //Created a tooltip container
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    //Defining Axes Scales
    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]).domain([0, 155]);
    var y1 = d3.scaleBand().range([height, 0]).domain(data.map(function (d) { return d.name; }));

    //Reading data from file
    d3.csv("https://download1583.mediafire.com/uv220a0t3wdg/7eksc346e5er8m1/air.csv").then(function (newData) {

        //Extracting unique stations names
        var allGroup = [...new Set(newData.map(d => d.Station_name))];
        allGroup = allGroup.filter(function (d) { return d != ''; })

        //Adding stations names to dropdown list
        d3.select("#dropdown")
            .selectAll('myOptions')
            .data(allGroup)
            .enter()
            .append('option')
            .text(function (d) { return d; })
            .attr("value", function (d) { return d; })

        //Reading current selected value of dropdown for station names
        let sop = d3.select("#dropdown").property("value")
        //filtering data on the basis of selected station
        let fdata = newData.filter(function (d) { return d.Station_name == sop })
        let rawdata = newData.filter(function (d) { return d.Station_name == sop })
        let numberOfRecord = rawdata.length;
        document.getElementById("records").innerHTML = "Numbers of Records: " + numberOfRecord;
        //Parsing date
        fdata.forEach(d => {
            d["date"] = new Date(d["Timestamp(UTC)"])
        });
        //options for specific date
        var options = { year: 'numeric', month: 'long' };
        //Extracting unique month-year from data for dropdown
        var allYears = [...new Set(fdata.map(d => d.date.toLocaleDateString("en-US", options)))];
        allYears = allYears.filter(function (d) { return d != ''; })

        let averagesData = [];
        allYears.forEach(function (yearMonth, index) {
            let filterYearMonth = fdata.filter(function (d) {
                return d.date.toLocaleDateString("en-US", options) == yearMonth;
            })
            let fDay = filterYearMonth.filter(function (d) { return d["Timestamp(UTC)"].substring(8, 10) == '15'; })
            let sumAqi = d3.mean(filterYearMonth, function (d) { return d["US_AQI"] });

            let obj = {};
            obj["date"] = fDay.length > 0 ? fDay[0]["date"] : filterYearMonth[0]["date"];
            obj["US_AQI"] = sumAqi;
            obj["Station_name"] = filterYearMonth[0]["Station_name"];
            obj["Timestamp(UTC)"] = fDay.length > 0 ? fDay[0]["Timestamp(UTC)"] : filterYearMonth[0]["Timestamp(UTC)"];
            averagesData.push(obj);
            if (index == allYears.length - 1) {
                fdata = averagesData;
                console.log(fdata)
            }
        })

        //Date sorting function
        function sortByDateAscending(a, b) {
            return a.date - b.date;
        }
        //sorting data
        fdata = fdata.sort(sortByDateAscending);

        //Defining domains of axis
        x.domain(d3.extent(fdata, function (d) { return d.date; }));
        y.domain([0, 160]); //d3.max(fdata, function (d) { return d["US_AQI"]; })

        //Defining x axis
        chart.append("g").attr("class", "xaxis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b-%y')));

        //Defining y axis
        chart.append("g").attr("class", "yaxis")
            .call(d3.axisLeft(y));


        //Creating background bars
        let bars = chart.selectAll(".bar")
            .data(data)
            .enter().append("rect").attr("class", "bar")
            .attr("x", 0)
            .attr("height", function (d) {
                if (y(d.min) > 0) {
                    return y(d.min)
                }
                else {
                    return 0
                }
            })
            .attr("y", function (d) { return y1(d.area); })
            .attr("width", function (d) { return width; })
            .style("fill", function (d) { return d.color; })
            .style("zindex", -1);

        //displaying PM2.5 as raw data in the form of black dots
        chart.selectAll(".dot1")
            .data(rawdata)
            .enter().append("circle").attr("class", "dot1")
            .attr("r", function (d) {
                return 2;
            })
            .attr("cx", function (d) { return x(d.date); })
            .attr("cy", function (d) {
                return y(+d["US_AQI"]);
            })
            .style("fill", function (d) { return "black"; })
            .style("visibility", "hidden");

        //on changing raw data checkbox 
        d3.select("#rawdata").on("change", function () {
            if (d3.select("#rawdata").property("checked")) {
                d3.selectAll(".dot1").style("visibility", "visible");
            } else {
                d3.selectAll(".dot1").style("visibility", "hidden");
            }
        });


        //Creating area along line
        let space = chart.append("path")
            .data([fdata])
            .attr("class", "area")
            .attr("d", area);

        //Creating line
        let path = chart.append("path")
            .data([fdata])
            .attr("class", "line")
            .attr("d", valueline);


        //Creating group for mouse event listening
        var mouseG = chart.append("g")
            .attr("class", "mouse-over-effects");
        //Creating black vertical line to follow mouse
        mouseG.append("path")
            .attr("class", "mouse-line")
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("opacity", "0");
        //Creating rect of chart size for listening mouse event
        mouseG.append('svg:rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all')
            //on mouse out event
            .on('mouseout', function () {
                //hide the vertical line
                d3.select(".mouse-line")
                    .style("opacity", "0");
                //hide tooltip
                div.transition()
                    .duration(200)
                    .style("opacity", 0);
            })
            //on mouse hover event
            .on('mouseover', function () {
                //getting mouse pointer coords
                var mouse = d3.mouse(this);

                //Getting x axis value on pointer position
                var xDate = x.invert(mouse[0]);
                //filtering data for hovered point
                let hoveredPoint = fdata.filter(function (fd) { return fd.date.toLocaleDateString("en-US") == xDate.toLocaleDateString("en-US"); });
                //unhiding vertical line
                d3.select(".mouse-line")
                    .style("opacity", "1");
                if (hoveredPoint.length > 0) {

                    //unhiding tooltip
                    div.transition()
                        .duration(200)
                        .style("opacity", 1);
                    //defining date filter options
                    var options1 = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                    //adding data to tooltip
                    div.html(xDate.toLocaleDateString("en-US", options1) + "<br/>" + "US AQI: " + "<br/>" + hoveredPoint[0]["US_AQI"].toFixed(0))
                        .style("left", (mouse[0] + 20) + "px")
                        .style("top", (y(hoveredPoint[0]["US_AQI"])) + "px");
                }
            })
            //on moving mouse event
            .on('mousemove', function (d, index) {
                //getting mouse pointer coords
                var mouse = d3.mouse(this);
                //Getting x axis value on pointer position
                var xDate = x.invert(mouse[0]);
                //filtering data for hovered point
                let hoveredPoint = fdata.filter(function (fd) { return fd.date.toLocaleDateString("en-US") == xDate.toLocaleDateString("en-US") });
                d3.select(".mouse-line")
                    .attr("d", function () {
                        var d = "M" + mouse[0] + "," + height;
                        d += " " + mouse[0] + "," + 0;
                        return d;
                    });
                if (hoveredPoint.length > 0) {
                    //unhiding vertical line

                    //unhiding tooltip
                    div.transition()
                        .duration(200)
                        .style("opacity", 1);
                    //defining date filter options
                    var options1 = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                    //adding data to tooltip
                    div.html(xDate.toLocaleDateString("en-US", options1) + "<br/>" + "US AQI: " + "<br/>" + hoveredPoint[0]["US_AQI"].toFixed(0))
                        .style("left", (mouse[0] + 20) + "px")
                        .style("top", (y(hoveredPoint[0]["US_AQI"])) + "px");
                }
            });

        //on changing station name
        d3.select("#dropdown").on("change", function (d) {
            //updating graph
            update();
        })
        //on changing month-year
        d3.select("#dropdown1").on("change", function (d) {
            //updating graph
            update();
        })


        function update() {
            //Reading current selected value of dropdown for station names
            var sop = d3.select("#dropdown").property("value")
            //filtering data on the basis of selected station
            let fdata = newData.filter(function (d) { return d.Station_name == sop })
            let rawdata = newData.filter(function (d) { return d.Station_name == sop });
            let numberOfRecord = rawdata.length;
            document.getElementById("records").innerHTML = "Numbers of Records: " + numberOfRecord;
            //Parsing date
            fdata.forEach(d => {
                d["date"] = new Date(d["Timestamp(UTC)"])
            });

            //Date sorting function
            function sortByDateAscending(a, b) {
                return a.date - b.date;
            }
            //sorting data
            fdata = fdata.sort(sortByDateAscending);

            //options for specific date
            var options = { year: 'numeric', month: 'long' };
            //Extracting unique month-year from data for dropdown
            var allYears = [...new Set(fdata.map(d => d.date.toLocaleDateString("en-US", options)))];
            allYears = allYears.filter(function (d) { return d != ''; })

            let averagesData = [];
            allYears.forEach(function (yearMonth, index) {
                let filterYearMonth = fdata.filter(function (d) { return d.date.toLocaleDateString("en-US", options) == yearMonth; })
                let fDay = filterYearMonth.filter(function (d) { return d["Timestamp(UTC)"].substring(8, 10) == '15'; })

                let sumAqi = d3.mean(filterYearMonth, function (d) { return d["US_AQI"] });

                let obj = {};
                obj["date"] = fDay.length > 0 ? fDay[0]["date"] : filterYearMonth[0]["date"];
                obj["US_AQI"] = sumAqi;
                obj["Station_name"] = filterYearMonth[0]["Station_name"];
                averagesData.push(obj);
                if (index == allYears.length - 1) {
                    fdata = averagesData;
                    console.log(fdata)
                }
            })

            d3.selectAll(".dot1").remove();
            //displaying PM2.5 as raw data in the form of black dots
            chart.selectAll(".dot1")
                .data(rawdata)
                .enter().append("circle").attr("class", "dot1")
                .attr("r", function (d) {
                    return 2;
                })
                .attr("cx", function (d) { return x(d.date); })
                .attr("cy", function (d) {
                    return y(+d["US_AQI"]);
                })
                .style("fill", function (d) { return "black"; })
                .style("visibility", function () {
                    if (d3.select("#rawdata").property("checked")) {
                        return "visible";
                    } else {
                        return "hidden";
                    }
                });

            //on changing raw data checkbox 
            d3.select("#rawdata").on("change", function () {
                if (d3.select("#rawdata").property("checked")) {
                    d3.selectAll(".dot1").style("visibility", "visible");
                } else {
                    d3.selectAll(".dot1").style("visibility", "hidden");
                }
            });

            //updating x axis domain
            x.domain(d3.extent(fdata, function (d) { return d.date; }));
            //updating x axis
            chart.selectAll("g.xaxis").transition()
                .duration(1000)
                .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b-%y')))

            //updating area
            space.data([fdata])
                .transition()
                .duration(1000)
                .attr("class", "area")
                .attr("d", area).style("z-index", 1);

            //updating line
            path.data([fdata])
                .transition()
                .duration(1000)
                .attr("class", "line")
                .attr("d", valueline).style("z-index", 1);


            //Creating group for mouse event listening
            var mouseG = chart.append("g")
                .attr("class", "mouse-over-effects");
            //Creating black vertical line to follow mouse
            mouseG.append("path")
                .attr("class", "mouse-line")
                .style("stroke", "black")
                .style("stroke-width", "1px")
                .style("opacity", "0");
            //Creating rect of chart size for listening mouse event
            mouseG.append('svg:rect')
                .attr('width', width)
                .attr('height', height)
                .attr('fill', 'none')
                .attr('pointer-events', 'all')
                //on mouse out event
                .on('mouseout', function () {
                    //hide the vertical line
                    d3.select(".mouse-line")
                        .style("opacity", "0");
                    //hide tooltip
                    div.transition()
                        .duration(200)
                        .style("opacity", 0);
                })
                //on mouse hover event
                .on('mouseover', function () {
                    //getting mouse pointer coords
                    var mouse = d3.mouse(this);

                    //Getting x axis value on pointer position
                    var xDate = x.invert(mouse[0]);
                    //filtering data for hovered point
                    let hoveredPoint = fdata.filter(function (fd) { return fd.date.toLocaleDateString("en-US") == xDate.toLocaleDateString("en-US"); });
                    //unhiding vertical line
                    d3.select(".mouse-line")
                        .style("opacity", "1");
                    if (hoveredPoint.length > 0) {

                        //unhiding tooltip
                        div.transition()
                            .duration(200)
                            .style("opacity", 1);
                        //defining date filter options
                        var options1 = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                        //adding data to tooltip
                        div.html(xDate.toLocaleDateString("en-US", options1) + "<br/>" + "US AQI: " + "<br/>" + hoveredPoint[0]["US_AQI"].toFixed(0))
                            .style("left", (mouse[0] + 20) + "px")
                            .style("top", (y(hoveredPoint[0]["US_AQI"])) + "px");
                    }
                })
                //on moving mouse event
                .on('mousemove', function (d, index) {
                    //getting mouse pointer coords
                    var mouse = d3.mouse(this);
                    //Getting x axis value on pointer position
                    var xDate = x.invert(mouse[0]);
                    //filtering data for hovered point
                    let hoveredPoint = fdata.filter(function (fd) { return fd.date.toLocaleDateString("en-US") == xDate.toLocaleDateString("en-US") });
                    //unhiding vertical line
                    d3.select(".mouse-line")
                        .attr("d", function () {
                            var d = "M" + mouse[0] + "," + height;
                            d += " " + mouse[0] + "," + 0;
                            return d;
                        });
                    if (hoveredPoint.length > 0) {

                        //unhiding tooltip
                        div.transition()
                            .duration(200)
                            .style("opacity", 1);
                        //defining date filter options
                        var options1 = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                        //adding data to tooltip
                        div.html(xDate.toLocaleDateString("en-US", options1) + "<br/>" + "US AQI: " + "<br/>" + hoveredPoint[0]["US_AQI"].toFixed(0))
                            .style("left", (mouse[0] + 20) + "px")
                            .style("top", (y(hoveredPoint[0]["US_AQI"])) + "px");
                    }
                });
        }

    })
}
visual();