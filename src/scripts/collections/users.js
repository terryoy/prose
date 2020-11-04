import Backbone from 'backbone';
// var User = require('../models/user');
// import { Config } from '../config';
import { User } from '../models/user';

module.exports = Backbone.Collection.extend({
  model: User
});
