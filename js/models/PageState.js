"use strict";
define(['backbone'], function(Backbone){
  /**
    The PageState has a variety of tasks that lie at the core of our Application.
    - It tracks state for the site, where the different parts should not do so themselfs.
    - It aids construcing links for the site.
    - It assists in parsing links for the site.
  */
  return Backbone.Model.extend({
    defaults: {
      wordOrder: 'logical'
    , spLang: null
    , phLang: null
    , pageView: 'map'
    , pageViews: ['map','word','language','languagesXwords','wordsXlanguages','contributorView']
    , mapViewIgnoreSelection: false // On true all languages shall be displayed
    , wordByWord: false // Should wordByWord downloads be displayed?
    , wordByWordFormat: 'mp3' // Initially set by views/AudioLogic
    }
    /**
      Sets up callbacks to manipulate PageState when necessary.
    */
  , activate: function(){
      //{sp,ph}Lang need resetting sometimes:
      var reset = function(){this.set({spLang: null, phLang: null});};
      App.study.on('change', reset, this);
      App.translationStorage.on('change:translationId', reset, this);
    }
  //Managing the wordOrder:
    /**
      Predicate to test if the wordOrder is logical
    */
  , wordOrderIsLogical: function(){
      return this.get('wordOrder') === 'logical';
    }
    /**
      Predicate to test if the wordOrder is alphabetical
    */
  , wordOrderIsAlphabetical: function(){
      return this.get('wordOrder') === 'alphabetical';
    }
    /**
      Sets the wordOrder to logical
    */
  , wordOrderSetLogical: function(){
      this.set({wordOrder: 'logical'});
    }
    /**
      Sets the wordOrder to alphabetical
    */
  , wordOrderSetAlphabetical: function(){
      this.set({wordOrder: 'alphabetical'});
    }
  //Managing {sp,ph}Lang:
    /**
      Returns the current spellingLanguage
    */
  , getSpLang: function(){
      var spl = this.get('spLang');
      if(spl === null){
        spl = App.translationStorage.getRfcLanguage();
        this.attributes.spLang = spl;
      }
      return spl;
    }
    /***/
  , setSpLang: function(l){
      this.set({spLang: l || null});
    }
    /**
      Returns the current phoneticLanguage
    */
  , getPhLang: function(){
      var phl = this.get('phLang');
      if(phl === null){
        var spl = this.getSpLang();
        if(spl){
          phl = spl;
        }else{
          phl = App.languageCollection.getDefaultPhoneticLanguage() || null;
        }
        this.attributes.phLang = phl;
      }
      return phl;
    }
    /***/
  , setPhLang: function(l){
      this.set({phLang: l || null});
    }
  //Managing pageView:
    /**
      Predicate to tell if the current pageView is a multiView.
    */
  , isMultiView: function(pvk){
      pvk = pvk || this.get('pageView');
      return _.contains(['languagesXwords','wordsXlanguages'], pvk);
    }
    /**
      Predicate to tell if the current pageView is the mapView.
    */
  , isMapView: function(pvk){
      pvk = pvk || this.get('pageView');
      return pvk === 'map';
    }
    /**
      Returns the currently active pageView as a Backbone.View
    */
  , getPageView: function(){
      var pvMap = {
        map:             'mapView'
      , word:            'wordView'
      , language:        'languageView'
      , languagesXwords: 'languageWordView'
      , wordsXlanguages: 'wordLanguageView'
      }, key = this.get('pageView');
      return App.views.renderer.model[pvMap[key]];
    }
    /**
      Returns the key for the current PageView.
    */
  , getPageViewKey: function(){return this.get('pageView');}
    /**
      Changes the current pageView to a given String or Backbone.View.
      Instances of Backbone.View are required to have a getKey method.
    */
  , setPageView: function(pv){
      if(_.isString(pv)){
        if(_.contains(this.get('pageViews'), pv)){
          this.set({pageView: pv});
        }else{
          console.log('PageState.setPageView() refuses to set pageView: '+pv);
        }
      }else if(pv instanceof Backbone.View){
        if(typeof(pv.getKey) === 'function'){
          this.setPageView(pv.getKey());
        }
      }else{
        console.log('PageState.setPageView() failed:');
        console.log(pv);
      }
    }
    /**
      Tells wether the given String or Backbone.View is the current PageView.
      Instances of Backbone.View are required to have a getKey method.
    */
  , isPageView: function(key){
      if(_.isString(key)){
        if(_.contains(this.get('pageViews'), key)){
          return this.get('pageView') === key;
        }
        switch(key){
          case 'm':  return this.isPageView('map');
          case 'w':  return this.isPageView('word');
          case 'l':  return this.isPageView('language');
          case 'lw': return this.isPageView('languagesXwords');
          case 'wl': return this.isPageView('wordsXlanguages');
          case 'c':  return this.isPageView('contributorView');
        }
      }else if(key instanceof Backbone.View){
        if(typeof(key.getKey) !== 'function')
          return false;
        return this.isPageView(key.getKey());
      }
      console.log('PageState.isPageState() with unexpected key: '+key);
      return false;
    }
  });
});
