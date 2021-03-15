import Backbone from 'backbone';
// import User from '../models/user';
// import { Config } from '../config';
import { User } from '../models/user';

module.exports = Backbone.Collection.extend({
  model: User
});
