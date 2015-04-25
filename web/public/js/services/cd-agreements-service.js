'use strict';

function cdAgreementsService(cdApi){
  function topfail(err){
    console.log(err);
  }

  return {
    getAgreementsByIds: function(ids, win, fail){
      cdApi.post('agreements/list-by-ids', {usersIds: ids}, win, fail || topfail);
    },
    count: function(query, win, fail){
      cdApi.post('agreements/count', {query: query}, win, fail || topfail);
    }
  };
}

angular.module('cpZenPlatform')
  .service('cdAgreementsService', ['cdApi', cdAgreementsService]);