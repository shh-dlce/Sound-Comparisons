"use strict";
define(['backbone'],function(Backbone){
  return Backbone.Model.extend({
    defaults: {
      content:   ''        // Html String
    , color:     '#000000' // Color to be used for the div
    , div:       null      // Div used to render the content
    , edge:      'sw'      // The edge, on which the marker will be displayed.
    , hoverText: ''        // Text to be displayed on hovering the div
    , id:        -1        // Id generated by initId
    , marker:    null      // A 'blob' on the map.
    , position:  null      // google.maps.LatLng
    , added:     false     // Keeps track if a WordOverlay is currently added to a map by a WordOverlayView
    , view:      null      // Set by a view on construction
    }
  , initialize: function(){
      var d = {
        id: _.uniqueId('WordOverlay_')
      , position: new google.maps.LatLng(
          this.get('lat')
        , this.get('lon')
        )
      , hoverText: this.get('langName')
      , content: ''
      };
      //Parsing the phoneticSoundfiles:
      _.each(this.get('phoneticSoundfiles'), function(sf){
        //Building audioelements:
        var audio = "";
        if(sf.soundfiles.length > 0)
          audio = "<audio data-onDemand='" + JSON.stringify(sf.soundfiles) + "' autobuffer='' preload='auto'></audio>";
        var fileMissing = ''; //Historical entries -> no files
        if(this.get('historical') == 1 || audio === "")
          fileMissing = ' fileMissing';
        var smallCaps = (sf.phonetic === 'play') ? ' style="font-variant: small-caps;"' : '';
        if(this.get('historical') == 1)
          sf.phonetic = "*" + sf.phonetic;
        if(d.content !== "")
          d.content += ",<br>";
        d.content += "<div style=\"display:inline;\"><div class='transcription" + fileMissing + "'"+smallCaps+">" + sf.phonetic + "</div>" + audio+'</div>';
      }, this);
      this.set(d);
    }
  , validate: function(attrs, options){
      if(attrs.color){
        if(!/^#[0123456789abcdef]{6}$/i.test(attrs.color))
          return 'Invalid color: ' + attrs.color;
      }
      if(attrs.edge){
        if(!/^[ns][we]$/.test(attrs.edge))
          return 'Invalid edge: ' + attrs.edge;
      }
    }
    /**
    */
  , getAudio: function(){
      var d = this.get('div');
      return d ? $('audio', d).get() : [];
    }
  , getDistance: function(wo){
      var p1 = this.get('position')
        , p2 = wo.get('position');
      return google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
    }
  , equals: function(wo){
      return this.get('id') === wo.get('id');
    }
    /**
      Since getBBox depends on getPoint(),
      it must return a Promise and cannot return a BBox immediately.
    */
  , getBBox: function(edge){
      var def = $.Deferred(), t = this;
      this.get('view').getPoint().done(function(p){
        var div  = $(t.get('div'))
          , edge = edge || t.get('edge')
          , bbox = {
              x1: p.x
            , y1: p.y
            , x2: p.x + div.width()
            , y2: p.y + div.height()
            , w:  div.width()
            , h:  div.height()
            };
        if(/^nw$/i.test(edge)){
        }else if(/^ne$/i.test(edge)){
          bbox = $.extend(bbox, {
            x1: bbox.x1 - bbox.w
          , x2: bbox.x2 - bbox.w
          });
        }else if(/^sw$/i.test(edge)){
          bbox = $.extend(bbox, {
            y1: bbox.y1 - bbox.h
          , y2: bbox.y2 - bbox.h
          });
        }else if(/^se$/i.test(edge)){
          bbox = $.extend(bbox, {
            x1: bbox.x1 - bbox.w
          , y1: bbox.y1 - bbox.h
          , x2: bbox.x2 - bbox.w
          , y2: bbox.y2 - bbox.h
          });
        }
        def.resolve(bbox);
      }).fail(function(){
        def.reject(arguments);
      });
      return def.promise();
    }
    /**
     @param a bbox
     @param b bbox
     @return bbox
     Shifts a given bbox by the x1,y1 values of another.
    */
  , shiftBy: function(a, b){
      return {
        x1: a.x1 + b.x1
      , y1: a.y1 + b.y1
      , x2: a.x2 + b.x1
      , y2: a.y2 + b.y1
      , w:  a.w
      , h:  a.h
      };
    }
    /**
      @param a bbox
      @param b bbox
      @return Bool
    */
  , overlap: function(a, b){
      if(a.x2 < b.x1) return false;
      if(a.x1 > b.x2) return false;
      if(a.y2 < b.y1) return false;
      if(a.y1 > b.y2) return false;
      return true;
    }
    /**
      @param wos [WordOverlay]
      To find a good edge, this method works as follows:
      1: Build a list of possible edges/positions
      2: Iterate all given WordOverlays,
         and eliminate edges that overlap
      3: Append the fallback edge to the reduced edges list,
         to have a last resort.
      4: Select the first of the remaining edges
    */
  , place: function(wos){
      //Setup:
      var t = this
        , edges     = ['sw','se','nw','ne']
        , fallback  = 'ne'
        , mapBox    = App.views.renderer.model.mapView.getBBox()
        , positions = [], stage1 = [];
      //Filling promises with shifted BBoxes:
      _.each(edges, function(e){
        stage1.push(t.getBBox(e).done(function(box){
          positions.push({edge: e, bbox: t.shiftBy(box, mapBox)});
        }));
      });
      //Awaiting finish of stage1:
      var stage2 = [];
      $.when.apply($, stage1).done(function(){
        //Filtering edges against wos:
        _.each(wos, function(wo){
          stage2.push(wo.getBBox().done(function(woBox){
            var bbox = t.shiftBy(woBox, mapBox);
            _.each(positions, function(p){
              if(t.overlap(bbox, p.bbox)){
                edges = _.filter(edges, function(e){
                  return (e !== p.edge);
                });
              }
            });
          }));
        });
      });
      //Awaiting finish of promises to finish placement:
      $.when.apply($, stage2).done(function(){
        //Appending the fallback edge:
        edges.push(fallback);
        //Selecting the first remaining edge:
        t.set({edge: _.head(edges)});
      });
    }
    /**
      @param cond Bool
      If cond we will have a red marker, otherwise it'll be black.
      If cond we will also play the sound.
    */
  , highlight: function(cond){
      if(cond){
        this.get('marker').setIcon({
          fillColor:    '#FF0000'
        , fillOpacity:  1
        , path:         google.maps.SymbolPath.CIRCLE
        , scale:        7
        , strokeWeight: 2
        });
        //Playing audio:
        window.App.views.audioLogic.play($(this.get('div')).find('audio').get(0));
      }else{
        this.get('marker').setIcon({
          fillColor:    '#000000'
        , fillOpacity:  1
        , path:         google.maps.SymbolPath.CIRCLE
        , scale:        5
        , strokeWeight: 0
        });
      }
    }
    /**
      @param isPlaying Bool
      Change the appearance of the marker on the map similar to highlight,
      to make it easier for clients to spot 'where' sound is playing.
      Modifies this._playing for fun and profit.
    */
  , playing: function(isPlaying, target){
      this._playing = this._playing || {};
      var animation = isPlaying ? google.maps.Animation.BOUNCE : null
        , div = $(this.get('div'));
      this.get('marker').setAnimation(animation);
      if(isPlaying){//Changing the background-color
        if(!this._playing.origBG){
          _.extend(this._playing, {origBG: div.css('border-color')});
          div.css({'border-color': '#FF0000'});
        }
      }else{
        div.css({'border-color': this._playing.origBG});
        this._playing.origBG = null;
      }
    }
  });
});
