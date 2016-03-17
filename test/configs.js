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

var should = require('should');

var configValues;
var config;
var testConfig;

describe('Config files  validations', function () {

    it('should return a correct config-values file', function (done) {
        configValues = require('../app/config-values.js');
        var keys = Object.keys(configValues);
        should(keys.length).equal(2);
        should(keys).containDeep(['defaultValues', 'testValues']);

        var defaultKeys = Object.keys(configValues.defaultValues);
        var testKeys = Object.keys(configValues.testValues);
        should(defaultKeys.length).equal(testKeys.length);
        should(defaultKeys).containDeep(testKeys);

        done();
    });

    it('should have generated correctly the config files', function (done) {
        config = require('../app/config.js');
        testConfig = require('../app/config-test.js');

        var configKeys = Object.keys(config);
        var testConfigKeys = Object.keys(testConfig);

        should(configKeys.length).equal(testConfigKeys.length);
        should(configKeys).containDeep(testConfigKeys);

        var toType = function(obj) {
            return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        };

        configKeys.forEach(function(configKey) {
            should(toType(configKeys[configKey])).equal(toType(testConfigKeys[configKey]));
        });

        done();
    });

    it('should have a correct content (config files)', function (done) {
        /**
         * exports.port = process.env.PORT || '3350';
         * exports.apiPath = 'http://localhost:3000/api';
         * exports.companyName = 'e-UCM Research Group';
         * exports.projectName = 'Analytics Frontend';
         */

        should(config.port).be.a.String();
        should(config.apiPath).be.a.String();
        should(config.apiPath.indexOf('http')).equal(0);
        should(config.companyName).be.a.String();
        should(config.projectName).be.a.String();

        should(testConfig.port).be.a.String();
        should(testConfig.apiPath).be.a.String();
        should(testConfig.apiPath.indexOf('http')).equal(0);
        should(testConfig.companyName).be.a.String();
        should(testConfig.projectName).be.a.String();

        done();
    });

    it('should have generated a correct env-vars file', function (done) {
        global.location = {
            origin: 'http://localhost:3000'
        };
        global.angular = {
            module: function(moduleName, moduleArgs) {
                return {
                    constant: function(name, arg) {
                        /**
                         * APIPATH: 'location.protocol + // + location.hostname + :3000/api',
                         * PREFIX: '{{appPrefix}}',
                         * PROXY: 'location.protocol + // + location.hostname + :3000/api/proxy/{{appPrefix}}'
                         */
                        should(name).equal('CONSTANTS');
                        var apiPathKey = 'apiPath';
                        var apiPathValue = 'http://localhost:3000/api';
                        should(configValues.defaultValues[apiPathKey]).be.a.String();
                        should(arg.APIPATH).equal(apiPathValue);

                        var prefixKey = 'appPrefix';
                        should(configValues.defaultValues[prefixKey]).be.a.String();
                        should(arg.PREFIX).equal('{{' + prefixKey + '}}');
                        should(arg.PROXY).equal(apiPathValue + '/proxy/{{' + prefixKey + '}}');
                    }
                };
            }
        };

        require('../app/public/js/env-vars-example.js');

        global.angular = {
            module: function(moduleName, moduleArgs) {
                return {
                    constant: function(name, arg) {
                        should(name).equal('CONSTANTS');
                        should(arg.APIPATH).equal(config.apiPath);
                        should(arg.PREFIX).equal(configValues.defaultValues.appPrefix);
                        should(arg.PROXY).equal(config.apiPath + '/proxy/' + configValues.defaultValues.appPrefix);
                    }
                };
            }
        };

        require('../app/public/js/env-vars.js');

        done();
    });

});