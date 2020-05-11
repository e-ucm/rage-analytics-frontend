/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
 * @param a2Host - Used to build 'apiPath'
 * @param a2Port - Used to build 'apiPath'
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
 * Is useful for a faster parse of some values such as A2 host/port.
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
                conf[link + 'Protocol'] = values[0];
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
    a2Protocol: 'http',
    a2Host: 'localhost',
    a2Port: '3000',
    a2Prefix: 'afront',
    a2ApiPath: 'api/',
    a2ProxyPath: 'api/proxy/',
    a2AdminUsername: 'root',
    kibanaPrefix: 'kibana',
    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    a2AdminPassword: process.env.A2_rootPassword || (process.env.A2_ROOTPASSWORD || 'root'),
    apiPath: 'localhost:3000/api',
    port: 3350,
    appPrefix: 'gleaner',
    myHost: process.env.MY_HOST || 'localhost',
    maxSizeRequest: '1mb',
    docs: {
        lti: 'https://github.com/e-ucm/rage-analytics/wiki/LTI',
        kibanaIndex: 'https://github.com/e-ucm/rage-analytics/wiki/Analysis-Configuration#select-the-index',
        configureFields: 'https://github.com/e-ucm/rage-analytics/wiki/Analysis-Configuration#configure-fields',
        kibanaVisualizations: 'https://github.com/e-ucm/rage-analytics/wiki/Analysis-Configuration#select-visualizations',
        stormAnalysis: 'https://github.com/e-ucm/rage-analytics/wiki/Analysis-Configuration#select-the-analysis',
        traces: 'https://github.com/e-ucm/rage-analytics/wiki/Analysis-Configuration#test-the-configuration',
        developerSteps: 'https://github.com/e-ucm/rage-analytics/wiki/Quickstart#developer-steps',
        quickstart: 'https://github.com/e-ucm/rage-analytics/wiki/Quickstart'
    }
};

exports.testValues = {
    projectName: 'Analytics Frontend (Test)',
    companyName: 'e-UCM Research Group (Test)',
    a2Protocol: 'http',
    a2Host: 'localhost',
    a2Port: '3000',
    a2Prefix: 'afront',
    a2ApiPath: 'api/',
    a2ProxyPath: 'api/proxy/',
    a2AdminUsername: 'root',
    a2AdminPassword: 'root',
    kibanaPrefix: 'kibana',
    apiPath: 'localhost:3000/api',
    port: 3350,
    appPrefix: 'gleaner',
    myHost: process.env.MY_HOST || 'localhost',
    maxSizeRequest: '1mb',
    docs: {
        lti: 'https://github.com/e-ucm/rage-analytics/wiki/LTI',
        kibanaIndex: 'https://github.com/e-ucm/rage-analytics/wiki/Analysis-Configuration#select-the-index',
        configureFields: 'https://github.com/e-ucm/rage-analytics/wiki/Analysis-Configuration#configure-fields',
        kibanaVisualizations: 'https://github.com/e-ucm/rage-analytics/wiki/Analysis-Configuration#select-visualizations',
        stormAnalysis: 'https://github.com/e-ucm/rage-analytics/wiki/Analysis-Configuration#select-the-analysis',
        traces: 'https://github.com/e-ucm/rage-analytics/wiki/Analysis-Configuration#test-the-configuration',
        developerSteps: 'https://github.com/e-ucm/rage-analytics/wiki/Quickstart#developer-steps',
        quickstart: 'https://github.com/e-ucm/rage-analytics/wiki/Quickstart'
    }
};

var prefix = 'RAGE_ANALYTICS_FRONTEND_';
var links = ['a2'];
initFromEnv(exports.defaultValues, prefix, links);
initFromEnv(exports.testValues, prefix, links);

// Some control instructions

exports.defaultValues.a2HomePage = exports.defaultValues.a2Protocol + '://' + exports.defaultValues.a2Host + ':' + exports.defaultValues.a2Port + '/';

exports.testValues.a2AdminUsername = exports.defaultValues.a2AdminUsername;
exports.testValues.a2AdminPassword = exports.defaultValues.a2AdminPassword;

exports.defaultValues.apiPath = 'http://' + exports.defaultValues.a2Host + ':' + exports.defaultValues.a2Port + '/api';
exports.testValues.apiPath = exports.defaultValues.apiPath;