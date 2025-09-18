import Backbone from 'backbone';
// import User from '../models/user';
// import { Config } from '../config';
import { User } from '../models/user';

const Users = Backbone.Collection.extend({
  model: User
});

export default Users;
