/* global App */
/* eslint-disable no-console */
"use strict";
define(['underscore','backbone'], function(_, Backbone){
  /**
    Note that contrary to the Transcription model implemented in php,
    this Transcription may have arrays of multiple values for some fields,
    instead of there being multiple Transcriptions that belong together,
    but repeat some fields while others change.
  */
  return Backbone.Model.extend({
    defaults: {
      //Fields for the language and word a transcription belongs to.
      //These are set by TranscriptionMap:getTranscription.
      language: null
    , word:     null
    }
    /**
      This was mainly build to enable export/soundfiles to identify transcriptions.
    */
  , getId: function(){
      var d = this.pick('language','word');
      //Fallback to generate Id from local data:
      if(d.language === null || d.word === null){
        var keys = ['LanguageIx','IxElicitation','IxMorphologicalInstance'];
        return _.map(keys, this.get, this).join('');
      }
      return [d.language.getId(), d.word.getId()].join('');
    }
    /**
    */
  , getWCogID: function(){
    //We need to clone the WCogID so that filtering and stuff can't do any harm.
    var ids = _.clone(this.get('WCogID'));
    if(ids){
      if(!_.isArray(ids)){
        return [ids];
      }
      return ids;
    }
    return [0];
  }
    /**
    */
  , getWCogIDFine: function(){
    //We need to clone the WCogIDFine so that filtering and stuff can't do any harm.
    var ids = _.clone(this.get('WCogIDFine'));
    if(ids){
      if(!_.isArray(ids)){
        return [ids];
      }
      return ids;
    }
    return [0];
  }
    /**
      Returns the SuperscriptInfo for a Transcription as an array with the length of field 'Phonetic'.
      A helper for getPhonetics.
    */
  , getSuperscriptInfo: function(){
      var ret = [], subret, x, abbr, hvt;
      var p = this.get("Phonetic");
      if(!_.isArray(p)){
        subret = [];
        if(parseInt(this.get('NotCognateWithMainWordInThisFamily')) == 1){
          x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('NotCognateWithMainWordInThisFamily');
          abbr = x.Abbreviation;
          hvt = x.HoverText;
          subret.push([_.clone(abbr), _.clone(hvt)]);
        }
        if(parseInt(this.get('CommonRootMorphemeStructDifferent')) == 1){
          x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('CommonRootMorphemeStructDifferent');
          abbr = x.Abbreviation;
          hvt = x.HoverText;
          subret.push([_.clone(abbr), _.clone(hvt)]);
        }
        if(parseInt(this.get('DifferentMeaningToUsualForCognate')) == 1){
          x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('DifferentMeaningToUsualForCognate');
          abbr = x.Abbreviation;
          hvt = x.HoverText;
          subret.push([_.clone(abbr), _.clone(hvt)]);
        }
        if(parseInt(this.get('RootIsLoanWordFromKnownDonor')) == 1){
          x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('RootIsLoanWordFromKnownDonor');
          abbr = x.Abbreviation;
          hvt = x.HoverText;
          if(this.get('IsoCodeKnownDonor').length > 0){
              x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript(this.get('IsoCodeKnownDonor'));
              abbr += x.Abbreviation;
              hvt += ' ' + x.FullNameForHoverText;
          }
          subret.push([_.clone(abbr), _.clone(hvt)]);
        }
        if(parseInt(this.get('RootSharedInAnotherFamily')) == 1){
          x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('RootSharedInAnotherFamily');
          abbr = x.Abbreviation;
          hvt = x.HoverText;
          if(this.get('IsoCodeKnownDonor').length > 0){
              x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript(this.get('IsoCodeKnownDonor'));
              abbr += x.Abbreviation;
              hvt += ' ' + x.FullNameForHoverText;
          }
          subret.push([_.clone(abbr), _.clone(hvt)]);
        }
        if(parseInt(this.get('ReconstructedOrHistQuestionable')) == 1){
          x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('ReconstructedOrHistQuestionable');
          abbr = x.Abbreviation;
          hvt = x.HoverText;
          if(this.get('ReconstructedOrHistQuestionableNote').length > 0){
              hvt += ' ' + this.get('ReconstructedOrHistQuestionableNote');
          }
          subret.push([_.clone(abbr), _.clone(hvt)]);
        }
        if(parseInt(this.get('OddPhonology')) == 1){
          x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('OddPhonology');
          abbr = x.Abbreviation;
          hvt = x.HoverText;
          if(this.get('OddPhonologyNote').length > 0){
              hvt += ' ' + this.get('OddPhonologyNote');
          }
          subret.push([_.clone(abbr), _.clone(hvt)]);
        }
        ret.push(subret);
      }else{
        for(var i = 0; i < p.length; i++){
          subret = [];
          if(parseInt(this.get('NotCognateWithMainWordInThisFamily')[i]) == 1){
            x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('NotCognateWithMainWordInThisFamily');
            abbr = x.Abbreviation;
            hvt = x.HoverText;
            subret.push([abbr, hvt]);
          }
          if(parseInt(this.get('CommonRootMorphemeStructDifferent')[i]) == 1){
            x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('CommonRootMorphemeStructDifferent');
            abbr = x.Abbreviation;
            hvt = x.HoverText;
            subret.push([abbr, hvt]);
          }
          if(parseInt(this.get('DifferentMeaningToUsualForCognate')[i]) == 1){
            x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('DifferentMeaningToUsualForCognate');
            abbr = x.Abbreviation;
            hvt = x.HoverText;
            subret.push([abbr, hvt]);
          }
          if(parseInt(this.get('RootIsLoanWordFromKnownDonor')[i]) == 1){
            x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('RootIsLoanWordFromKnownDonor');
            abbr = x.Abbreviation;
            hvt = x.HoverText;
            if(this.get('IsoCodeKnownDonor')[i].length > 0){
                x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript(this.get('IsoCodeKnownDonor')[i]);
                abbr += x.Abbreviation;
                hvt += ' ' + x.FullNameForHoverText;
            }
            subret.push([abbr, hvt]);
          }
          if(parseInt(this.get('RootSharedInAnotherFamily')[i]) == 1){
            x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('RootSharedInAnotherFamily');
            abbr = x.Abbreviation;
            hvt = x.HoverText;
            if(this.get('IsoCodeKnownDonor')[i].length > 0){
                x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript(this.get('IsoCodeKnownDonor')[i]);
                abbr += x.Abbreviation;
                hvt += ' ' + x.FullNameForHoverText;
            }
            subret.push([abbr, hvt]);
          }
          if(parseInt(this.get('ReconstructedOrHistQuestionable')[i]) == 1){
            x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('ReconstructedOrHistQuestionable');
            abbr = x.Abbreviation;
            hvt = x.HoverText;
            if(this.get('ReconstructedOrHistQuestionableNote')[i].length > 0){
                hvt += ' ' + this.get('ReconstructedOrHistQuestionableNote')[i];
            }
            subret.push([_.clone(abbr), _.clone(hvt)]);
          }
          if(parseInt(this.get('OddPhonology')[i]) == 1){
            x = App.transcriptionSuperscriptCollection.getTranscriptionSuperscript('OddPhonology');
            abbr = x.Abbreviation;
            hvt = x.HoverText;
            if(this.get('OddPhonologyNote')[i].length > 0){
                hvt += ' ' + this.get('OddPhonologyNote')[i];
            }
            subret.push([_.clone(abbr), _.clone(hvt)]);
          }
          ret.push(subret);
        }
      }
      //Done:
      return ret;
    }
    /**
      @returns [[String]]
    */
  , getSoundfiles: function(){
      //We need to clone the soundPaths so that filtering and stuff can't do any harm.
      var sources = _.clone(this.get('soundPaths')); // [[String]] || [String]
      if(!_.isArray(sources))    sources = [];
      if(sources.length === 0)   sources = [sources];
      if(_.isString(sources[0])) sources = [sources];
      return sources;
    }
    /**
      Filters arrays of soundfiles for the selected wordByWordFormat.
      [String] -> [String]
    */
  , filterSoundfiles: function(xs){
      var suffix = App.pageState.get('wordByWordFormat');
      return _.filter(xs, function(x){
        // https://stackoverflow.com/questions/280634/endswith-in-javascript
        return x.indexOf(suffix, x.length - suffix.length) !== -1;
      });
    }
    /**
      We always produce something with getPhonetics,
      but sometimes it's something like 'play'|'..'.
      hasPhonetics returns true, iff this is the case.
    */
  , hasPhonetics: function(){
      if(this.isDummy()) return false;
      var p = this.get('Phonetic');
      return !_.isEmpty(p);
    }
    /**
      Returns the Phonetics for a Transcription as an object.
      Uses getSuperscriptInfo.
    */
  , getPhonetics: function(hideNoTrans){
      //Note that both phonetics and sources will be sanitized for the first case.
      var phonetics = this.get('Phonetic') // [String]   || String
        , sources   = this.getSoundfiles() // [[String]]
        , superScrs = _.clone(this.getSuperscriptInfo())
        , wcogids   = this.getWCogID()
        , wcogfids  = this.getWCogIDFine()
        , ps        = [];
      //Sanitizing phonetics:
      if(_.isEmpty(phonetics)){
        phonetics = [];
        if(sources.length > 0 && sources[0].length > 0 && sources[0][0].length > 0){
            phonetics.push('▶');
        }else{
          phonetics.push('--');
        }
      }
      if(!_.isArray(phonetics)) phonetics = [phonetics];
      //WordByWord logic:
      var wordByWord = App.pageState.get('wordByWord');
      for(var i = 0; i < phonetics.length; i++){
        var phonetic = phonetics[i]//String
          , source   = sources.shift() || ''
          , wcogid   = wcogids.shift()
          , wcogfid  = wcogfids.shift()
          , superScr = superScrs.shift()
          , language = this.get('language')
          , word     = this.get('word')
          , p = { // Data gathered for phonetic:
              isProtoLg:        (language.isProtoLg() && phonetic !== '--')
            , isTransAssumed:   language.isHistorical() && !language.isProtoLg() && phonetic !== '--'
            , fileMissing: source.length == 0 || source[0].length == 0
            , smallCaps:   phonetic === 'play'
            , phonetic:    (this.get('transStudy') === 'Mixe' && !language.isProtoLg()) ? '▶' : phonetic
            , pk: this.get('transStudy')+"|"+language.getId()+"|"+word.getId()
            , srcs:        JSON.stringify(source)
            , _srcs:       this.filterSoundfiles(source)
            , hasTrans:    language.hasTranscriptions()
            , identifier:  { word:     word.getId()
                           , language: language.getId()
                           , study:    App.study.getId()
                           , n:        i }
            , wordByWord:  wordByWord
          };
        if(p.phonetic === ''){
          p.phonetic = '--';
          continue;
        }
        //Guarding for #351:
        if(hideNoTrans !== 'undefined' && hideNoTrans){
          if(_.some(['--','..','...','…'], function(s){return p.phonetic === s;})){
            continue;
          }
        }
        //build SuperscriptInfo()::fields
        var sInfs = '', ttips = '';
        for(var j = 0; j < superScr.length; j++){
          if(superScr[j].length >= 2){
            if(j == 0){
              sInfs = superScr[j][0];
              ttips = superScr[j][1];
            }else{
              sInfs += ';' + superScr[j][0]
              ttips += ' ◆ ' + superScr[j][1]
            }
          }
        }
        p.notCognate = {
          sInf: sInfs
        , ttip: ttips
        }
        //build Subscript:
        var subText = '';
        var subTtip = '';
        if(wcogid != '0') {
          subText = wcogid
        }
        if(wcogfid != '0') {
          subText += String.fromCharCode(96 + parseInt(wcogfid))
        }
        if(subText.length > 0){
          p.subscript = {
            ttip: subTtip
          , subscript: subText
          }
        }
        //Done:
        ps.push(p);
      }
      return ps;
    }
    /**
      Returns an array of all non empty SpellingAltv[12] fields in a transcription.
    */
  , getSpellingAltv: function(){
      //Notice that the add function also handles the case that one of the fields may be an array.
      var alt = [], add = function(a){
        if(_.isArray(a)){
          _.each(a, add);
        }else if(!_.isEmpty(a)){
          alt.push(a);
        }
      };
      add([this.get('SpellingAltv1'),this.get('SpellingAltv2')]);
      return alt;
    }
    /**
      Returns the alternative Spelling of the word.
    */
  , getAltSpelling: function(){
      var language = this.get('language'), alts = this.getSpellingAltv();
      if(alts.length > 0){
        var proto  = (language.isProtoLg() && alts !== '--') ? '*' : '';
        var altSps = [];
        _.each(alts, function(a){
          if(!altSps.includes(proto + a)){
            altSps.push(proto + a);
          }
        });
        return altSps.join(', ');
      }
      return null;
    }
  //   /**
  //     Returns the alternative Spelling of the word, which belongs to the Transcription.
  //     If an altSpelling can't be found, but the Transcriptions Language is a RfcLanguage,
  //     the ModernName of the Word is returned.
  //     If the Language is not a RfcLanguage, but has one,
  //     getAltSpelling for the Transcription of that RfcLanguage and the same Word is returned.
  //     If all these approaches fail, null is returned.
  //   */
  // , getAltSpelling: function(){
  //     var language = this.get('language'), word = this.get('word')
  //       , alts = this.getSpellingAltv();
  //     if(alts.length > 0){
  //       var proto  = language.isProto() ? '*' : ''
  //         , altSp  = proto + alts[0]
  //         , wTrans = word.getNameFor(App.pageState.getSpLang())
  //         , fail   = _.isArray(wTrans) ? _.any(wTrans, function(w){return w === altSp;}) : (wTrans === altSp);
  //       if(!fail) return altSp;
  //     }
  //     if(language.isRfcLanguage()) return word.getModernName();
  //     var rfc = language.getRfcLanguage();
  //     if(rfc){
  //       var t = App.transcriptionMap.getTranscription(rfc, word);
  //       return t.getAltSpelling();
  //     }
  //     return null;
  //   }
    /**
     returns cognate state
     0 := is cognate; -1 := undefined; others are other cognate sets
    */
  , getCognateState: function(){
      if(this.isDummy()) return -1;
      return parseInt(this.getWCogID()[0]);
    }
    /***/
  , isDummy: function(){
      var d = this.get('isDummy');
      return d || false;
    }
  });
});
