var _chart;

var data;
var goalData;

var tree;
var rootGoal;; //The root goal which is used by root entity 'root' to build tree
var root; //The root entity of the tree which is accessed to construct the tree
var treeWidth, treeHeight, g;

var treeInit = false;

var duplicateChildren = [];
var crossLinks = [];

function initTreeChart (ndx, gData){

    data = ndx;
    treeWidth = _chart.width() - 200; //Set the width of the tree to the html element width
    treeHeight = _chart.height(); //Set the height of the tree to the html element height

    goalData = gData;

    goalData.forEach(function(d){
        d.parent = null;
        d.children = [];
    });

    rootGoal = {displayID:"Plan", parent:null, children:[]};
    buildTreeFromData(goalData/*filteredGoals*/);

}

dc.treeChart = function (parent, chartGroup) {
    var SPAN_CLASS = 'tree-chart';
    var _formatNumber = d3.format('.2s');
    _chart = dc.baseMixin(dc.marginMixin({}));

    // dimension not required
    _chart._mandatoryAttributes([]);

    _chart.transitionDuration(250); // good default
    _chart.transitionDelay(0);

    _chart._doRender = function () {

        _chart.resetSvg();

        g = _chart.svg()
                .append('g')
                .attr('transform', 'translate(50,0)');

        goalData.forEach(function(d){ //modify display state of objects based upon whether they are in the filtered data or not

            var result;
            result = data.allFiltered().find(obj => {
                return obj.id === d.id;
            })

            if (result){
                //found an object in the filtered dimension so dont worry
                d.displayOnTree = true;
            }
            else {
                d.displayOnTree = false;
            }

        });

        createTreeChart();

    };

    _chart._doRedraw = function () {
        return _chart._doRender();
    };

    //ID/DIMs

    //Core functions

    return _chart.anchor(parent, chartGroup);

}

function createTreeChart(){

    tree = d3.tree().size([treeHeight, treeWidth]); //Create a tree which will fit inside the containing element

    //create tree
    root = d3.hierarchy(rootGoal);

    updateTree(root);

}
function updateTree(source) {

        // Compute the new tree layout.
        var nodes = tree(root);

        var d_nodes = [];

        //Get tree nodes which are duplicates
        d_nodes.push(root.descendants().slice(1).find(obj => {
            return obj.data.stub === true;
        }));

        //Find original node and attach identifier to duplicate while building crosslinks array
        duplicateChildren.forEach (function (item){
            var sce = root.descendants().slice(1).find(obj => { return obj.data.id === item.parent;})
            item.og_node = root.descendants().slice(1).find(obj => { return obj.data.id === item.og_id;})
            var entry = { source: sce, target: item.og_node };
            if ( crossLinks.indexOf( entry ) === -1 ) {
                crossLinks.push( entry );
            }
        });

        var link = g.selectAll(".link")
              .data(root.descendants().slice(1))
              .enter().append("path")
              .style("stroke", function(d){
                                              var color;
                                              if (d.data.activityState === 'Active'){color = 'green';}
                                              else if (d.data.activityState === 'Expired'){color = 'red';}
                                              else if (d.data.activityState === 'Upcoming'){color = 'blue';}
                                              else if (d.data.activityState === 'Undefined'){color = 'orange';}
                                              else {color = 'black';}

                                              var selectionColour = d.data.displayOnTree ? color : "lightgrey";

                                              return selectionColour;
                                           })
              .attr("class", "link")
              .attr("d", function(d) {
                return "M" + d.y + "," + d.x
                    + "C" + (d.parent.y + 100) + "," + d.x
                    + " " + (d.parent.y + 100) + "," + d.parent.x
                    + " " + d.parent.y + "," + d.parent.x;
              });

        var node = g.selectAll(".node")
              .data(root.descendants())
              .enter().append("g")
              .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
              .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
              });

        node.append("path")
            .style("stroke", function(d){
                                var color;
                                if (d.data.activityState === 'Active'){color = 'green';}
                                else if (d.data.activityState === 'Expired'){color = 'red';}
                                else if (d.data.activityState === 'Upcoming'){color = 'blue';}
                                else if (d.data.activityState === 'Undefined'){color = 'orange';}
                                else {color = 'black';}

                                var selectionColour = d.data.displayOnTree ? color : "lightgrey";

                                return selectionColour;
                             })
            .style("fill", "white")
            .attr("d", d3.symbol()
                 .size(100)
                 .type(function(d) {
                    if
                       (isUndefined(d.data.stub) || d.data.stub == false) { return d3.symbolCircle; }
                    else if
                       (d.stb = true) { return d3.symbolWye;}
            }));

          node.append("text")
              .attr("dy", 3)
              .attr("x", function(d) { return d.children ? -8 : 8; })
              .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
              .text(function(d) {
                return d.data.displayID;
              });

              // Create the custom diagonal for drawing graph edges across tree branches.
              var link_diagonal = crossDiagonal();
              var opacity = 0.7;
              // The dashed edge lines for the cross-links.
              var cross_link = g.selectAll( '.crosslink' )
                  .data( crossLinks );
                  cross_link.attr( 'class', 'crosslink' )
                      .attr( 'd', link_diagonal );
                  cross_link.enter().append( 'path' )
                      .attr( 'class', 'crosslink' )
                      .attr( 'opacity', opacity )
                      .style( 'stroke', 'darkgrey' )
                      .style( 'stroke-dasharray', '4,8' )
                      .style('fill','none')
                      .attr( 'd', link_diagonal );
                  cross_link.exit()
                      .style( 'fill-opacity', 1e-6 )
                      .remove();

    }

var crossDiagonal = function() {

        var source = function( d ) { return d.source; };
        var target = function( d ) { return d.target; };
        var projection = function( d ) { return [d.x, d.y]; };
        var distance_factor = 10;
        var shift_factor = 4;

        function diagonal( d, i ) {
                var p0 = source.call( this, d, i );
                var p3 = target.call( this, d, i );
                var l = ( p0.x + p3.x ) / 2;
                var m = ( p0.x + p3.x ) / 2;
                var x_shift = 0;
                var y_shift = 0;
                if ( p0.x === p3.x ) {
                    x_shift = ( p0.depth > p3.depth ? -1 : 1 ) *
                        shift_factor + ( p3.y - p0.y ) / distance_factor;
                }
                if ( p0.y === p3.y ) {
                    y_shift = ( p0.x > p3.x ? -1 : 1 ) *
                        shift_factor + ( p3.x - p0.x ) / distance_factor;
                }
                var p = [
                    p0,
                    { y: m + x_shift, x: p0.y + y_shift },
                    { y: l + x_shift, x: p3.y + y_shift },
                    p3
                ];
                p = p.map( projection );
                return 'M' + p[0][1] + ',' + p[0][0] + 'C' + p[1] + ' ' + p[2] + ' ' + p[3][1] + ',' + p[3][0] ;
            }

        diagonal.source = function( y ) {
            if ( !arguments.length ) return source;
            source = d3.functor( y );
            return diagonal;
        };

        diagonal.target = function( y ) {
            if ( !arguments.length ) return target;
            target = d3.functor( y );
            return diagonal;
        };

        diagonal.projection = function( y ) {
            if ( !arguments.length ) return projection;
            projection = y;
            return diagonal;
        };

        return diagonal;


};

//Utility functions
function buildTreeFromData(data){

    ///////////////////////////
    //BUILD CHILDREN FM DATA //
    goalData.forEach(function(node) {

        node.children = null; //default children to null is required for the d3 tree functions
        if (!isUndefined(node.subGoals)){//protect against undefined data field
            var subGoalList = node.subGoals.split(" ");//protect against no data entry
            if (subGoalList.length > 0){ //protect against no data entry
                for (var b in subGoalList){ //for each child id find the child and add current id to its parent field

                    var result = data.find(obj => {
                        return obj.id === subGoalList[b]
                    })

                    if (!isUndefined(result)){
                        if (result.parent == null || result.parent == "Root"){
                            result.parent = node.id;
                        }
                        else {
                            duplicateChildren.push({id: result.id + "_d", displayID:result.displayID + "_d", og_id: result.id, parent:node.id, children:null, stub: true});
                        }
                    }
                }
            }
        }

        node.displayOnTree = true;

    });

    ///////////////////////////
    //BUILD PARENTS FM DATA //
        goalData.forEach(function(node) {
        var result = data.find(obj => {
             return obj.id === node.parent;
        })

        if (result) {
            (result.children || (result.children = []))  // create child array if it doesn't exist
            .push(node);// add node to child array
        } else {
            node.parent = "Root";
            rootGoal.children.push(node); // parent is null or missing
        }
    });

    treeInit = true;

}
