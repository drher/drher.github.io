
+(function (window, document) {

  'use strict';

  function ThingSpeak_update(key,field1,field2,field3,field4,field5,field6,field7) {
    
    var input_url ="https://api.thingspeak.com/update";
    var data = $.ajax({
        "type": "POST",
        "dataType": "html",
        "url": input_url,
        "data":{
          "api_key": key,
          "created_at": "DATETIME_STAMP",
          "field1": field1, 
          "field2": field2, 
          "field3": field3, 
          "field4": field4, 
          "field5": field5, 
          "field6": field6, 
          "field7": field7, 
        },
        success: function(html)
        {
          console.log(html);
        },
        error: function(jqXHR, textStatus, errorThrown)
        {
          //console.log(errorThrown);
        }
     });
  }

  function getJSON(target)
  {
    var data = $.ajax({
        type: "get",
        dataType: "jsonp",
        url: target,
        success: function(json)
        {
          //console.log(json);
          PM_data = "";
          json = eval(json);
          for (var i in json) 
          {
            PM_data += "SiteName,";
            PM_data += json[i]["SiteName"];            
            PM_data += ",County,";
            PM_data += json[i]["County"];
            PM_data += ",AQI,";
            PM_data += json[i]["AQI"];
            PM_data += ",Pollutant,";
            PM_data += json[i]["Pollutant"];   
            PM_data += ",Status,";
            PM_data += json[i]["Status"];            
            PM_data += ",SO2 (ppb),";
            PM_data += json[i]["SO2"];            
            PM_data += ",CO (ppm),";
            PM_data += json[i]["CO"];
            PM_data += ",CO_8hr (ppm),";
            PM_data += json[i]["CO_8hr"];            
            PM_data += ",O3 (ppb),";
            PM_data += json[i]["O3"];
            PM_data += ",O3_8hr (ppb),";
            PM_data += json[i]["O3_8hr"];            
            PM_data += ",PM10 (μg/m3),";
            PM_data += json[i]["PM10"];
            PM_data += ",PM2.5 (μg/m3),";
            PM_data += json[i]["PM2.5"];            
            PM_data += ",NO2 (ppb),";
            PM_data += json[i]["NO2"];
            PM_data += ",NOx (ppb),";
            PM_data += json[i]["NOx"];
            PM_data += ",NO (ppb),";
            PM_data += json[i]["NO"];    
            PM_data += ",WindDirec (degrees),";
            PM_data += json[i]["WindDirec"];            
            PM_data += ",WindSpeed (m/sec),";
            PM_data += json[i]["WindSpeed"];
            PM_data += ",PublishTime,";
            PM_data += json[i]["PublishTime"];
            PM_data += ",PM2.5_AVG (μg/m3),";
            PM_data += json[i]["PM2.5_AVG"];  
            PM_data += ",PM10_AVG (μg/m3),";
            PM_data += json[i]["PM10_AVG"];
            PM_data += ",Latitude,";
            PM_data += json[i]["Latitude"];  
            PM_data += ",Longitude,";
            PM_data += json[i]["Longitude"];
            PM_data += ";";
          }
        },
        error: function(exception)
        {
          console.log('fail');
        }
     });
  }

  function ThingSpeak_get(input_site,input_type) 
  {
    if (PM_data!="")
    {
      var x = PM_data.split(";");
      var s = input_site.split("-");

      for (var i = 0; i <(x.length-1); i++) {
        if ((x[i].indexOf(s[0])!=-1)&&(x[i].indexOf(s[1])!=-1)) {
          var value = x[i].split(",");
          
          if (input_type=="SiteName")
            return value[1];
          else if (input_type=="County")
            return value[3];
          else if (input_type=="AQI")
            return value[5];
          else if (input_type=="Pollutant")
            return value[7];
          else if (input_type=="Status")
            return value[9];
          else if (input_type=="SO2")
            return value[11];
          else if (input_type=="CO")
            return value[13];
          else if (input_type=="CO_8hr")
            return value[15];
          else if (input_type=="O3")
            return value[17];
          else if (input_type=="O3_8hr")
            return value[19];
          else if (input_type=="PM10")
            return value[21];
          else if (input_type=="PM2.5")
            return value[23];
          else if (input_type=="NO2")
            return value[25];
          else if (input_type=="NOx")
            return value[27];
          else if (input_type=="NO")
            return value[29];
          else if (input_type=="WindDirec")
            return value[31];
          else if (input_type=="WindSpeed")
            return value[33];
          else if (input_type=="PublishTime")
            return value[35];
          else if (input_type=="PM2.5_AVG")
            return value[37];
          else if (input_type=="PM10_AVG")
            return value[39];
          else if (input_type=="Latitude")
            return value[41];
          else if (input_type=="Longitude")
            return value[43];       
          else
            return "";
        }
      }
      return "";
    }
    else
       return "";
  } 
    
  window.ThingSpeak_update = ThingSpeak_update;
  window.getJSON = getJSON;
  window.ThingSpeak_get = ThingSpeak_get;

}(window, window.document));
