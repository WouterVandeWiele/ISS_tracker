
/*
To-do
- check limits of Latitude and lonitude calculations
- multiple color dots on map
- multiple tracking options (geostat sat, volvo ocen race)  } requires function that keeps track of all points that need to be plotted on map
- ISS path prediction
- Day and night cycle overlay
- If tracking something, display tracking GIF
- adding timezones + UTC clock
- add horizontal en vertical markers (movable with slider & settable in degrees + lat en long)

less prioritised (more difficult):
- more accurate location on map (currently there is an offset between the calculated pixel points and the coördinates)
- multiple types coördinates systems as possible input
- different map projections
- satelite overlay
- run this site on a server (raspberry pi, make it updatable without losing data, sepperate datafile = database?)
- real time clouds & other weather fenomenons
- solar noon for more accurate day- and nightcycle
- move to NASA API for tracking?

backburner:
- ISS full rotation arround earth time calculation (error dependent on ammount of drawn points)
- ISS overflight prediction (http://open-notify.org/Open-Notify-API/)
- display this in a graph
- add a scale to the map (with different images, or overlay?)
*/

var Solstice = {
    2000: 21,
    2001: 21,
    2002: 22,
    2003: 22,
    2004: 21,
    2005: 21,
    2006: 22,
    2007: 22,
    2008: 21,
    2009: 21,
    2010: 21,
    2011: 22,
    2012: 21,
    2013: 21,
    2014: 21,
    2015: 22,
    2016: 21,
    2017: 21,
    2018: 21,
    2019: 22,
    2020: 21,
    2021: 21,
    2022: 21,
    2023: 22,
    2024: 21,
    2025: 21,
    2026: 21,
    2027: 22,
    2028: 21,
    2029: 21,
    2030: 21,
    2031: 22,
    2032: 21,
    2033: 21,
    2034: 21,
    2035: 22,
    2036: 21,
    2037: 21,
    2038: 21,
    2039: 22,
    2040: 21,
    2041: 21,
    2042: 21,
    2043: 22,
    2044: 21,
    2045: 21,
    2046: 21,
    2047: 21,
    2048: 21,
    2049: 21,
    2050: 21,
    2051: 21,
    2052: 21,
    2053: 21,
    2054: 21,
    2055: 21,
    2056: 21,
    2057: 21,
    2058: 21,
    2059: 21,
    2060: 21,
    2061: 21,
    2062: 21,
    2063: 21,
    2064: 21,
    2065: 21,
    2066: 21,
    2067: 21,
    2068: 21,
    2069: 21,
    2070: 21,
    2071: 21,
    2072: 21,
    2073: 21,
    2074: 21,
    2075: 21,
    2076: 21,
    2077: 21,
    2078: 21,
    2079: 21,
    2080: 20,
    2081: 21,
    2082: 21,
    2083: 21,
    2084: 20,
    2085: 21,
    2086: 21,
    2087: 21,
    2088: 20,
    2089: 21,
    2090: 21,
    2091: 21,
    2092: 20,
    2093: 21,
    2094: 21,
    2095: 21,
    2096: 20,
    2097: 21,
    2098: 21,
    2099: 21
};

// adding the image to the canvas
var imageObj = new Image();
imageObj.src = 'map2.png';

// start/stop tracking
var isTracking = false;
var timerISS;   // timer variable
var issButton = document.getElementById('issTrackBut');
issButton.style.background = '#f80000'; // red

// array of tracking points to display
var ISSLoc = [];

// array with calculations (/latitude) for day and night cycle
var dayLength = [];

var xmlhttp = new XMLHttpRequest();
var url = "http://api.open-notify.org/iss-now.json";

// selecting canvas & context
var canvas = document.getElementById('outerCanvas');
var context = canvas.getContext('2d');

var canvasIn = document.getElementById('InnerCanvas');
var contextIn = canvas.getContext('2d');

imageObj.onload = placeMap;

// day and night cycle
var timerNight = setInterval(placeDayNight, 60000); // 1 min;


// Latititude en logitude pos
var messagePos;

/* general */

// mapping numbers to range
//https://stackoverflow.com/questions/10756313/javascript-jquery-map-a-range-of-numbers-to-another-range-of-numbers
Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// init function to draw the map image in the canvas
function placeMap() 
{
    // scale image
    canvas.width = imageObj.width;
    canvas.height = imageObj.height;
    /*canvas.width = imageObj.width;
    canvas.height = imageObj.height;*/

    var ratio = imageObj.width/canvas.width;


    // placing image
    context.drawImage(imageObj, 0, 0, canvas.width, canvas.height);

    // setting alpha channer on 2nd canvas
    canvasIn.width = canvas.width;
    canvasIn.height = canvas.height;
    //contextIn.fillStyle = "rgba(0, 0, 200, 0.5)";
    //contextIn.fillRect(0,0,canvasIn.width,canvasIn.height);
};

// callback function for the place button
function placeCoor()
{
    // read the text from the inputbox
    var latutude = document.getElementById('lat').value;
    var longitude = document.getElementById('long').value;

    var latF = parseFloat(latutude);
    var longF = parseFloat(longitude);

    // if lat > 180° or < 180° => no go
    // if long> 90°  or < 90°  => no go

    document.getElementById('par').innerHTML = 'coordinates: '.concat(latF.toString(), 'Lat, ', longF.toString(), 'Long');
    drawCoor(latF, longF);

}

// conversion function for world coördinates to canvas coördinates
function convCoorPix(Lat, Long)
{
    var Coor = [0, 0];
    // center of the map = Lat 0°
    Coor[0] = (canvas.width/2.0) * ( 1 + (parseFloat(Long)/180.0));

    // center of the map = Long 0°
    Coor[1] = (canvas.height/2.0) * ( 1 - (parseFloat(Lat)/90.0)*1.08);

    return Coor;
}

// placing a circle on specific coördinates
function drawCoor(Lat, Long)
{
    var pixCoor;
    //document.getElementById('par').innerHTML = 'calc req';
    pixCoor = convCoorPix(Lat, Long);
    //document.getElementById('par').innerHTML = 'calc done'.concat(pixCoor[0].toString(), ', ', pixCoor[1].toString());
    
    //document.getElementById('par2').innerHTML = 'Canvas: '.concat(canvas.width.toString(), ', ', canvas.height.toString(), ' place:', pixCoor[0].toString(), ', ', pixCoor[1].toString());
    var radius = 10;

    context.beginPath();
    context.arc(pixCoor[0], pixCoor[1], radius, 0, 2 * Math.PI, false);
    context.fillStyle = 'red';
    context.fill();
    context.lineWidth = 1;
    context.stroke();
}

// draw line between 2 points
function traceLine(p1, p2, color)
{
    var pixCoor1 = [0,0];
    var pixCoor2 = [0,0];

    //document.getElementById('par').innerHTML = 'calc req'.concat(p1.toString());
    pixCoor1 = convCoorPix(p1[0],p1[1]);
    pixCoor2 = convCoorPix(p2[0],p2[1]);

    //document.getElementById('par').innerHTML = 'calc done:'.concat(p1.toString(), '|| ',pixCoor1[0].toString(), ', ', pixCoor1[1].toString());
    //document.getElementById('par2').innerHTML = 'calc done:'.concat(p2.toString(), '|| ',pixCoor2[0].toString(), ', ', pixCoor2[1].toString());

    // get rid of horizontal cross line if ISS moves from 180° longitude to -180° longitude
    if(pixCoor2[0]>pixCoor1[0])
    {
        context.strokeStyle = '#f49542';
        context.beginPath();
        context.lineWidth=10;
        context.moveTo(pixCoor1[0],pixCoor1[1]);
        context.lineTo(pixCoor2[0],pixCoor2[1]);
        context.stroke();
    }

}

/* Canvas tooltip coordinates */

function getMousePos(canvas, evt)
{
    var rec = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rec.left)/rec.width,
        y: (evt.clientY - rec.top)/rec.height
    };
}

// display function for coördinates in top left corner of canvas
function writeMessage(message)
{
    context.clearRect(0, 0, 600, 80);
    context.font = '50pt Calibri';
    context.fillStyle = 'black';
    context.fillText(message, 10, 60, 500);
}

// when mouse moves over canvas, update the coördinate display (top left corner)
canvas.addEventListener('mousemove', function(evt){
    var mouseData = [];
    var mousePos = getMousePos(canvas, evt);

    mouseData.x = mousePos.x.map(0, 1, -180, 180);
    mouseData.y = mousePos.y.map(0, 1, 90, -90)*0.926;

    
    messagePos = 'Lat: ' + mouseData.y.toFixed(2) + ', Long: ' + mouseData.x.toFixed(2);
    writeMessage(messagePos);
}, false);

/*  ISS tracking part   */
function parsePos(json)
{
    //var json = '{"timestamp": 1496435614, "message": "success", "iss_position": {"latitude": "-2.5422", "longitude": "91.8830"}}'
    var issData = JSON.parse(json);

    // message contais usefull data
    if(issData.message == "success")
    {
        document.getElementById('par').innerHTML = 'ISS position: Lat '.concat(issData.iss_position.latitude, ' ,long ', issData.iss_position.longitude);
        
        if(parseFloat(issData.iss_position.latitude) && parseFloat(issData.iss_position.longitude))
        {
            return [issData.iss_position.latitude, issData.iss_position.longitude];
        }
        else
        {
            document.getElementById('par').innerHTML = 'fail issData, is no float';
            return false;
        }
    }
    else
    {
        document.getElementById('par').innerHTML = 'fail issData, contains no usefull data';
        return false;
    }

    
}

function drawPath()
{
    if(ISSLoc.length>1)
    {
        //var i;
        document.getElementById('par2').innerHTML = ISSLoc.length.toString();
        for(i = 1; i < ISSLoc.length; i++)
        {
            traceLine(ISSLoc[(i-1)], ISSLoc[i],'#f49542');  // orange
        }
    }

    drawCoor(ISSPosDec[0],ISSPosDec[1]);    // draw current point on map

}

//sending request IIS position
function reqISSPos()
{
    
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
    document.getElementById('par').innerHTML = "request send";
}

// receiving JSON request
xmlhttp.onreadystatechange = function() 
{
    var ISSPos;
    var ISSPosDec;
    document.getElementById('par').innerHTML = "request received";

    if (this.readyState == 4 && this.status == 200) 
    {
        document.getElementById('par').innerHTML = "request verified";
        ISSPos = this.responseText;
        ISSPosDec = parsePos(ISSPos);

        //document.getElementById('par').innerHTML = 'after parse: '.concat(ISSPosDec[0].toString());

        if(ISSPosDec != false)
        {
            ISSLoc.push(ISSPosDec);
            /*
            if(ISSLoc.length<300)   // save up to 300 points
            {
                ISSLoc.push(ISSPosDec);
            }
            else    // more then 300 points, start shifting
            {
                ISSLoc.shift();
                ISSLoc.push(ISSPosDec);
            }
            */
        }
        else // stop tracking
        {
            startTrack();
        }

        // update the map, drawing functions
        placeMap(); // reset map
        placeDayNight();
        drawPath(); // draw previous points on map
        
        writeMessage(messagePos);
        //document.getElementById('par2').innerHTML = 'done';

    }
}

function startTrack()
{
    if(isTracking)
    {
        // stop tracking
        isTracking = false;
        clearInterval(timerISS);
        issButton.style.background = '#f80000'; // red
        document.getElementById('par').innerHTML = 'stop tracking';
    }
    else
    {
        // start tracking
        isTracking = true;
        timerISS = setInterval(reqISSPos, 5000); // 5 sec
        issButton.style.background = '#00f800'; // green
    }
}

/* Day and night cycle calculation part */

// calculate the longitude where it's 12 o'Clock
function whereSolarNoon()
{
    var long12;
    var d = new Date();
    //var longitude = document.getElementById('long').value;
    var minutes = d.getUTCMinutes() + (d.getUTCHours()*60);


    long12 = minutes.map(0, 1440, 180, -180);
    
    document.getElementById('par').innerHTML = minutes.toString();
    document.getElementById('par2').innerHTML = long12.toString();
    return long12;
}

// calculate the hours of daylight per degree latitude
function calcHoursDay()
{
    var L;  // latitude in degrees
    var J;  // day of the year does not start with the January 1st, but with the day of the winter solstice in the first year a four years cycle

    // calculate previous great year (of 4 year cycle) of winter solstice
    /*
    Defenition:

    Day of year (1st year 0...364, from 365 add 0.25 for every completed year within the Great Year consisting of 4 years, i.e. 365.25 etc.). 
    Note, that the day of year does not start with the astronomically quite arbitrary January 1st, 
    but with the day of the winter solstice in the first year a four years cycle.
    */
    var d = new Date();
    var thisYear = d.getFullYear();
    var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds

    // ofset from great year
    var ofsetGY = thisYear%4;

    var secondDate = new Date((thisYear-1),11,Solstice[thisYear-1]);
    J = Math.round(Math.abs((d.getTime() - secondDate.getTime())/(oneDay))) + (0.25*ofsetGY);
    document.getElementById('par').innerHTML = J;
    

    // clear previous calculations
    dayLength = [];

    // northern hemisphere
    for(L = 0; L<=180; L++)
    {
        
        var P = Math.asin(0.39795 * Math.cos( 0.2163108 + 2 * Math.atan( 0.9671396 * Math.tan(0.00860* (J-186) ) ) ) );
        
        //eval( Math.asin(0.39795*Math.cos(0.2163108 + 2*Math.atan(0.9671396*Math.tan(0.00860*(J-186))))));
        
        var D = 24 - (24/Math.PI)*Math.acos( (Math.sin(0.8333*(Math.PI/180)) + (Math.sin((L-90)*(Math.PI/180)*Math.sin(P)) / (Math.cos((L-90)*(Math.PI/180))*Math.cos(P))) ));
        
        if(D<=24) dayLength[L] = D;
        else dayLength[L] = 24;
        
        document.getElementById('par2').innerHTML = dayLength[50];
    }

    // southern hemisphere
    for(L = 0; L<90; L++)
    {
        dayLength[L] = 24 - dayLength[179-L];
    }

    document.getElementById('par2').innerHTML = dayLength;
}
/*
function cleanArray(actual) {
  var newArray = new Array();

  for (var i = 0; i < actual.length; i++) 
  {
    if (!isNan(actual[i][0])) 
    {
      newArray.push(actual[i]);
    }
  }
  return newArray;
}
*/
// make points for a graph of the day and night cycle
function placeDayNight()
{    
    var center = whereSolarNoon();
    calcHoursDay();

    placeMap(); // reset map

    var i = 0;
    var pointsL = [];
    var pointsR = [];

    var allPoints = [];

    /*
    for(i=0; i<180; i++)
    {
        pointsL[i] = new Array(2);
        pointsR[i] = new Array(2);
    }
    */
    document.getElementById('par2').innerHTML = 'pre calc points';

    // calculate the points left en right of the solar noon
    //https://gamedev.stackexchange.com/questions/30840/how-to-draw-a-global-day-night-curve
    for(i = 0; i<180; i++)
    {
        if((dayLength[i] > 0) && (dayLength[i] < 24))
        {
            pointsL = [];
            pointsR = [];
            pointsL[0] = center - (dayLength[i]/2).map(0.0, 24.0, 0.0, 360.0);
            pointsL[1] = (i-90);

            pointsR[0] = center + (dayLength[i]/2).map(0.0, 24.0, 0.0, 360.0);
            pointsR[1] = (i-90);

            document.getElementById('par2').innerHTML = 'calc value';

            if(pointsL[0] < -180.0) pointsL[0] += 360.0;
            if(pointsL[0] > 180.0) pointsL[0] -= 360.0;

            if(pointsR[0] < -180.0) pointsR[0] += 360.0;
            if(pointsR[0] > 180.0) pointsR[0] -= 360.0;

            document.getElementById('par2').innerHTML = 'calc limits';

            allPoints.push(pointsL);
            allPoints.push(pointsR);

            document.getElementById('par2').innerHTML = 'calc '.concat(i);    
        }
        
    }

    document.getElementById('par2').innerHTML = 'calc points';

    // merge the arrays and sorth them
    //var allPoints = pointsL.concat(pointsR);

    document.getElementById('par2').innerHTML = allPoints;

    function sortfunction(a, b)
    {
        
        if (a[0] == b[0])
        {
            return 0;
        }
        else
        {
            return (a[0] < b[0]) ? -1 : 1;
        }
    }
    allPoints.sort(sortfunction);
    allPoints.sort(sortfunction);   //2nd time because first time is sorted wrong?!

    //var cleanPoints = cleanArray(allPoints);

    //document.getElementById('par2').innerHTML = allPoints;

    //document.getElementById('par2').innerHTML = 'drawing points';
    
    /*
    for(i = 0; i<360; i++)
    {
        drawCoor(allPoints[i][1], allPoints[i][0]);
    }
    */
    contextIn.fillStyle = "rgba(0, 0, 200, 0.5)";
    contextIn.beginPath();
    var pix = convCoorPix(allPoints[0][1], allPoints[0][0]);
    contextIn.moveTo(0, pix[1]);
    contextIn.lineTo(pix[0], pix[1]);

    for(i = 1; i<allPoints.length; i++)
    {
        pix = convCoorPix(allPoints[i][1], allPoints[i][0]);
        contextIn.lineTo(pix[0], pix[1]);
    }

    // zomer
    //document.getElementById('par2').innerHTML = 'pix[1] = '.concat(pix[1]);
    contextIn.lineTo(canvasIn.width, pix[1]);
    contextIn.lineTo(canvasIn.width, canvasIn.height);
    contextIn.lineTo(0, canvasIn.height);
    // winter
    

    contextIn.closePath();
    contextIn.fill();

    drawPath(); // draw previous points on map

}

/* serial port part */

var onGetDevices = function(ports) 
{
  for (var i=0; i<ports.length; i++) 
  {
    console.log(ports[i].path);
  }
}