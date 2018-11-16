
var dateFormatSpecifier = '%d/%m/%Y';
var dateFormat = d3.timeFormat(dateFormatSpecifier);
var parseTime = d3.timeParse("%d %m %y");

var ndx = crossfilter();

var chart = dc.dataTable("#simpleTable");
var pieChart = dc.pieChart("#statusPieChart");

var goalData;
var personData;


/////////////////
// DATA STRUCT //
/////////////////

    //Unique ID dimension
var idDim= ndx.dimension(function (d) {
    return d.id;
});
var grouping = function (d) {   return d.length;    };

    //Date Dimension
var trialDim = ndx.dimension(function(d) {
    var state;
    if (isUndefined(d.dates[0])){
        state = 'n.d.';
    }
    else if (d.dates[0].length <1){
        state = 'n.d.';
    }
    else if (d.dates[0].endDate[0].date < new Date()) {
        state = "Expired";
    }
    else if ((d.dates[0].startDate[0].date < new Date()) && (d.dates[0].endDate[0].date > new Date())) {
        state = "Active";
    }
    else {
        state = "Upcoming";
    }
    return state;
});

var dateGroup = trialDim.group();

//////////////////////////
// SIMPLE TABLE DISPLAY //
//////////////////////////

chart
    .dimension(idDim)
    .group(grouping)
    .columns([
        'id',
        'desc',
        {
            label: "Start Date",
            format: function (d) {
                return ((d.dates.length>0) ? dateFormat(d.dates[0].startDate[0].date) : "");
            }
        },
        {
            label: "End Date",
            format: function (d) {
                return ((d.dates.length>0) ? dateFormat(d.dates[0].endDate[0].date) : "");
            }
        },
        'tags'
     ])

chart.render();


///////////////////////
// PIE CHART DISPLAY //
///////////////////////

pieChart
    .width(768)
    .height(480)
    .radius(120)
    .innerRadius(70)
    .dimension(trialDim)
    .group(dateGroup)
    ;

pieChart.render();

////////////////
// PARSE DATA //
////////////////

d3.xml("http://localhost:8090/lifePlan/xml").then(function(data) {


    goalData = [].map.call(data.querySelectorAll("goals"), function(d) {

        return {
            id : d.getAttribute("xmi:id"),
            desc: d.getAttribute("name"),
            subGoals: d.getAttribute("subGoals"),
            tags: d.getAttribute("tags"),
            dates : [].map.call(d.querySelectorAll("completionDates"), function(e) {
                return{
                    startDate: [].map.call(e.querySelectorAll("startDate"), function(f) {
                         return {
                              date : parseTime(f.getAttribute("day") + " " + f.getAttribute("month") + " " + f.getAttribute("year").slice(-2))
                         }
                    }),
                    endDate: [].map.call(e.querySelectorAll("endDate"), function(g) {
                        return {
                             date : parseTime(g.getAttribute("day") + " " + g.getAttribute("month") + " " + g.getAttribute("year").slice(-2))
                        }
                    })

                }

            })
        };
    });

    personData = [].map.call(data.querySelectorAll("person"), function(d) {
        return {
            firstName : d.getAttribute("firstName"),
            lastName : d.getAttribute("lastName"),
            age : d.getAttribute("age"),
            gender : d.getAttribute("gender")
         };
    });

    ndx.add(goalData);

    dc.redrawAll();

});

function isUndefined(value){
    // Obtain `undefined` value that's
    // guaranteed to not have been re-assigned
    var undefined = void(0);
    return value === undefined;
}

function isDate(myDate) {
    return myDate.constructor.toString().indexOf("Date") > -1;
}