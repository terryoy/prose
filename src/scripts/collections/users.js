import Backbone from 'backbone';
var User = require('../models/user');
// import { Config } from '../config';

module.exports = Backbone.Collection.extend({
  model: User
});
