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
 * @param mongoHost - Used to build 'mongodbUrl'
 * @param mongoPort - Used to build 'mongodbUrl'
 * @param mongodbUrl - Note that this value mustn't be the same in 'defaultValues' and 'testValues'.
 * @param apiPath - Path for the requests.
 * @param port - port to listen to.
 */

/**
 * Initializes 'conf' properties with values read from the environment.
 * The environment values must have the following format:
 *      'prefix' + 'conf.propertyKey'
 *          or
 *      'prefix' + 'conf.propertyKey.toUpperCase()'
 *
 * 'links' is an array with values that, when appended '_PORT', can be found in the environment.
 * Is useful for a faster parse of some values such as mongo/redis host/port.
 *
 * @param conf
 * @param prefix
 * @param links
 */
function initFromEnv(conf, prefix, links) {

    for (var item in conf) {
        var envItem = process.env[prefix + item];
        if (!envItem) {
            envItem = process.env[prefix + item.toUpperCase()];
        }
        if (envItem) {
            conf[item] = envItem;
        }
    }

    links.forEach(function (link) {
        var linkPort = process.env[link.toUpperCase() + '_PORT'];
        if (linkPort) {
            /*
             We want to end up with:
             conf.mongoHost = 172.17.0.15;
             conf.mongoPort = 27017;
             Starting with values like this:
             MONGO_PORT=tcp://172.17.0.15:27017
             */
            var values = linkPort.split('://');
            if (values.length === 2) {
                values = values[1].split(':');
                if (values.length === 2) {
                    conf[link + 'Host'] = values[0];
                    conf[link + 'Port'] = values[1];
                }
            }
        }
    });
}

exports.defaultValues = {
    projectName: 'Analytics Frontend',
    companyName: 'e-UCM Research Group',
    mongoHost: 'localhost',
    mongoPort: '27017',
    mongodbUrl: 'mongodb://localhost:27017/analytics-backend',
    apiPath: 'localhost:3000/api',
    port: 3350
};

exports.testValues = {
    projectName: 'Analytics Frontend (Test)',
    companyName: 'e-UCM Research Group (Test)',
    mongoHost: 'localhost',
    mongoPort: '27017',
    mongodbUrl: 'mongodb://localhost:27017/analytics-backend-test', // This must be different than 'exports.defaultValues.mongodbUrl'
    apiPath: 'localhost:3000/api',
    port: 3350
};

var prefix = 'RAGE_ANALYTICS_BACKEND_';
var links = ['mongo'];
initFromEnv(exports.defaultValues, prefix, links);
initFromEnv(exports.testValues, prefix, links);

// Some control instructions

// Ensuring that 'mongodbUrl' values are different
exports.defaultValues.mongodbUrl = 'mongodb://' + exports.defaultValues.mongoHost + ':' + exports.defaultValues.mongoPort + "/analytics-backend";
exports.testValues.mongodbUrl = exports.defaultValues.mongodbUrl + '-test';



