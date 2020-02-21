
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

  function pmgov_link(input_url_) 
  {
      getJSON(input_url_);
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
          PM_data = json[i]["field2"];            

        },
        error: function(exception)
        {
          console.log('fail');
        }
     });
  }

  function ThingSpeak_get() 
  {
      return PM_data;
  } 
    
  window.pmgov_link = pmgov_link;
  window.ThingSpeak_update = ThingSpeak_update;
  window.getJSON = getJSON;
  window.ThingSpeak_get = ThingSpeak_get;

}(window, window.document));
