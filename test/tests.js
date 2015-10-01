'use strict';

var app = require('../app/app');

var should = require('should'),
    request = require('supertest')(app);

describe('Some tests', function () {
    this.timeout(4000);

    before(function (done) {
        done();
    });

    after(function () {

    });

    it('should return status 200', function (done) {
        request.get('/health')
            .expect(200)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .end(function (err, res) {
                should.not.exist(err);
                done();
            });
    });
});