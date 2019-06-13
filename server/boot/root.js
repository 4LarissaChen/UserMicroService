'use strict';

module.exports = function(app) {
     app.models.ButchartUser.dataSource.settings.allowExtendedOperators = true;
};


