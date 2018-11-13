
d3.xml("http://localhost:8090/lifePlan/xml", function(error, data) {

   if (error) throw error;

   data = [].map.call(data.querySelectorAll("goals"), function(letter) {

     console.log(letter);
     console.log(letter.getAttribute("name"));

     return {

       letter: letter.getAttribute("name")

     };

   });

   // create table
  var table = d3.select('body')
      .append('table');

  var header = table.append("thead").append("tr");
  header
      .selectAll("th")
      .data(["Hi"])
      .enter()
      .append("th")
      .text(function(d) { return d; });
  // create table body
  var body = table.append('tbody')
      .selectAll('tr')
      .data(data).enter()
      .append('tr')
      .selectAll('td')
      .data(function(d) {
                console.log(d.letter);
                return d.letter;
            })
      .enter()
      .append("td")
      .text(function(d) {
          return d;
      });

   /*var margin = {top: 20, right: 20, bottom: 30, left: 40},
       width = 960 - margin.left - margin.right,
       height = 500 - margin.top - margin.bottom;

   var x = d3.scale.ordinal()
       .rangeRoundBands([0, width], .1);

   var y = d3.scale.linear()
       .range([height, 0]);

   var xAxis = d3.svg.axis()
       .scale(x)
       .orient("bottom");

   var yAxis = d3.svg.axis()
       .scale(y)
       .orient("left");

   var svg = d3.select("body").append("svg")
       .attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom)
     .append("g")
       .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

   x.domain(data.map(function(d) { return d.letter; }));
   y.domain(data.map(function(d) { return d.letter; }));

   svg.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0," + height + ")")
       .call(xAxis);

   svg.append("g")
       .attr("class", "y axis")
       .call(yAxis)
     .append("text")
       .attr("transform", "rotate(-90)")
       .attr("y", 6)
       .attr("dy", ".71em")
       .style("text-anchor", "end")
       .text("Frequency");*/

 });

      /*



    });*/
