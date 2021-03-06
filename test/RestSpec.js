"use strict";

var Promise = require('bluebird'),
    common = require('../'),
    httpClient = new common.net.HttpClient(),
    memCacheProvider = new common.net.MemCacheProvider(),
    memCacheHttpClient = new common.net.MemCacheHttpClient(httpClient, memCacheProvider),
    RestAdapter = require('../lib/rest/RestAdapter'),
    TestInterface = require('./fixtures/TestInterface'),
    TestType = require('./fixtures/TestType'),
    TestType2 = require('./fixtures/TestType2'),
    GsonParser = common.net.GsonParser,
    StrictGsonParser = common.net.StrictGsonParser,
    _ = require('lodash');

describe('Rest', function () {

    var restAdapter = null;

    beforeEach(function () {
        restAdapter = new RestAdapter(httpClient);
    });

    it("should build a service for rest", function () {
        spyOn(httpClient, "get").and.returnValue(Promise.resolve());
        var service = restAdapter.create(TestInterface);

        expect(service.getList).toBeDefined();
        expect(service.getList() instanceof Promise).toBe(true);
        expect(httpClient.get.calls.argsFor(0)[0]).toEqual("getListApi");
    });

    describe("when an endpoint is provided", function () {

        it("should build a service for rest with an endpoint", function () {
            spyOn(httpClient, "get").and.returnValue(Promise.resolve());
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.getList();
            expect(httpClient.get.calls.argsFor(0)[0]).toEqual("http://endpoint.com/getListApi");
        });

        it("should create a post method on the service", function () {
            spyOn(httpClient, "post").and.returnValue(Promise.resolve());
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.addList();
            expect(httpClient.post.calls.argsFor(0)[0]).toEqual("http://endpoint.com/addListApi");
        });

        it("should create a delete method on the service", function () {
            spyOn(httpClient, "delete").and.returnValue(Promise.resolve());
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.deleteList();
            expect(httpClient.delete.calls.argsFor(0)[0]).toEqual("http://endpoint.com/deleteListApi");
        });

        it("should create a put method on the service", function () {
            spyOn(httpClient, "put").and.returnValue(Promise.resolve());
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.updateList();
            expect(httpClient.put.calls.argsFor(0)[0]).toEqual("http://endpoint.com/updateListApi");
        });

        it("should create a jsonp method on the service", function () {
            spyOn(httpClient, "jsonp").and.returnValue(Promise.resolve());
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.jsonpList();
            expect(httpClient.jsonp.calls.argsFor(0)[0]).toEqual("http://endpoint.com/jsonpListApi");
        });

        it("should create a multipart method on the service", function () {
            spyOn(httpClient, "multipart").and.returnValue(Promise.resolve());
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.multipartImage();
            expect(httpClient.multipart.calls.argsFor(0)[0]).toEqual("http://endpoint.com/multipartImage");
        });

        describe("and you need different http clients", function () {

            it("should use the right http client", function () {
                spyOn(httpClient, "get").and.returnValue(Promise.resolve());
                spyOn(memCacheHttpClient, "get").and.returnValue(Promise.resolve());
                restAdapter.setEndpoint("http://endpoint.com/");
                restAdapter.setHttpClientHandler(function (config, method) {
                    if (method === "getList")
                        return memCacheHttpClient;
                });
                var service = restAdapter.create(TestInterface);
                service.getList();
                service.getListMultiParse();

                var firstCallArguments = memCacheHttpClient.get.calls.argsFor(0),
                    secondCallArguments = httpClient.get.calls.argsFor(0);
                expect(firstCallArguments[0]).toEqual("http://endpoint.com/getListApi");
                expect(secondCallArguments[0]).toEqual("http://endpoint.com/getListApi");
            });
        });
    });

    describe("when data needs to be parsed", function () {

        it("should parse the result with the parser specified", function () {
            spyOn(httpClient, "get").and.returnValue(Promise.resolve());
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.getList();
            var args = httpClient.get.calls.argsFor(0);
            expect(args[0]).toEqual("http://endpoint.com/getListApi");
            expect(args[1]._gson._types[0]).toEqual(TestType);
        });

        it("should return the result as-is if no parser is specified", function (done) {
            spyOn(httpClient, "get").and.returnValue(Promise.resolve({'description': 'desc'}));
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.getListNoParse().then(function (response) {
                var args = httpClient.get.calls.argsFor(0);
                expect(response.description).toEqual('desc');
                expect(args[0]).toEqual("http://endpoint.com/getListApi");
                expect(args[1]).toBe(null);
                done();
            });
        });

        it("should parse an array of types", function () {
            spyOn(httpClient, "get").and.returnValue(Promise.resolve());
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.getListMultiParse();
            var args = httpClient.get.calls.argsFor(0);
            expect(args[0]).toEqual("http://endpoint.com/getListApi");
            expect(args[1] instanceof GsonParser).toBe(true);
            expect(args[1]._gson._types[0]).toEqual(TestType);
            expect(args[1]._gson._types[1]).toEqual(TestType2);
        });

        describe("and you need different parser", function () {

            it("should use a specific parser", function () {
                spyOn(httpClient, "get").and.returnValue(Promise.resolve());
                restAdapter.setEndpoint("http://endpoint.com/");
                restAdapter.setParserHandler(function (config, method, type) {
                    if (method === "getList")
                        return new StrictGsonParser([type]);
                });
                var service = restAdapter.create(TestInterface);
                service.getList();
                service.getListMultiParse();

                var firstCallArguments = httpClient.get.calls.argsFor(0),
                    secondCallArguments = httpClient.get.calls.argsFor(1);
                expect(firstCallArguments[0]).toEqual("http://endpoint.com/getListApi");
                expect(firstCallArguments[1] instanceof StrictGsonParser).toBe(true);
                expect(secondCallArguments[0]).toEqual("http://endpoint.com/getListApi");
                expect(secondCallArguments[1] instanceof GsonParser).toBe(true);
            });
        });
    });

    describe("when you pass parameters to the service", function () {

        it("should substitute the url param if matches", function () {
            spyOn(httpClient, "get").and.returnValue(Promise.resolve({'description': 'desc'}));
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.getListWithId(55);
            expect(httpClient.get.calls.argsFor(0)[0]).toEqual("http://endpoint.com/getListApi/55");
        });

        it("should substitute the query string param if matches", function () {
            spyOn(httpClient, "get").and.returnValue(Promise.resolve({'description': 'desc'}));
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.getListWithIdAndQuery(55, 'couch');
            expect(httpClient.get.calls.argsFor(0)[0]).toEqual("http://endpoint.com/getListApi/55?query=couch");
        });

        it("should substitute multiple query string param if match", function () {
            spyOn(httpClient, "get").and.returnValue(Promise.resolve({'description': 'desc'}));
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.getListWithIdAndMultipleParams(55, 'couch', 'foo');
            expect(httpClient.get.calls.argsFor(0)[0]).toEqual("http://endpoint.com/getListApi/55?query=couch&test=foo");
        });

        it("should preserve url during multiple params substitutions", function () {
            spyOn(httpClient, "get").and.returnValue(Promise.resolve({'description': 'desc'}));
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.getListWithIdAndMultipleParams(55, 'couch', 'foo');
            expect(httpClient.get.calls.argsFor(0)[0]).toEqual("http://endpoint.com/getListApi/55?query=couch&test=foo");

            service.getListWithIdAndMultipleParams(55, 'couch2', 'foo2');
            expect(httpClient.get.calls.argsFor(1)[0]).toEqual("http://endpoint.com/getListApi/55?query=couch2&test=foo2");
        });

        it("should pass an object to the body post", function () {
            spyOn(httpClient, "post").and.returnValue(Promise.resolve({'description': 'desc'}));
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.addListWithIdAndData(60, {
                "description": "test list"
            });

            expect(httpClient.post).toHaveBeenCalledWith("http://endpoint.com/addListApi/60", {
                "description": "test list"
            }, null);
        });

        it("should pass an object also to the put body", function () {
            spyOn(httpClient, "put").and.returnValue(Promise.resolve({'description': 'desc'}));
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.updateListWithIdAndData(60, {
                "description": "test list"
            });

            expect(httpClient.put).toHaveBeenCalledWith("http://endpoint.com/updateListApi/60", {
                "description": "test list"
            }, null);
        });

        it("should pass an object also to the multipart body", function () {
            spyOn(httpClient, "multipart").and.returnValue(Promise.resolve({'description': 'desc'}));
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.multipartListWithIdAndData(60, {
                "description": "test list"
            });

            expect(httpClient.multipart).toHaveBeenCalledWith("http://endpoint.com/updateListApi/60", {
                "description": "test list"
            }, null);
        });

        it("should substitute the url params also if the placeholder has a name", function () {
            spyOn(httpClient, "get").and.returnValue(Promise.resolve({'description': 'desc'}));
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.getListWithIdName(55);
            expect(httpClient.get.calls.argsFor(0)[0]).toEqual("http://endpoint.com/getListApi/55");
        });

        it("should strip the placeholder if nothing is passed", function () {
            spyOn(httpClient, "get").and.returnValue(Promise.resolve({'description': 'desc'}));
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.getListWithIdName();
            expect(httpClient.get.calls.argsFor(0)[0]).toEqual("http://endpoint.com/getListApi/");
        });

        it("should not strip the placeholder if 0 is passed", function () {
            spyOn(httpClient, "get").and.returnValue(Promise.resolve({'description': 'desc'}));
            restAdapter.setEndpoint("http://endpoint.com/");
            var service = restAdapter.create(TestInterface);

            service.getListWithIdAndMultipleParams(10, 0);
            expect(httpClient.get.calls.argsFor(0)[0]).toEqual("http://endpoint.com/getListApi/10?query=0&test=");
        });
    });

    it("should add a loader to the service", function () {
        spyOn(httpClient, "get").and.returnValue(Promise.resolve());
        restAdapter.setEndpoint("http://endpoint.com/");
        var service = restAdapter.create(TestInterface);

        service.getList();
        expect(httpClient.get.calls.argsFor(0)[0]).toEqual("http://endpoint.com/getListApi");
        expect(service.getList.loading).toBe(true);
    });

    it("should remove the loader from a service", function (done) {
        spyOn(httpClient, "get").and.returnValue(Promise.resolve());
        restAdapter.setEndpoint("http://endpoint.com/");
        var service = restAdapter.create(TestInterface);

        service.getList().finally(function () {
            expect(service.getList.loading).toBe(false);
            done();
        })
    });
});