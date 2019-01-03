
/////////////////
// INIT CHARTS //
/////////////////

var chart = dc.dataTable("#simpleTable");
var pieChart = dc.pieChart("#timeStateChart");
//var tagBubbleChart = dc.tagChart("#tagBubbleChart");
var selectTagMenu = dc.selectMenu('#selectTagMenu');
var timeChart = dc.lineChart("#timeLineChart");
var timeRangeChart = dc.lineChart("#rangeTimeLineChart");
var treeChart = dc.treeChart("#treeChart");

var extractedTagDim;

function initTagChart(){

    extractedTagDim = ndx.dimension(function(d){

        var tagLabel = [];
        !isUndefined(d.tags) ? d.tagIDList.forEach(function(item){tagLabel.push(tagData.find(obj => {return obj.id === item;}).identifier)}) : null;

        return tagLabel;

    });
    selectTagMenu
        .dimension(extractedTagDim)
        .group(extractedTagDim.group())
        .controlsUseVisibility(true)
        .multiple(true)
        .numberVisible(5);
}

//////////////////////////
// INIT DATA STRUCTURES //
//////////////////////////

var goalData;
var personData;
var tagData;

/////////////////////////
// INIT DC DATA STRUCT //
/////////////////////////

var ndx = crossfilter();

var dateFormatSpecifier = '%d/%m/%Y';
var dateFormat = d3.timeFormat(dateFormatSpecifier);
var parseTime = d3.timeParse("%d %m %y");

////////////////////////
// CHART MANAGER FUNC //
////////////////////////

function initCharts(){
    initSimpleTableChart();
    initTimeStateChart();
    initTimeChart();
    initTreeChart(ndx, goalData);
    initTagChart();
    //initBubbleChart(ndx,goalData);
    //initTagBubbleChart();
}
function createCharts(){

    createSimpleTableChart();
    createTimeStateChart();
    createTimeRangeChart();
    createTimeChart();

    dc.renderAll();

}

//////////////////////////
// SIMPLE TABLE DISPLAY //
//////////////////////////

//Unique ID dimension
var idDim;
var idGrouping;

function initSimpleTableChart(){

     goalData.forEach(function(item) {
        item.tagIDList = !isUndefined(item.tags) ? item.tags.split(" ") : [];
     });

        //Unique ID dimension
    idDim= ndx.dimension(function (d) {
        return d.displayID;
    });
    idGrouping = function (d) {   return d;    };

}
function createSimpleTableChart(){
    chart
        .dimension(idDim)
        .group(function (d) {   return "All Plan Items";    })
        .columns([
            'displayID',
            'desc',
            {
                label: "Start Date",
                format: function (d) {
                    return (d.defined) ? dateFormat(d.startDate) : "";
                }
            },
            {
                label: "End Date",
                format: function (d) {
                    return ((d.defined) ? dateFormat(d.endDate) : "");
                }
            },
            {
                label: "Tags",
                format: function (d) {
                    var string = "";
                    var tagNameList=[];

                    !isUndefined(d.tags) ? d.tagIDList.forEach(function(item){tagNameList.push(tagData.find(obj => {return obj.id === item;}))}) : null;
                    if(!isUndefined(tagNameList)){tagNameList.forEach(function(d){string += d.identifier + " ";});}
                    return string;

                }
            }
         ])
         .size(Infinity);

}

////////////////////////
// TIME STATE DISPLAY //
////////////////////////

//State Dimension
var timeStateDim;
var timeStateGroup;

function initTimeStateChart(){
        //State Dimension
    timeStateDim = ndx.dimension(function(d) {
        var state;
        var todayDate = new Date();

        if (d.defined == false){
            state = 'Undefined';
        }
        else if (d.endDate < todayDate) {
            state = "Expired";
        }
        else if ((d.startDate < todayDate) && (d.endDate > todayDate)) {
            state = "Active";
        }
        else {
            state = "Upcoming";
        }

        d.activityState = state;

        return state;
    });
    timeStateGroup = timeStateDim.group();
}
function createTimeStateChart(){

    timeStateDim.filter(["Active","Undefined","Upcoming"]); //cross filter goes to < then end of the range, hence add one to Upcoming results in it being selected

    pieChart
        .radius(100)
        .dimension(timeStateDim)
        .group(timeStateGroup)
        .filter([["Active","Undefined","Upcoming"]])
        ;

}

///////////////////////
// TIME LINE DOSPLAY //
///////////////////////

var intervalDimension;
var dynamicIntervalDimension;
var startDateDimension;
var endDateDimension;

var minDate;
var maxDate;

var projectsPerMonth;
var projectsPerMonthGroup;
var dynamicRangeProjectsPerMonthGroup;

function initTimeChart(){

    startDateDimension = ndx.dimension(function(d){
        var sD;
        if (isUndefined(d.startDate)){ sD = new Date(); }
        else { sD = d.startDate; }
        return sD
    })
    endDateDimension = ndx.dimension(function(d){
            var eD;
            if (isUndefined(d.startDate)){ eD = new Date(); }
            else { eD = d.endDate; }
            return eD
        })

    intervalDimension = ndx.dimension(function(d) {return d.interval;});

    projectsPerMonth = ndx.groupAll().reduce(
        function(v, d) {
           v.insert(d.interval)
           return v;
       },
       function(v, d) {
           v.remove(d.interval);
           return v;
       },
           function() {
           return lysenkoIntervalTree(null);
       }
    );

    minDate = startDateDimension.bottom(1)[0].startDate;
    maxDate = endDateDimension.top(1)[0].endDate;

    projectsPerMonthGroup = intervalTreeGroup(projectsPerMonth.value(),  minDate, maxDate);


    dynamicRangeProjectsPerMonthGroup = remove_early_late_bins(remove_empty_bins(projectsPerMonthGroup));

    function remove_empty_bins(source_group) {
            return {
                all:function () {
                    return source_group.all().filter(function(d) {
                        return d.value != 0;
                    });
                }
            };
        }
    function remove_early_late_bins(source_group) {
        return {
            all:function () {
                return source_group.all().filter(function(d) {
                    return d.key > minDate && d.key < maxDate;
                });
            }
        };
    }

}

function createTimeRangeChart(){

    timeRangeChart
        .width(1000)
        .height(100)

        .yAxisLabel("No. SI")
        .xAxisLabel("Complete Date Range")

        .x(d3.scaleTime())
        .xUnits(d3.timeMonths)

        .elasticX(true)
        .controlsUseVisibility(true)
        .renderArea(true)

        .dimension(intervalDimension)
        .group(projectsPerMonthGroup);

    timeRangeChart.yAxis().ticks(0).tickSizeOuter(0);

    timeRangeChart.filterHandler(function(dim, filters) {

              if(filters && filters.length) {
                  if(filters.length !== 1)
                      throw new Error('not expecting more than one range filter');
                  var range = filters[0];
                  dim.filterFunction(function(i) {
                      return !(i[1] < range[0].getTime() || i[0] > range[1].getTime());
                  })

                  minDate = range[0].getTime();
                  maxDate = range[1].getTime();

              }
              else {
                dim.filterAll();
                minDate = firstDate;
                maxDate = lastDate;

              }

              projectsPerMonthGroup = intervalTreeGroup(projectsPerMonth.value(),  minDate, maxDate);

              return filters;
          });

}
function createTimeChart(){

    timeChart
        .width(1000)
        .height(200)

        .yAxisLabel("Number of Items")
        .xAxisLabel("Planned Date Interval")

        .x(d3.scaleTime())
        .y(d3.scaleLinear().domain([0,idDim.group().all().length]))
        .xUnits(d3.timeMonths)

        .elasticX(true)
        .controlsUseVisibility(true)
        .brushOn(false)
        .renderArea(true)

        .dimension(intervalDimension)
        .group(dynamicRangeProjectsPerMonthGroup);

}
function intervalTreeGroup(tree, firstDate, lastDate) {
      return {
          all: function() {
              var begin = d3.timeMonth(firstDate), end = d3.timeMonth(lastDate);
              var i = new Date(begin);
              var ret = [], count;
              do {
                  next = new Date(i);
                  next.setMonth(next.getMonth()+1);
                  count = 0;
                  tree.queryInterval(i.getTime(), next.getTime(), function() {
                      ++count;
                  });
                  ret.push({key: i, value: count});
                  i = next;
              }
              while(i.getTime() <= end.getTime());
              return ret;
          }
      };
  }


/////////////////////////
// PARSE DATA  && MAIN //
/////////////////////////

var undefinedDate = new Date();

var firstDate;
var lastDate;

d3.xml("http://localhost:8090/lifePlan/xml").then(function(data) {

    ////////////////
    // PARSE DATA //
    ////////////////

    goalData = [].map.call(data.querySelectorAll("goals"), function(d) {

        var def = true;
        var sTemp;
        var eTemp;
        var sD;
        var eD;

        [].map.call(d.querySelectorAll("completionDates"), function(e) {
            sTemp = [].map.call(e.querySelectorAll("startDate"), function(f) {
                return parseTime(f.getAttribute("day") + " " + f.getAttribute("month") + " " + f.getAttribute("year").slice(-2));
            });
             eTemp = [].map.call(e.querySelectorAll("endDate"), function(f) {
                return parseTime(f.getAttribute("day") + " " + f.getAttribute("month") + " " + f.getAttribute("year").slice(-2));
            });
        });

        if (isUndefined(sTemp)){ sD = undefinedDate; def = false;} else {sD = sTemp[0];}
        if (isUndefined(eTemp)){ eD = undefinedDate; def = false;} else {eD = eTemp[0];}

        var tempDisplayID = d.getAttribute("identifier");

        return {
            id : d.getAttribute("xmi:id"),
            displayID : (isUndefined(tempDisplayID) || tempDisplayID === "") ? "UNK" : tempDisplayID,
            desc: d.getAttribute("name"),
            parent: null,
            subGoals: d.getAttribute("subGoals"),
            tags: d.getAttribute("tags"),

            defined: def,
            startDate: sD,
            endDate: eD,
            interval: [sD, eD]
        };
    }); //Read goal information from XML

    personData = [].map.call(data.querySelectorAll("person"), function(d) {
        return {
            firstName : d.getAttribute("firstName"),
            lastName : d.getAttribute("lastName"),
            age : d.getAttribute("age"),
            gender : d.getAttribute("gender")
         };
    }); //Read person data from XML

    tagData = [].map.call(data.querySelectorAll("tags"), function(d) {
            return {
                identifier : d.getAttribute("name"),
                id : d.getAttribute("xmi:id"),
                taggedGoals : d.getAttribute("taggedGoals")
             };
        }); //Read tag data from XML

    /////////////////
    // BUILD  DATA //
    /////////////////

    firstDate = d3.min(goalData, function(d) { return d.startDate;}); // the interval tree library doesn't seem to provide start/end info
    lastDate = d3.max(goalData, function(d) { return d.endDate;});

    ///////////////
    // ADD TO D3 //
    ///////////////

    ndx.add(goalData);


    /////////////////////////////////
    // CREATE CHARTS ON COMPLETION //
    /////////////////////////////////

    initCharts();
    createCharts();

}); //Currently parse and modify data, then init and create charts.

///////////////////////
// GENERAL UTILITIES //
///////////////////////

function isUndefined(value){
    // Obtain `undefined` value that's
    // guaranteed to not have been re-assigned
    var undefined = void(0);
    return value === undefined || value === null;
}