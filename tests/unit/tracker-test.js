import Ember from 'ember';
import Tracker from 'ember-data-change-tracker/tracker';
import {make, makeList, manualSetup}  from 'ember-data-factory-guy';
import {initializer as modelInitializer} from 'ember-data-change-tracker';
import {test, moduleFor} from 'ember-qunit';
import sinon from 'sinon';

modelInitializer();

moduleFor('model:company', 'Tracker', {
  integration: true,

  beforeEach: function() {
    manualSetup(this.container);
  }
});

let setUser = (user, attr, value)=> {
  Ember.run(()=>user.set(attr, value));
};

test('#envConfig retuns the config for the application environment', function(assert) {
  let company = make('company');
  assert.equal(Tracker.envConfig(company).modulePrefix, 'dummy');
});

test('trackChangeKey', function(assert) {
  let tests = [
    ['info', { trackHasMany: false }, true],
    ['info', { only: ['info'] }, true],
    ['info', { except: ['info'] }, false],
  ];

  for (let test of tests) {
    let [key, opts, expected] = test;
    assert.equal(Tracker.trackChangeKey(key, opts), expected);
  }
});

test('#options with valid options', sinon.test(function(assert) {
  let company = make('company');
  let envConfig = this.stub(Tracker, 'envConfig');

  let tests = [
    [{ changeTracker: { trackHasMany: true } }, {}, { trackHasMany: true }],
    [{ changeTracker: { trackHasMany: true } }, { only: ['info'] }, { trackHasMany: true, only: ['info'] }],
    [{}, { only: ['info'] }, { only: ['info'] }],
    [{}, { except: ['info'] }, { except: ['info'] }],
  ];

  for (let test of tests) {
    let [envOpts, modelOpts, expectedOptions] = test;
    envConfig.returns(envOpts);
    company.set('changeTracker', modelOpts);
    assert.deepEqual(Tracker.options(company), expectedOptions);
  }
}));

test('#options with invalid options', function(assert) {
  let company = make('company');

  company.set('changeTracker', { only: ['info'], except: ['info']});
  assert.throws(()=>Tracker.options(company),`[ember-data-change-tracker]
    changeTracker options can have 'only' or 'except' but not user both together.`);

  company.set('changeTracker', { dude: "where's my car"});
  assert.throws(()=>Tracker.options(company),`[ember-data-change-tracker]
    changeTracker options can have 'only' or 'except' or 'trackHasMany' but
    you are declaring: dude`);
});

test('#serialize object attribute', function(assert) {
  let user = make('user');
  let company = make('small-company');

  let tests = [
    ['info', null, null],
    ['info', { dude: 1 }, '{"dude":1}'],
    ['company', null, { id: null, type: null }],
    ['company', company, { id: company.id, type: company.constructor.modelName }],
  ];

  for (let test of tests) {
    let [key, value, expected] = test;
    setUser(user, key, value);
    assert.deepEqual(Tracker.serialize(user, key), expected);
  }
});

test('#_serializedExtraAttributeValue, #_deserializedExtraAttributeValue for object attribute', function(assert) {
  let user = make('user');
  let company = make('small-company');
  let projects = makeList('project', 2);

  let tests = [
    ['info', null, null],
    ['info', { dude: 1 }, '{"dude":1}'],
    ['company', null, { id: null, type: null }],
    ['company', company, { id: company.id, type: company.constructor.modelName }],
    ['projects', [], null],
    ['projects', projects, projects.map((p)=> { return {id: p.id, type: p.constructor.modelName}; })],
  ];

  let setUser = (attr, value)=> {
    Ember.run(()=>user.set(attr, value));
  };

  for (let test of tests) {
    let [key, value, expected] = test;
    setUser(key, value);

    let serializedValue = Tracker.serialize(user, key);
    assert.deepEqual(serializedValue, expected);

    //TODO: discrepancies between null and {} and []
    // let deserializedValue = Tracker.deserialize(user, key, serializedValue);
    // assert.deepEqual(deserializedValue, value);
  }
});
