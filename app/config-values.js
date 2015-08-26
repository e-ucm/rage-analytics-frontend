'use strict';

/**
 * This file exports two objects ('defaultValues' and 'testValues') with the information needed to
 * create the 'config.js' and 'config-test.js' files, as specified in the file 'setup.js'.
 *
 * config.js is used in when we are not performing tests over the application ('npm start').
 * config-test.js is used when the tests are launched ('npm test').
 *
 * For more information about the configuration files, take a lok at 'setup.js' to see how generates
 * the files from the 'config-example.js' file.
 *
 * The following values are needed for the configuration.
 *
 * @param projectName - Used in the 'subject' of the emails received (contact form) or sent (password reset).
 * @param companyName -
 * @param mongodbUrl - Note that this value mustn't be the same in 'defaultValues' and 'testValues'.
 * @param apiPath - Path for the requests.
 * @param port - port to listen to.
 */

exports.defaultValues = {
    projectName: 'Learning Frontend',
    companyName: 'e-UCM Research Group',
    mongodbUrl: 'mongodb://localhost:27017/lrs',
    apiPath: 'localhost:3000/api',
    port: 3350
};

exports.testValues = {
    projectName: 'Learning Frontend (Test)',
    companyName: 'e-UCM Research Group (Test)',
    mongodbUrl: 'mongodb://localhost:27017/lrs-test', // This must be different than 'exports.defaultValues.mongodbUrl'
    apiPath: 'localhost:3000/api',
    port: 3350
};



